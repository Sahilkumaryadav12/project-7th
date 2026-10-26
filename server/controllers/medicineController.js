const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const MedicationLog = require('../models/MedicationLog');
const { calculateCompliance } = require('../services/complianceService');
const { materializeLogsForUserDate, getTodayForUser } = require('../services/doseGeneratorService');

const getMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ userId: req.user._id, isActive: true })
      .populate('prescriptionId', 'doctorName prescriptionDate fileUrl fileType notes')
      .sort({ createdAt: -1 });

    // Attach per-medicine compliance and formatted prescription metadata
    const medicinesWithCompliance = await Promise.all(
      medicines.map(async (med) => {
        const logs = await MedicationLog.find({ userId: req.user._id, medicineId: med._id });
        const compliance = calculateCompliance(logs);
        const medObj = med.toObject();
        if (medObj.prescriptionId && typeof medObj.prescriptionId === 'object' && medObj.prescriptionId._id) {
          medObj.prescription = {
            ...medObj.prescriptionId,
            fileUrl: `/api/prescriptions/${medObj.prescriptionId._id}/file`,
          };
        }
        return {
          ...medObj,
          compliance,
        };
      })
    );

    res.status(200).json(medicinesWithCompliance);
  } catch (err) {
    next(err);
  }
};

const createMedicine = async (req, res, next) => {
  try {
    const { name, dosage, frequency, startDate, endDate, reminderTimes, foodInstruction, notes, prescriptionId } = req.body;

    if (!name || !dosage || !frequency || !startDate || !Array.isArray(reminderTimes) || reminderTimes.length === 0) {
      return res.status(400).json({ error: 'Name, dosage, frequency, and start date are required' });
    }
    if (reminderTimes.some(time => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) return res.status(422).json({ error: 'Reminder times must use 24-hour HH:mm format' });

    if (prescriptionId) {
      const prescription = await Prescription.findOne({ _id: prescriptionId, userId: req.user._id }).select('_id');
      if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    }

    const medicine = await Medicine.create({
      userId: req.user._id,
      prescriptionId: prescriptionId || null,
      name,
      dosage,
      frequency,
      startDate,
      endDate: endDate || null,
      reminderTimes,
      foodInstruction: foodInstruction || 'no_restriction',
      notes: notes || '',
      isActive: true,
    });

    // Materialize today's logs immediately for this new medicine
    await materializeLogsForUserDate(req.user._id, new Date());

    res.status(201).json(medicine);
  } catch (err) {
    next(err);
  }
};

const bulkCreateMedicines = async (req, res, next) => {
  try {
    const { prescriptionId, medicines } = req.body;
    if (!prescriptionId || !Array.isArray(medicines) || medicines.length === 0 || medicines.length > 50) {
      return res.status(400).json({ error: 'A prescription and 1 to 50 medication entries are required' });
    }

    const prescription = await Prescription.findOne({ _id: prescriptionId, userId: req.user._id }).select('_id');
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

    const allowedFrequencies = ['once_daily', 'twice_daily', 'thrice_daily', 'four_times_daily', 'custom'];
    const expectedReminderCounts = { once_daily: 1, twice_daily: 2, thrice_daily: 3, four_times_daily: 4 };

    const processedMedicines = [];
    for (const [index, rawItem] of medicines.entries()) {
      if (!rawItem.name?.trim() || !rawItem.dosage?.trim() || !rawItem.startDate) {
        return res.status(422).json({ error: `Medication ${index + 1} needs a name, dosage, and start date` });
      }

      // Normalize reminder times (auto-pad e.g. 8:00 -> 08:00)
      let reminderTimes = Array.isArray(rawItem.reminderTimes)
        ? rawItem.reminderTimes.map(time => {
            const trimmed = String(time).trim();
            return /^\d:[0-5]\d$/.test(trimmed) ? `0${trimmed}` : trimmed;
          }).filter(Boolean)
        : [];

      if (reminderTimes.length === 0) reminderTimes = ['08:00'];

      if (reminderTimes.some(time => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
        return res.status(422).json({ error: `Medication ${index + 1} has an invalid reminder time. Use HH:mm format (e.g. 08:00)` });
      }

      let frequency = rawItem.frequency;
      if (!allowedFrequencies.includes(frequency)) frequency = 'once_daily';

      // If user selected standard frequency but provided different number of times, adjust to custom or default
      if (expectedReminderCounts[frequency] && reminderTimes.length !== expectedReminderCounts[frequency]) {
        if (reminderTimes.length > 0) {
          frequency = 'custom';
        }
      }

      if (Number.isNaN(new Date(rawItem.startDate).getTime()) || (rawItem.endDate && Number.isNaN(new Date(rawItem.endDate).getTime()))) {
        return res.status(422).json({ error: `Medication ${index + 1} has an invalid date` });
      }
      if (rawItem.endDate && rawItem.endDate < rawItem.startDate) {
        return res.status(422).json({ error: `Medication ${index + 1} ends before it starts` });
      }

      // Check if medicine with this name is already active for this prescription
      const alreadyExists = await Medicine.findOne({
        userId: req.user._id,
        prescriptionId,
        name: new RegExp(`^${rawItem.name.trim()}$`, 'i'),
        isActive: true,
      });
      if (alreadyExists) {
        return res.status(409).json({ error: `Medication "${rawItem.name.trim()}" is already tracked for this prescription` });
      }

      processedMedicines.push({
        userId: req.user._id,
        prescriptionId,
        name: rawItem.name.trim(),
        dosage: rawItem.dosage.trim(),
        frequency,
        startDate: rawItem.startDate,
        endDate: rawItem.endDate || null,
        reminderTimes: [...new Set(reminderTimes)],
        foodInstruction: rawItem.foodInstruction || 'no_restriction',
        notes: rawItem.notes || '',
        isActive: true,
      });
    }

    const createdMedicines = await Medicine.insertMany(processedMedicines);
    await materializeLogsForUserDate(req.user._id, new Date());
    res.status(201).json(createdMedicines);
  } catch (err) {
    next(err);
  }
};

const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('prescriptionId', 'doctorName prescriptionDate fileUrl fileType notes');
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const logs = await MedicationLog.find({ userId: req.user._id, medicineId: medicine._id });
    const compliance = calculateCompliance(logs);
    const medObj = medicine.toObject();
    if (medObj.prescriptionId && typeof medObj.prescriptionId === 'object' && medObj.prescriptionId._id) {
      medObj.prescription = {
        ...medObj.prescriptionId,
        fileUrl: `/api/prescriptions/${medObj.prescriptionId._id}/file`,
      };
    }

    res.status(200).json({
      ...medObj,
      compliance,
    });
  } catch (err) {
    next(err);
  }
};

const updateMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, userId: req.user._id });
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const { name, dosage, frequency, startDate, endDate, reminderTimes, foodInstruction, notes, isActive, prescriptionId } = req.body;

    if (name !== undefined) medicine.name = name;
    if (dosage !== undefined) medicine.dosage = dosage;
    if (frequency !== undefined) medicine.frequency = frequency;
    if (startDate !== undefined) medicine.startDate = startDate;
    if (endDate !== undefined) medicine.endDate = endDate;
    if (reminderTimes !== undefined) medicine.reminderTimes = reminderTimes;
    if (foodInstruction !== undefined) medicine.foodInstruction = foodInstruction;
    if (notes !== undefined) medicine.notes = notes;
    if (isActive !== undefined) medicine.isActive = isActive;
    if (prescriptionId !== undefined) medicine.prescriptionId = prescriptionId || null;

    await medicine.save();
    // Schedule changes only affect future unresolved doses; completed history stays intact.
    const today = await getTodayForUser(req.user._id);
    await MedicationLog.deleteMany({ userId: req.user._id, medicineId: medicine._id, scheduledDate: { $gte: today }, status: { $in: ['upcoming', 'snoozed'] } });

    res.status(200).json(medicine);
  } catch (err) {
    next(err);
  }
};

const deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, userId: req.user._id });
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    // Archive instead of deleting so historical dose records remain available.
    medicine.isActive = false;
    await medicine.save();

    res.status(200).json({ message: 'Medicine archived successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMedicines,
  createMedicine,
  bulkCreateMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
};
