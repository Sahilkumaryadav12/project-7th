const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medicationLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicationLog', required: true },
  type: { type: String, enum: ['upcoming', 'missed'], required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  snoozedUntil: { type: Date, default: null },
}, { timestamps: true });
notificationSchema.index({ userId: 1, medicationLogId: 1, type: 1 }, { unique: true });
module.exports = mongoose.model('Notification', notificationSchema);
