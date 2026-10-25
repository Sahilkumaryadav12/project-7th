const MedicationLog = require('../models/MedicationLog');
const Medicine = require('../models/Medicine');
const UserSettings = require('../models/UserSettings');
const { localDateTimeToUtc } = require('../utils/dateUtils');
const { materializeLogsForUserDate, normalizeToMidnight, getTodayForUser } = require('../services/doseGeneratorService');

const getLogs = async (req, res, next) => {
  try {
    const { date, medicineId, status } = req.query;
    const userId = req.user._id;

    const queryDate = date || await getTodayForUser(userId);
    await materializeLogsForUserDate(userId, queryDate);

    const filter = { userId };

    if (date) {
      const targetMidnight = normalizeToMidnight(date);
      filter.scheduledDate = targetMidnight;
    }

    if (medicineId) {
      filter.medicineId = medicineId;
    }

    if (status) {
      filter.status = status;
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const paginated = req.query.page !== undefined || req.query.limit !== undefined;
    let find = MedicationLog.find(filter)
      .populate('medicineId')
      .sort({ scheduledDate: -1, scheduledTime: 1 });
    if (paginated) find = find.skip((page - 1) * limit).limit(limit);
    const logs = await find;

    if (paginated) return res.status(200).json({ data: logs, pagination: { page, limit, total: await MedicationLog.countDocuments(filter) } });
    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
};

const createOrUpsertLog = async (req, res, next) => {
  try {
    const { medicineId, scheduledDate, scheduledTime, status } = req.body;
    const userId = req.user._id;

    if (!medicineId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ error: 'medicineId, scheduledDate, and scheduledTime are required' });
    }
    const medicine = await Medicine.findOne({ _id: medicineId, userId, isActive: true });
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

    const normalizedDate = normalizeToMidnight(scheduledDate);
    const settings = await UserSettings.findOne({ userId }).select('timezone').lean();
    const scheduledAt = localDateTimeToUtc(normalizedDate.toISOString().slice(0, 10), scheduledTime, settings?.timezone || 'UTC');

    let takenAt = null;
    if (status === 'taken') {
      takenAt = new Date();
    }

    const log = await MedicationLog.findOneAndUpdate(
      { userId, medicineId, scheduledDate: normalizedDate, scheduledTime },
      {
        userId,
        medicineId,
        scheduledDate: normalizedDate,
        scheduledTime,
        scheduledAt,
        status: status || 'upcoming',
        takenAt: status === 'taken' ? takenAt : null,
      },
      { upsert: true, new: true, runValidators: true }
    ).populate('medicineId');

    res.status(200).json(log);
  } catch (err) {
    next(err);
  }
};

const updateLogStatus = async (req, res, next) => {
  try {
    const { status, snoozedMinutes } = req.body;
    const log = await MedicationLog.findOne({ _id: req.params.id, userId: req.user._id });

    if (!log) {
      return res.status(404).json({ error: 'Medication log not found' });
    }

    if (status) {
      if (!['taken', 'missed', 'upcoming', 'snoozed'].includes(status)) return res.status(422).json({ error: 'Invalid medication status' });
      if (status === 'snoozed' && ![15, 30, 60].includes(Number(snoozedMinutes || 15))) return res.status(422).json({ error: 'Snooze duration must be 15, 30, or 60 minutes' });
      log.status = status;
      if (status === 'taken') {
        log.takenAt = new Date();
        log.snoozedUntil = null;
      } else if (status === 'snoozed') {
        log.takenAt = null;
        const snoozeTime = snoozedMinutes || 15;
        log.snoozedUntil = new Date(Date.now() + snoozeTime * 60 * 1000);
      } else if (status === 'missed') {
        log.takenAt = null;
        log.snoozedUntil = null;
      } else {
        log.takenAt = null;
        log.snoozedUntil = null;
      }
    }

    await log.save();
    await log.populate('medicineId');

    res.status(200).json(log);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLogs,
  createOrUpsertLog,
  updateLogStatus,
};
