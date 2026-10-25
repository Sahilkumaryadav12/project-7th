const mongoose = require('mongoose');

const medicationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
    index: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  scheduledTime: {
    type: String,
    required: true,
  },
  scheduledAt: { type: Date, index: true },
  status: {
    type: String,
    enum: ['upcoming', 'taken', 'missed', 'snoozed'],
    default: 'upcoming',
  },
  takenAt: {
    type: Date,
    default: null,
  },
  snoozedUntil: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: { type: Date, default: Date.now },
});

// Unique compound index to prevent duplicate logs for the exact same scheduled dose
medicationLogSchema.index(
  { userId: 1, medicineId: 1, scheduledDate: 1, scheduledTime: 1 },
  { unique: true }
);

medicationLogSchema.pre('save', function updateTimestamp() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('MedicationLog', medicationLogSchema);
