const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const { apiResponse } = require('../utils/helpers');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: apiResponse(false, 'Too many requests, please try again later'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  }
});

// Strict rate limiter for license verification
const verifyLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: apiResponse(false, 'Too many license verification attempts, please try again later'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  }
});

// Admin operations rate limiter
const adminLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per minute for admin operations
  message: apiResponse(false, 'Too many admin requests, please try again later'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  }
});

module.exports = {
  apiLimiter,
  verifyLimiter,
  adminLimiter
};