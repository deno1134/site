const License = require('../models/License');
const { apiResponse, getClientIP } = require('../utils/helpers');
const config = require('../config/config');

/**
 * Verify license endpoint
 * POST /api/verify
 */
const verifyLicense = async (req, res) => {
  try {
    const { license_key, hwid } = req.body;
    
    // Validation
    if (!license_key || !hwid) {
      return res.status(400).json(
        apiResponse(false, 'License key and HWID are required')
      );
    }
    
    const clientIP = getClientIP(req);
    
    // Verify the license
    const result = await License.verify(license_key, hwid, clientIP);
    
    if (result.valid) {
      return res.status(200).json(
        apiResponse(true, result.reason, {
          license: result.license,
          server_time: new Date().toISOString()
        })
      );
    } else {
      return res.status(401).json(
        apiResponse(false, result.reason, {
          license: result.license,
          server_time: new Date().toISOString()
        })
      );
    }
  } catch (error) {
    console.error('License verification error:', error);
    return res.status(500).json(
      apiResponse(false, 'Internal server error during license verification')
    );
  }
};

/**
 * Create new license endpoint (Admin only)
 * POST /api/create
 */
const createLicense = async (req, res) => {
  try {
    const { license_type = '30d' } = req.body;
    
    // Validate license type
    const validTypes = ['7d', '30d', '90d', '365d', 'lifetime'];
    if (!validTypes.includes(license_type)) {
      return res.status(400).json(
        apiResponse(false, 'Invalid license type. Valid types: ' + validTypes.join(', '))
      );
    }
    
    // Create the license
    const license = await License.create(license_type);
    
    return res.status(201).json(
      apiResponse(true, 'License created successfully', {
        license: license
      })
    );
  } catch (error) {
    console.error('License creation error:', error);
    return res.status(500).json(
      apiResponse(false, 'Internal server error during license creation')
    );
  }
};

/**
 * Reset HWID endpoint (Admin only)
 * POST /api/reset-hwid
 */
const resetHWID = async (req, res) => {
  try {
    const { license_key } = req.body;
    
    if (!license_key) {
      return res.status(400).json(
        apiResponse(false, 'License key is required')
      );
    }
    
    // Check if license exists
    const license = await License.findByKey(license_key);
    if (!license) {
      return res.status(404).json(
        apiResponse(false, 'License not found')
      );
    }
    
    // Reset HWID
    const success = await License.resetHWID(license_key);
    
    if (success) {
      return res.status(200).json(
        apiResponse(true, 'HWID reset successfully')
      );
    } else {
      return res.status(500).json(
        apiResponse(false, 'Failed to reset HWID')
      );
    }
  } catch (error) {
    console.error('HWID reset error:', error);
    return res.status(500).json(
      apiResponse(false, 'Internal server error during HWID reset')
    );
  }
};

/**
 * Get all licenses endpoint (Admin only)
 * GET /api/licenses
 */
const getAllLicenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json(
        apiResponse(false, 'Invalid pagination parameters')
      );
    }
    
    const licenses = await License.getAll(limit, offset);
    
    return res.status(200).json(
      apiResponse(true, 'Licenses retrieved successfully', {
        licenses: licenses,
        pagination: {
          page: page,
          limit: limit,
          total: licenses.length
        }
      })
    );
  } catch (error) {
    console.error('Get licenses error:', error);
    return res.status(500).json(
      apiResponse(false, 'Internal server error while retrieving licenses')
    );
  }
};

/**
 * Get license details endpoint (Admin only)
 * GET /api/license/:key
 */
const getLicenseDetails = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json(
        apiResponse(false, 'License key is required')
      );
    }
    
    const license = await License.findByKey(key);
    
    if (!license) {
      return res.status(404).json(
        apiResponse(false, 'License not found')
      );
    }
    
    // Get license logs
    const logs = await License.getLogs(key, 20);
    
    return res.status(200).json(
      apiResponse(true, 'License details retrieved successfully', {
        license: license,
        logs: logs
      })
    );
  } catch (error) {
    console.error('Get license details error:', error);
    return res.status(500).json(
      apiResponse(false, 'Internal server error while retrieving license details')
    );
  }
};

/**
 * Update license status endpoint (Admin only)
 * PUT /api/license/:key/status
 */
const updateLicenseStatus = async (req, res) => {
  try {
    const { key } = req.params;
    const { status } = req.body;
    
    if (!key || !status) {
      return res.status(400).json(
        apiResponse(false, 'License key and status are required')
      );
    }
    
    // Validate status
    const validStatuses = Object.values(config.license.statuses);
    if (!validStatuses.includes(status)) {
      return res.status(400).json(
        apiResponse(false, 'Invalid status. Valid statuses: ' + validStatuses.join(', '))
      );
    }
    
    // Check if license exists
    const license = await License.findByKey(key);
    if (!license) {
      return res.status(404).json(
        apiResponse(false, 'License not found')
      );
    }
    
    // Update status
    const success = await License.updateStatus(key, status);
    
    if (success) {
      return res.status(200).json(
        apiResponse(true, 'License status updated successfully')
      );
    } else {
      return res.status(500).json(
        apiResponse(false, 'Failed to update license status')
      );
    }
  } catch (error) {
    console.error('Update license status error:', error);
    return res.status(500).json(
      apiResponse(false, 'Internal server error during status update')
    );
  }
};

/**
 * Delete license endpoint (Admin only)
 * DELETE /api/license/:key
 */
const deleteLicense = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json(
        apiResponse(false, 'License key is required')
      );
    }
    
    // Check if license exists
    const license = await License.findByKey(key);
    if (!license) {
      return res.status(404).json(
        apiResponse(false, 'License not found')
      );
    }
    
    // Delete the license
    const success = await License.delete(key);
    
    if (success) {
      return res.status(200).json(
        apiResponse(true, 'License deleted successfully')
      );
    } else {
      return res.status(500).json(
        apiResponse(false, 'Failed to delete license')
      );
    }
  } catch (error) {
    console.error('Delete license error:', error);
    return res.status(500).json(
      apiResponse(false, 'Internal server error during license deletion')
    );
  }
};

module.exports = {
  verifyLicense,
  createLicense,
  resetHWID,
  getAllLicenses,
  getLicenseDetails,
  updateLicenseStatus,
  deleteLicense
};