const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const cookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSiteConfig = process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');
  return {
    httpOnly: true,
    secure: isProduction || sameSiteConfig === 'none',
    sameSite: sameSiteConfig,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  };
};
const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, age, gender, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(email)) return res.status(422).json({ error: 'Enter a valid name and email address' });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password)) return res.status(422).json({ error: 'Password must be at least 8 characters and include upper/lowercase letters, a number, and a symbol' });

    const accountRole = role || 'patient';
    if (!['patient', 'caregiver'].includes(accountRole)) {
      return res.status(400).json({ error: 'Role must be patient or caregiver' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: accountRole,
      age: age || undefined,
      gender: gender || 'prefer_not_to_say',
      phone: phone || '',
    });

    const token = generateToken(user._id, user.role);
    res.cookie('meditrack_session', token, cookieOptions());

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

    const token = generateToken(user._id, user.role);
    res.cookie('meditrack_session', token, cookieOptions());

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
  const clearOptions = cookieOptions();
  delete clearOptions.maxAge;
  res.clearCookie('meditrack_session', clearOptions);
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
