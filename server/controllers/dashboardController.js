const MedicationLog = require('../models/MedicationLog');
const Medicine = require('../models/Medicine');
const { calculateCompliance } = require('../services/complianceService');
const { materializeLogsForUserDate, normalizeToMidnight } = require('../services/doseGeneratorService');

const getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayMidnight = normalizeToMidnight(now);

    // Materialize today's logs
    await materializeLogsForUserDate(userId, todayMidnight);

    // Fetch today's logs
    const todayLogs = await MedicationLog.find({
      userId,
      scheduledDate: todayMidnight,
    }).populate('medicineId').sort({ scheduledTime: 1 });

    const totalToday = todayLogs.length;
    const takenCount = todayLogs.filter(l => l.status === 'taken').length;
    const missedCount = todayLogs.filter(l => l.status === 'missed').length;
    const upcomingLogs = todayLogs.filter(l => l.status === 'upcoming' || l.status === 'snoozed');

    // Calculate next upcoming dose in minutes
    let nextInMinutes = null;
    if (upcomingLogs.length > 0) {
      const upcomingTimes = upcomingLogs.map(l => {
        const [h, m] = l.scheduledTime.split(':').map(Number);
        const t = new Date(todayMidnight);
        t.setHours(h, m, 0, 0);
        return t;
      }).filter(t => t > now);

      if (upcomingTimes.length > 0) {
        const earliest = new Date(Math.min(...upcomingTimes));
        nextInMinutes = Math.max(0, Math.round((earliest - now) / (1000 * 60)));
      }
    }

    // Weekly compliance calculation (past 7 days including today)
    const sevenDaysAgo = new Date(todayMidnight);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const pastWeekLogs = await MedicationLog.find({
      userId,
      scheduledDate: { $gte: sevenDaysAgo, $lte: todayMidnight },
    });

    const weeklyCompliance = calculateCompliance(pastWeekLogs);

    // Format todaySchedule
    const todaySchedule = todayLogs.map(log => ({
      log: {
        _id: log._id,
        scheduledDate: log.scheduledDate,
        scheduledTime: log.scheduledTime,
        status: log.status,
        takenAt: log.takenAt,
        snoozedUntil: log.snoozedUntil,
      },
      medicine: log.medicineId,
    }));

    res.status(200).json({
      takenToday: { count: takenCount, total: totalToday },
      missedToday: { count: missedCount, total: totalToday },
      upcoming: { count: upcomingLogs.length, nextInMinutes },
      weeklyCompliance,
      todaySchedule,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardData };
