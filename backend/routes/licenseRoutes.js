const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');
const { verifyAdminApiKey } = require('../middlewares/auth');
const { verifyLimiter, adminLimiter } = require('../middlewares/rateLimiter');

// Public endpoint for license verification
router.post('/verify', verifyLimiter, licenseController.verifyLicense);

// Admin endpoints (require API key)
router.post('/create', adminLimiter, verifyAdminApiKey, licenseController.createLicense);
router.post('/reset-hwid', adminLimiter, verifyAdminApiKey, licenseController.resetHWID);
router.get('/licenses', adminLimiter, verifyAdminApiKey, licenseController.getAllLicenses);
router.get('/license/:key', adminLimiter, verifyAdminApiKey, licenseController.getLicenseDetails);
router.put('/license/:key/status', adminLimiter, verifyAdminApiKey, licenseController.updateLicenseStatus);
router.delete('/license/:key', adminLimiter, verifyAdminApiKey, licenseController.deleteLicense);

module.exports = router;