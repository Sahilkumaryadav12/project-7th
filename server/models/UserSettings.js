const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  timezone: { type: String, default: 'UTC' },
  language: { type: String, default: 'en' },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
  notifications: {
    browser: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    missedDose: { type: Boolean, default: true },
  },
  reminder: { snoozeMinutes: { type: Number, enum: [15, 30, 60], default: 15 }, graceMinutes: { type: Number, min: 0, max: 240, default: 60 } },
}, { timestamps: true });

module.exports = mongoose.model('UserSettings', userSettingsSchema);
