const MedicationLog = require('../models/MedicationLog');
const Medicine = require('../models/Medicine');
const { materializeLogsForUserDate, normalizeToMidnight } = require('../services/doseGeneratorService');

const getLogs = async (req, res, next) => {
  try {
    const { date, medicineId, status } = req.query;
    const userId = req.user._id;

    const queryDate = date ? new Date(date) : new Date();
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

    const logs = await MedicationLog.find(filter)
      .populate('medicineId')
      .sort({ scheduledDate: -1, scheduledTime: 1 });

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

    const normalizedDate = normalizeToMidnight(scheduledDate);

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
        status: status || 'upcoming',
        ...(takenAt ? { takenAt } : {}),
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
      log.status = status;
      if (status === 'taken') {
        log.takenAt = new Date();
        log.snoozedUntil = null;
      } else if (status === 'snoozed') {
        const snoozeTime = snoozedMinutes || 15;
        log.snoozedUntil = new Date(Date.now() + snoozeTime * 60 * 1000);
      } else if (status === 'missed') {
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
