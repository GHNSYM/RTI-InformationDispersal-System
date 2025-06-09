// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const User = db.User;
const { isTokenBlacklisted } = require('../utils/tokenManager');

module.exports = async function auth(req, res, next) {
  try {
    // 1) Grab the token
    const authHeader = req.header('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/, '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // 2) Check blacklist (if your store is async, await it)
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ error: 'Token has been invalidated' });
    }

    // 3) Verify & decode
    //    Note: jwt.verify will throw if token is malformed or expired
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 4) Load user (exclude password)
    const user = await User.findOne({
      where: { id: payload.id },
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // 5) Attach to request
    req.user = user;
    req.token = token;
    next();

  } catch (err) {
    console.error('Auth error:', err);
    // Distinguish an expired or invalid token
    const message =
      err.name === 'TokenExpiredError'
        ? 'Token expired'
        : 'Please authenticate';
    res.status(401).json({ error: message });
  }
};
  