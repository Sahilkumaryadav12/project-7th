const MedicationLog = require('../models/MedicationLog');
const { materializeLogsForUserDate, getTodayForUser } = require('../services/doseGeneratorService');

const getTodaySchedule = async (req, res, next) => {
  try {
    const today = await getTodayForUser(req.user._id);
    await materializeLogsForUserDate(req.user._id, today);
    const logs = await MedicationLog.find({ userId: req.user._id, scheduledDate: today })
      .populate('medicineId').sort({ scheduledTime: 1 });
    res.json({ success: true, data: logs.map(log => ({
      _id: log._id,
      medicineId: log.medicineId?._id,
      medicineName: log.medicineId?.name,
      dosage: log.medicineId?.dosage,
      scheduledDate: log.scheduledDate,
      scheduledTime: log.scheduledTime,
      status: log.status,
      foodInstruction: log.medicineId?.foodInstruction,
      takenAt: log.takenAt,
      snoozedUntil: log.snoozedUntil,
    })) });
  } catch (err) { next(err); }
};

module.exports = { getTodaySchedule };
