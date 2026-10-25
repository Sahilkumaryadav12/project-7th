const Notification = require('../models/Notification');
const MedicationLog = require('../models/MedicationLog');
const { getTodayForUser, materializeLogsForUserDate } = require('../services/doseGeneratorService');

const getNotifications = async (req, res, next) => {
  try {
    const today = await getTodayForUser(req.user._id);
    await materializeLogsForUserDate(req.user._id, today.toISOString().slice(0, 10));
    const logs = await MedicationLog.find({ userId: req.user._id, scheduledDate: today }).populate('medicineId');
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);
    for (const log of logs) {
      const dueAt = log.scheduledAt || new Date(log.scheduledDate);
      const upcoming = ['upcoming', 'snoozed'].includes(log.status) && dueAt <= windowEnd && (!log.snoozedUntil || log.snoozedUntil <= now);
      const missed = log.status === 'missed';
      if (!upcoming && !missed) continue;
      const type = missed ? 'missed' : 'upcoming';
      await Notification.updateOne(
        { userId: req.user._id, medicationLogId: log._id, type },
        { $setOnInsert: { userId: req.user._id, medicationLogId: log._id, type, message: `${log.medicineId?.name || 'Medication'} ${missed ? 'was missed' : 'is due soon'}` } },
        { upsert: true }
      );
    }
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100).populate({ path: 'medicationLogId', populate: { path: 'medicineId' } });
    res.json(notifications);
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) { next(err); }
};

const snoozeReminder = async (req, res, next) => {
  try {
    const minutes = Number(req.body.minutes || 15);
    if (![15, 30, 60].includes(minutes)) return res.status(422).json({ error: 'Snooze duration must be 15, 30, or 60 minutes' });
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!notification) return res.status(404).json({ error: 'Reminder not found' });
    notification.snoozedUntil = new Date(Date.now() + minutes * 60000);
    await notification.save();
    const log = await MedicationLog.findOne({ _id: notification.medicationLogId, userId: req.user._id });
    if (log && ['upcoming', 'snoozed'].includes(log.status)) {
      log.status = 'snoozed';
      log.snoozedUntil = notification.snoozedUntil;
      await log.save();
    }
    res.json(notification);
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markRead, snoozeReminder };
