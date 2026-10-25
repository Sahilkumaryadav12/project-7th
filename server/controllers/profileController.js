const User = require('../models/User');
const { updateProfile } = require('./userController');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile };
