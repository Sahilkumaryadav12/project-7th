const Medicine = require('../models/Medicine');
const MedicationLog = require('../models/MedicationLog');
const { calculateCompliance } = require('../services/complianceService');
const { materializeLogsForUserDate } = require('../services/doseGeneratorService');

const getMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ userId: req.user._id }).sort({ createdAt: -1 });

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

    if (!name || !dosage || !frequency || !startDate) {
      return res.status(400).json({ error: 'Name, dosage, frequency, and start date are required' });
    }

    const medicine = await Medicine.create({
      userId: req.user._id,
      name,
      dosage,
      frequency,
      startDate,
      endDate: endDate || null,
      reminderTimes: reminderTimes || ['08:00'],
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

    // Perform cascade delete of logs or set isActive to false
    await MedicationLog.deleteMany({ medicineId: medicine._id });
    await Medicine.deleteOne({ _id: medicine._id });

    res.status(200).json({ message: 'Medicine and associated logs deleted successfully' });
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
