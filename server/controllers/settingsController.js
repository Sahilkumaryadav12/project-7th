const UserSettings = require('../models/UserSettings');

const getSettings = async (req, res, next) => {
  try {
    const settings = await UserSettings.findOneAndUpdate({ userId: req.user._id }, { $setOnInsert: { userId: req.user._id } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json(settings);
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    const allowed = ['timezone', 'language', 'theme', 'notifications', 'reminder'];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (updates.timezone) {
      try { new Intl.DateTimeFormat('en-US', { timeZone: updates.timezone }); }
      catch { return res.status(422).json({ error: 'Invalid timezone' }); }
    }
    if (updates.theme && !['light', 'dark', 'system'].includes(updates.theme)) return res.status(422).json({ error: 'Invalid theme' });
    const settings = await UserSettings.findOneAndUpdate({ userId: req.user._id }, { $set: updates, $setOnInsert: { userId: req.user._id } }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    res.json(settings);
  } catch (err) { next(err); }
};

module.exports = { getSettings, updateSettings };
