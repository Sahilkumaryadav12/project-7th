const cron = require('node-cron');
const User = require('../models/User');
const MedicationLog = require('../models/MedicationLog');
const Notification = require('../models/Notification');
const { getTodayForUser, materializeLogsForUserDate } = require('./doseGeneratorService');

const checkUserReminders = async userId => {
  const today = await getTodayForUser(userId);
  await materializeLogsForUserDate(userId, today.toISOString().slice(0, 10));
  const logs = await MedicationLog.find({ userId, scheduledDate: today }).populate('medicineId');
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);
  for (const log of logs) {
    const dueAt = log.scheduledAt || new Date(log.scheduledDate);
    const isUpcoming = ['upcoming', 'snoozed'].includes(log.status) && dueAt <= windowEnd && (!log.snoozedUntil || log.snoozedUntil <= now);
    const isMissed = log.status === 'missed';
    if (!isUpcoming && !isMissed) continue;
    const type = isMissed ? 'missed' : 'upcoming';
    await Notification.updateOne(
      { userId, medicationLogId: log._id, type },
      { $setOnInsert: { userId, medicationLogId: log._id, type, message: `${log.medicineId?.name || 'Medication'} ${isMissed ? 'was missed' : 'is due soon'}` } },
      { upsert: true }
    );
  }
};

const runReminderCheck = async () => {
  const users = await User.find({ role: 'patient' }).select('_id').lean();
  await Promise.all(users.map(user => checkUserReminders(user._id).catch(() => {})));
};

const startReminderScheduler = () => {
  const task = cron.schedule('* * * * *', () => {
    runReminderCheck().catch(err => console.error('[ReminderScheduler] Check failed', { error: err.name || 'Error' }));
  }, { timezone: 'UTC' });
  runReminderCheck().catch(err => console.error('[ReminderScheduler] Initial check failed', { error: err.name || 'Error' }));
  return task;
};

module.exports = { checkUserReminders, runReminderCheck, startReminderScheduler };
