const MedicationLog = require('../models/MedicationLog');
const Medicine = require('../models/Medicine');
const { calculateCompliance } = require('../services/complianceService');
const { materializeLogsForDateRange, normalizeToMidnight } = require('../services/doseGeneratorService');

const getWeeklyReport = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayMidnight = normalizeToMidnight(now);

    const sixDaysAgo = new Date(todayMidnight);
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    await materializeLogsForDateRange(userId, sixDaysAgo, todayMidnight);

    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sixDaysAgo);
      d.setDate(d.getDate() + i);
      const normalizedD = normalizeToMidnight(d);

      const logs = await MedicationLog.find({
        userId,
        scheduledDate: normalizedD,
      });

      const compliance = calculateCompliance(logs);
      days.push({
        day: dayNames[normalizedD.getDay()],
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
    const now = new Date();
    const todayMidnight = normalizeToMidnight(now);

    const thirtyDaysAgo = new Date(todayMidnight);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const sixtyDaysAgo = new Date(todayMidnight);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 59);

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
    prev30End.setDate(prev30End.getDate() - 1);

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

module.exports = {
  getWeeklyReport,
  getMonthlyReport,
};
