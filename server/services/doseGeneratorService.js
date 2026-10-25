const Medicine = require('../models/Medicine');
const MedicationLog = require('../models/MedicationLog');
const UserSettings = require('../models/UserSettings');
const { dateKeyInTimezone, localDateTimeToUtc, dateKeyToUtcMidnight } = require('../utils/dateUtils');

/**
 * Schedule dates are stored as UTC date keys; reminderTimes are interpreted as local wall-clock times.
 */
const normalizeToMidnight = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const getTodayForUser = async userId => {
  const settings = await UserSettings.findOne({ userId }).select('timezone').lean();
  return dateKeyToUtcMidnight(dateKeyInTimezone(new Date(), settings?.timezone || 'UTC'));
};

/**
 * Ensures MedicationLog entries exist for a given user and target date,
 * and updates overdue upcoming doses to 'missed'.
 */
const materializeLogsForUserDate = async (userId, targetDate = new Date()) => {
  const settings = await UserSettings.findOne({ userId }).select('timezone').lean();
  const timeZone = settings?.timezone || 'UTC';
  const dateKey = typeof targetDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)
    ? targetDate
    : dateKeyInTimezone(targetDate, timeZone);
  const normalizedTarget = dateKeyToUtcMidnight(dateKey);
  const now = new Date();
  const currentNormalized = await getTodayForUser(userId);

  const graceMs = Math.max(0, Number(process.env.MISSED_DOSE_GRACE_MINUTES || 60)) * 60 * 1000;
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
      // Calculate full timestamp of scheduled dose
      const doseTime = localDateTimeToUtc(dateKey, timeStr, timeZone);

      // Determine initial status:
      // If targetDate is today or past date, and doseTime < now, status defaults to 'missed' if not already logged.
      // If doseTime > now, status is 'upcoming'.
      let initialStatus = 'upcoming';
      if (doseTime.getTime() + graceMs < now.getTime()) {
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
              scheduledAt: doseTime,
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
    const logTime = localDateTimeToUtc(dateKeyInTimezone(log.scheduledDate, 'UTC'), log.scheduledTime, timeZone);

    if (log.status === 'snoozed' && log.snoozedUntil) {
      // If snoozed until past time + grace period (e.g. 1 hour past snoozedUntil), flip to missed
      if (new Date(log.snoozedUntil) < now) {
        log.status = 'missed';
        await log.save();
      }
    } else if (log.status === 'upcoming' && logTime.getTime() + graceMs < now.getTime()) {
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
    await materializeLogsForUserDate(userId, current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
};

module.exports = {
  normalizeToMidnight,
  getTodayForUser,
  materializeLogsForUserDate,
  materializeLogsForDateRange,
};
