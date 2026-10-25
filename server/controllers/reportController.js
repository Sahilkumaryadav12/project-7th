const MedicationLog = require('../models/MedicationLog');
const Medicine = require('../models/Medicine');
const { calculateCompliance } = require('../services/complianceService');
const { materializeLogsForDateRange, normalizeToMidnight, getTodayForUser } = require('../services/doseGeneratorService');

const getWeeklyReport = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const todayMidnight = await getTodayForUser(userId);

    const sixDaysAgo = new Date(todayMidnight);
    sixDaysAgo.setUTCDate(sixDaysAgo.getUTCDate() - 6);

    await materializeLogsForDateRange(userId, sixDaysAgo, todayMidnight);

    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sixDaysAgo);
      d.setUTCDate(d.getUTCDate() + i);
      const normalizedD = normalizeToMidnight(d);

      const logs = await MedicationLog.find({
        userId,
        scheduledDate: normalizedD,
      });

      const compliance = calculateCompliance(logs);
      days.push({
        day: dayNames[normalizedD.getUTCDay()],
        date: normalizedD.toISOString().split('T')[0],
        compliance,
      });
    }

    res.status(200).json({ days });
  } catch (err) {
    next(err);
  }
};

const getMonthlyReport = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const todayMidnight = await getTodayForUser(userId);

    const thirtyDaysAgo = new Date(todayMidnight);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

    const sixtyDaysAgo = new Date(todayMidnight);
    sixtyDaysAgo.setUTCDate(sixtyDaysAgo.getUTCDate() - 59);

    await materializeLogsForDateRange(userId, thirtyDaysAgo, todayMidnight);

    // Current 30 days logs
    const currentLogs = await MedicationLog.find({
      userId,
      scheduledDate: { $gte: thirtyDaysAgo, $lte: todayMidnight },
    });
    const overallCompliance = calculateCompliance(currentLogs);

    // Previous 30 days logs (for percentage change calculation)
    const prev30Start = new Date(sixtyDaysAgo);
    const prev30End = new Date(thirtyDaysAgo);
    prev30End.setUTCDate(prev30End.getUTCDate() - 1);

    const prevLogs = await MedicationLog.find({
      userId,
      scheduledDate: { $gte: prev30Start, $lte: prev30End },
    });
    const prevCompliance = calculateCompliance(prevLogs);
    const monthlyChangePercent = Math.round((overallCompliance - prevCompliance) * 10) / 10;

    // Per-medicine breakdown
    const medicines = await Medicine.find({ userId });
    const perMedicine = await Promise.all(
      medicines.map(async (med) => {
        const medLogs = await MedicationLog.find({
          userId,
          medicineId: med._id,
          scheduledDate: { $gte: thirtyDaysAgo, $lte: todayMidnight },
        });
        return {
          id: med._id,
          name: med.name,
          dosage: med.dosage,
          compliance: calculateCompliance(medLogs),
        };
      })
    );

    res.status(200).json({
      overallCompliance,
      monthlyChangePercent,
      perMedicine,
    });
  } catch (err) {
    next(err);
  }
};

const getDailyReport = async (req, res, next) => {
  try {
    const today = req.query.date ? normalizeToMidnight(req.query.date) : await getTodayForUser(req.user._id);
    await materializeLogsForDateRange(req.user._id, today, today);
    const logs = await MedicationLog.find({ userId: req.user._id, scheduledDate: today });
    const taken = logs.filter(log => log.status === 'taken').length;
    const missed = logs.filter(log => log.status === 'missed').length;
    res.json({ totalScheduled: logs.length, taken, missed, upcoming: logs.filter(log => ['upcoming', 'snoozed'].includes(log.status)).length, compliance: calculateCompliance(logs), date: today.toISOString().slice(0, 10) });
  } catch (err) { next(err); }
};

const getMedicineReport = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, userId: req.user._id });
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    const since = normalizeToMidnight(req.query.startDate || new Date(Date.now() - 29 * 86400000));
    const until = normalizeToMidnight(req.query.endDate || new Date());
    const logs = await MedicationLog.find({ userId: req.user._id, medicineId: medicine._id, scheduledDate: { $gte: since, $lte: until } });
    res.json({ medicine: { id: medicine._id, name: medicine.name }, totalScheduled: logs.length, taken: logs.filter(log => log.status === 'taken').length, missed: logs.filter(log => log.status === 'missed').length, upcoming: logs.filter(log => ['upcoming', 'snoozed'].includes(log.status)).length, compliance: calculateCompliance(logs) });
  } catch (err) { next(err); }
};

module.exports = {
  getWeeklyReport,
  getMonthlyReport,
  getDailyReport,
  getMedicineReport,
};
