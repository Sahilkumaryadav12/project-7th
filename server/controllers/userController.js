const User = require('../models/User');

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, phone, age, gender, emergencyContact } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (age !== undefined) user.age = Number(age);
    if (gender !== undefined) user.gender = gender;

    if (emergencyContact) {
      let parsedContact = emergencyContact;
      if (typeof emergencyContact === 'string') {
        try {
          parsedContact = JSON.parse(emergencyContact);
        } catch (e) {
          parsedContact = { name: '', phone: '' };
        }
      }
      user.emergencyContact = {
        name: parsedContact.name || '',
        phone: parsedContact.phone || '',
      };
    }

    if (req.file) {
      user.profileImage = `/uploads/profile/${req.file.filename}`;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({ user: userObj });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateProfile,
};
