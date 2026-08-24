const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id, role, rememberMe = true) => {
  const expiresIn = rememberMe ? '30d' : '7d';
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'meditrack_super_secret_jwt_key_2026_secure',
    { expiresIn }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, age, gender, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['patient', 'caregiver'].includes(role)) {
      return res.status(400).json({ error: 'Role must be patient or caregiver' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      age: age || undefined,
      gender: gender || 'prefer_not_to_say',
      phone: phone || '',
    });

    const token = generateToken(user._id, user.role);

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      user: userObj,
      token,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role, rememberMe);

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      user: userObj,
      token,
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
