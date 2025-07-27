const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { apiResponse } = require('../utils/helpers');

/**
 * Verify JWT token middleware
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json(apiResponse(false, 'No authorization header provided'));
  }
  
  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json(apiResponse(false, 'No token provided'));
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(apiResponse(false, 'Invalid or expired token'));
  }
};

/**
 * Verify admin API key middleware
 */
const verifyAdminApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.body.apiKey || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json(apiResponse(false, 'Admin API key required'));
  }
  
  if (apiKey !== config.admin.apiKey) {
    return res.status(401).json(apiResponse(false, 'Invalid admin API key'));
  }
  
  req.isAdmin = true;
  next();
};

/**
 * Verify admin JWT token middleware
 */
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json(apiResponse(false, 'No authorization header provided'));
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json(apiResponse(false, 'No token provided'));
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    if (!decoded.isAdmin) {
      return res.status(403).json(apiResponse(false, 'Admin access required'));
    }
    
    req.user = decoded;
    req.isAdmin = true;
    next();
  } catch (error) {
    return res.status(401).json(apiResponse(false, 'Invalid or expired token'));
  }
};

module.exports = {
  verifyToken,
  verifyAdminApiKey,
  verifyAdminToken
};