/**
 * Authentication & Authorization Middleware
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Middleware to authenticate JWT in Authorization header.
 * Rejects missing, malformed, or expired tokens with 401 Unauthorized.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'AuthenticationRequired',
      message: 'Authorization header is missing. Bearer token required.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      error: 'InvalidTokenFormat',
      message: 'Authorization header must follow format: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TokenExpired',
        message: 'JWT token has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'InvalidToken',
      message: 'Cryptographic token verification failed: invalid signature or payload.'
    });
  }
}

/**
 * Middleware to require 'admin' role.
 * CAT-06: Never trust client-supplied role in body. Enforced strictly from verified JWT claims.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'AuthenticationRequired',
      message: 'User identity could not be verified.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'ForbiddenAdminOnly',
      message: 'Administrative privileges required for this operation. Access denied.'
    });
  }

  next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};
