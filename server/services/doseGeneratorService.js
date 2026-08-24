const Medicine = require('../models/Medicine');
const MedicationLog = require('../models/MedicationLog');

/**
 * Normalizes a Date object to midnight local time (00:00:00.000)
 */
const normalizeToMidnight = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Ensures MedicationLog entries exist for a given user and target date,
 * and updates overdue upcoming doses to 'missed'.
 */
const materializeLogsForUserDate = async (userId, targetDate = new Date()) => {
  const normalizedTarget = normalizeToMidnight(targetDate);
  const now = new Date();
  const currentNormalized = normalizeToMidnight(now);

  // Fetch all active medicines for the user
  const medicines = await Medicine.find({
    userId,
    isActive: true,
  });

  for (const med of medicines) {
    const medStart = normalizeToMidnight(med.startDate);
    const medEnd = med.endDate ? normalizeToMidnight(med.endDate) : null;

    // Check if targetDate is within [startDate, endDate]
    if (normalizedTarget < medStart) continue;
    if (medEnd && normalizedTarget > medEnd) continue;

    const reminderTimes = med.reminderTimes && med.reminderTimes.length > 0
      ? med.reminderTimes
      : ['08:00'];

    for (const timeStr of reminderTimes) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Calculate full timestamp of scheduled dose
      const doseTime = new Date(normalizedTarget);
      doseTime.setHours(hours, minutes, 0, 0);

      // Determine initial status:
      // If targetDate is today or past date, and doseTime < now, status defaults to 'missed' if not already logged.
      // If doseTime > now, status is 'upcoming'.
      let initialStatus = 'upcoming';
      if (doseTime < now) {
        initialStatus = 'missed';
      }

      try {
        await MedicationLog.updateOne(
          {
            userId,
            medicineId: med._id,
            scheduledDate: normalizedTarget,
            scheduledTime: timeStr,
          },
          {
            $setOnInsert: {
              userId,
              medicineId: med._id,
              scheduledDate: normalizedTarget,
              scheduledTime: timeStr,
              status: initialStatus,
            },
          },
          { upsert: true }
        );
      } catch (err) {
        // Ignore duplicate key errors if concurrent inserts happen
        if (err.code !== 11000) {
          console.error(`[DoseGenerator] Error upserting log:`, err.message);
        }
      }
    }
  }

  // Auto-flip existing 'upcoming' or 'snoozed' (whose snoozedUntil passed) past-due logs to 'missed'
  const overdueLogs = await MedicationLog.find({
    userId,
    status: { $in: ['upcoming', 'snoozed'] },
    scheduledDate: { $lte: currentNormalized },
  });

  for (const log of overdueLogs) {
    const [hours, minutes] = log.scheduledTime.split(':').map(Number);
    const logTime = new Date(log.scheduledDate);
    logTime.setHours(hours, minutes, 0, 0);

    if (log.status === 'snoozed' && log.snoozedUntil) {
      // If snoozed until past time + grace period (e.g. 1 hour past snoozedUntil), flip to missed
      if (new Date(log.snoozedUntil) < new Date(now.getTime() - 60 * 60 * 1000)) {
        log.status = 'missed';
        await log.save();
      }
    } else if (log.status === 'upcoming' && logTime < now) {
      log.status = 'missed';
      await log.save();
    }
  }
};

/**
 * Materializes logs across a range of dates (e.g. for history/reports)
 */
const materializeLogsForDateRange = async (userId, startDate, endDate) => {
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    await materializeLogsForUserDate(userId, current);
    current.setDate(current.getDate() + 1);
  }
};

module.exports = {
  normalizeToMidnight,
  materializeLogsForUserDate,
  materializeLogsForDateRange,
};
