const jwt = require('jsonwebtoken');
const { ERROR_MESSAGES } = require('../config/constants');

/**
 * Generate JWT Token
 * @param {Object} payload - Data to encode in token
 * @param {String} expiresIn - Token expiration time
 * @returns {String} JWT Token
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN) => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  } catch (error) {
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

/**
 * Verify JWT Token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error(ERROR_MESSAGES.TOKEN_EXPIRED);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error(ERROR_MESSAGES.TOKEN_INVALID);
    }
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Token or null
 */
const extractToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

/**
 * Generate access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Access and refresh tokens
 */
const generateTokens = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
    mobile: user.mobile
  };

  const accessToken = generateToken(payload, '15m'); // 15 minutes
  const refreshToken = generateToken(payload, '7d');  // 7 days

  return {
    accessToken,
    refreshToken
  };
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  generateTokens
}; 