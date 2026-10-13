const express = require('express');
const crypto = require('crypto');
const { User } = require('../models');
const { requireAuth, signToken } = require('../middleware/auth');

const router = express.Router();

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// POST /api/auth/register - Public user registration
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    const userId = `usr_${crypto.randomBytes(6).toString('hex')}`;
    const passwordHash = await User.hashPassword(password);
    const now = new Date().toISOString();

    // Public signup must strictly create a regular 'user', never an admin
    const newUser = await User.create({
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role: 'user',
      created_at: now,
      updated_at: now
    });

    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('[Auth Error] Registration failed:', err.message);
    res.status(500).json({ error: 'Failed to create account', details: err.message });
  }
});

// POST /api/auth/login - User authentication
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[Auth Error] Login failed:', err.message);
    res.status(500).json({ error: 'Failed to authenticate user', details: err.message });
  }
});

// GET /api/auth/me - Retrieve current authenticated user profile
router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: req.user
  });
});

module.exports = router;
