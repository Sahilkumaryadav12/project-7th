const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token && req.headers.cookie) {
    const cookie = req.headers.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('meditrack_session='));
    if (cookie) token = decodeURIComponent(cookie.slice('meditrack_session='.length));
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized, token invalid or expired' });
  }
};

module.exports = { protect };
