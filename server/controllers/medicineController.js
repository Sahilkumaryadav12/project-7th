const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const MedicationLog = require('../models/MedicationLog');
const { calculateCompliance } = require('../services/complianceService');
const { materializeLogsForUserDate, getTodayForUser } = require('../services/doseGeneratorService');

const getMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ userId: req.user._id, isActive: true }).sort({ createdAt: -1 });

    // Attach per-medicine compliance
    const medicinesWithCompliance = await Promise.all(
      medicines.map(async (med) => {
        const logs = await MedicationLog.find({ userId: req.user._id, medicineId: med._id });
        const compliance = calculateCompliance(logs);
        return {
          ...med.toObject(),
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
    if (await Medicine.exists({ userId: req.user._id, prescriptionId })) {
      return res.status(409).json({ error: 'Medicines from this prescription have already been added to the tracker' });
    }

    const allowedFrequencies = ['once_daily', 'twice_daily', 'thrice_daily', 'four_times_daily', 'custom'];
    const expectedReminderCounts = { once_daily: 1, twice_daily: 2, thrice_daily: 3, four_times_daily: 4 };
    for (const [index, item] of medicines.entries()) {
      if (!item.name?.trim() || !item.dosage?.trim() || !allowedFrequencies.includes(item.frequency) || !item.startDate || !Array.isArray(item.reminderTimes) || item.reminderTimes.length === 0) {
        return res.status(422).json({ error: `Medication ${index + 1} needs a name, dosage, frequency, start date, and at least one reminder time` });
      }
      if (item.reminderTimes.some(time => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
        return res.status(422).json({ error: `Medication ${index + 1} has an invalid reminder time` });
      }
      if (Number.isNaN(new Date(item.startDate).getTime()) || (item.endDate && Number.isNaN(new Date(item.endDate).getTime()))) {
        return res.status(422).json({ error: `Medication ${index + 1} has an invalid date` });
      }
      if (item.endDate && item.endDate < item.startDate) {
        return res.status(422).json({ error: `Medication ${index + 1} ends before it starts` });
      }
      if (expectedReminderCounts[item.frequency] && item.reminderTimes.length !== expectedReminderCounts[item.frequency]) {
        return res.status(422).json({ error: `Medication ${index + 1} needs ${expectedReminderCounts[item.frequency]} reminder time(s) for the selected frequency` });
      }
      if (new Set(item.reminderTimes).size !== item.reminderTimes.length) {
        return res.status(422).json({ error: `Medication ${index + 1} has duplicate reminder times` });
      }
    }

    const createdMedicines = await Medicine.insertMany(medicines.map(item => ({
      userId: req.user._id,
      prescriptionId,
      name: item.name.trim(),
      dosage: item.dosage.trim(),
      frequency: item.frequency,
      startDate: item.startDate,
      endDate: item.endDate || null,
      reminderTimes: item.reminderTimes,
      foodInstruction: item.foodInstruction || 'no_restriction',
      notes: item.notes || '',
      isActive: true,
    })));

    await materializeLogsForUserDate(req.user._id, new Date());
    res.status(201).json(createdMedicines);
  } catch (err) {
    next(err);
  }
};

const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, userId: req.user._id });
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const logs = await MedicationLog.find({ userId: req.user._id, medicineId: medicine._id });
    const compliance = calculateCompliance(logs);

    res.status(200).json({
      ...medicine.toObject(),
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

    const { name, dosage, frequency, startDate, endDate, reminderTimes, foodInstruction, notes, isActive } = req.body;

    if (name !== undefined) medicine.name = name;
    if (dosage !== undefined) medicine.dosage = dosage;
    if (frequency !== undefined) medicine.frequency = frequency;
    if (startDate !== undefined) medicine.startDate = startDate;
    if (endDate !== undefined) medicine.endDate = endDate;
    if (reminderTimes !== undefined) medicine.reminderTimes = reminderTimes;
    if (foodInstruction !== undefined) medicine.foodInstruction = foodInstruction;
    if (notes !== undefined) medicine.notes = notes;
    if (isActive !== undefined) medicine.isActive = isActive;

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
