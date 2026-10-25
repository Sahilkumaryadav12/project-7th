const Medicine = require('../models/Medicine');
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
    const { name, dosage, frequency, startDate, endDate, reminderTimes, foodInstruction, notes } = req.body;

    if (!name || !dosage || !frequency || !startDate || !Array.isArray(reminderTimes) || reminderTimes.length === 0) {
      return res.status(400).json({ error: 'Name, dosage, frequency, and start date are required' });
    }
    if (reminderTimes.some(time => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) return res.status(422).json({ error: 'Reminder times must use 24-hour HH:mm format' });

    const medicine = await Medicine.create({
      userId: req.user._id,
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
  getMedicineById,
  updateMedicine,
  deleteMedicine,
};
