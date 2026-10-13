const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User, Assessment } = require('../models');

// Fail-safe JWT Secret management
let ephemeralSecret = null;

function getJwtSecret() {
  const envSecret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!envSecret || envSecret.length < 32) {
      throw new Error(
        '[Security Error] In production, JWT_SECRET must be defined with at least 32 characters.'
      );
    }
    return envSecret;
  }

  // Non-production (development or test):
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }

  // Generate ephemeral 256-bit secret in memory per process if not set in dev/test
  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(32).toString('hex');
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[Security Warning] JWT_SECRET not provided. Generated ephemeral in-memory secret for development. Sessions will reset on restart.'
      );
    }
  }
  return ephemeralSecret;
}

function signToken(payload, expiresIn = '7d') {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

/**
 * Authentication middleware: Validates Bearer token from Authorization header.
 * Attaches req.user = { id, name, email, role }.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication token is required'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const user = await User.findOne({ id: decoded.id }).lean();

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized: User account no longer exists'
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token has expired' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
  }
}

/**
 * Ownership middleware: Validates that req.params.id corresponds to an assessment
 * owned by the authenticated user (or user is admin).
 * Unassigned legacy assessments (user_id === null) are restricted from ordinary users.
 */
async function checkAssessmentOwnership(req, res, next) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Assessment ID is required' });
  }

  try {
    const assessment = await Assessment.findOne({ id }).lean();
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Admin can access all assessments
    if (req.user && req.user.role === 'admin') {
      req.assessment = assessment;
      return next();
    }

    // If assessment is legacy unassigned (user_id is null/missing)
    if (!assessment.user_id) {
      return res.status(403).json({
        error: 'Forbidden: Unassigned legacy assessment access requires administrative authorization'
      });
    }

    // Verify ownership
    if (!req.user || assessment.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to access this assessment'
      });
    }

    req.assessment = assessment;
    next();
  } catch (err) {
    console.error(`[Auth Error] Ownership check failed for assessment ${id}:`, err.message);
    res.status(500).json({ error: 'Internal server error during authorization check' });
  }
}

module.exports = {
  getJwtSecret,
  signToken,
  verifyToken,
  requireAuth,
  checkAssessmentOwnership
};
