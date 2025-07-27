const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

/**
 * Generate a unique license key
 * @returns {string} UUID v4 license key
 */
const generateLicenseKey = () => {
  return uuidv4().toUpperCase();
};

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, config.security.bcryptRounds);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Comparison result
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Calculate expiration date based on license type
 * @param {string} licenseType - License type (7d, 30d, lifetime)
 * @returns {Date|null} Expiration date or null for lifetime
 */
const calculateExpirationDate = (licenseType) => {
  if (!licenseType || licenseType === 'lifetime') {
    return null; // Lifetime license
  }
  
  const now = new Date();
  const match = licenseType.match(/^(\d+)([dwmy])$/);
  
  if (!match) {
    throw new Error('Invalid license type format');
  }
  
  const [, amount, unit] = match;
  const value = parseInt(amount);
  
  switch (unit) {
    case 'd': // days
      now.setDate(now.getDate() + value);
      break;
    case 'w': // weeks
      now.setDate(now.getDate() + (value * 7));
      break;
    case 'm': // months
      now.setMonth(now.getMonth() + value);
      break;
    case 'y': // years
      now.setFullYear(now.getFullYear() + value);
      break;
    default:
      throw new Error('Invalid license type unit');
  }
  
  return now;
};

/**
 * Check if license is expired
 * @param {Date|string|null} expiresAt - Expiration date
 * @returns {boolean} Is expired
 */
const isLicenseExpired = (expiresAt) => {
  if (!expiresAt) return false; // Lifetime license
  
  const expiration = new Date(expiresAt);
  const now = new Date();
  
  return now > expiration;
};

/**
 * Format license response
 * @param {Object} license - License object from database
 * @returns {Object} Formatted license response
 */
const formatLicenseResponse = (license) => {
  return {
    key: license.license_key,
    hwid: license.hwid,
    expiresAt: license.expires_at,
    status: license.status,
    isExpired: isLicenseExpired(license.expires_at),
    lastUsedAt: license.last_used_at,
    usageCount: license.usage_count,
    createdAt: license.created_at
  };
};

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
};

/**
 * Generate API response
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {Object} data - Response data
 * @returns {Object} Formatted API response
 */
const apiResponse = (success, message, data = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return response;
};

module.exports = {
  generateLicenseKey,
  hashPassword,
  comparePassword,
  calculateExpirationDate,
  isLicenseExpired,
  formatLicenseResponse,
  getClientIP,
  apiResponse
};