const database = require('../config/database');
const { generateLicenseKey, calculateExpirationDate, formatLicenseResponse, isLicenseExpired } = require('../utils/helpers');
const config = require('../config/config');

class License {
  /**
   * Create a new license
   * @param {string} licenseType - License type (7d, 30d, lifetime)
   * @returns {Promise<Object>} Created license
   */
  static async create(licenseType = '30d') {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      const licenseKey = generateLicenseKey();
      const expiresAt = calculateExpirationDate(licenseType);
      
      const query = `
        INSERT INTO licenses (license_key, expires_at, status)
        VALUES (?, ?, ?)
      `;
      
      db.run(query, [licenseKey, expiresAt, config.license.statuses.ACTIVE], function(err) {
        if (err) {
          reject(err);
        } else {
          // Get the created license
          License.findByKey(licenseKey)
            .then(license => resolve(license))
            .catch(err => reject(err));
        }
      });
    });
  }

  /**
   * Find license by key
   * @param {string} licenseKey - License key
   * @returns {Promise<Object|null>} License object or null
   */
  static async findByKey(licenseKey) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      const query = 'SELECT * FROM licenses WHERE license_key = ?';
      
      db.get(query, [licenseKey], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? formatLicenseResponse(row) : null);
        }
      });
    });
  }

  /**
   * Verify license and update HWID if needed
   * @param {string} licenseKey - License key
   * @param {string} hwid - Hardware ID
   * @param {string} ipAddress - Client IP address
   * @returns {Promise<Object>} Verification result
   */
  static async verify(licenseKey, hwid, ipAddress) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      
      // First, get the license
      db.get('SELECT * FROM licenses WHERE license_key = ?', [licenseKey], (err, license) => {
        if (err) {
          return reject(err);
        }
        
        if (!license) {
          return resolve({
            valid: false,
            reason: 'License not found',
            license: null
          });
        }

        // Check if license is expired
        if (isLicenseExpired(license.expires_at)) {
          // Update status to expired
          db.run('UPDATE licenses SET status = ? WHERE license_key = ?', 
            [config.license.statuses.EXPIRED, licenseKey]);
          
          return resolve({
            valid: false,
            reason: 'License expired',
            license: formatLicenseResponse(license)
          });
        }

        // Check license status
        if (license.status !== config.license.statuses.ACTIVE) {
          return resolve({
            valid: false,
            reason: `License is ${license.status}`,
            license: formatLicenseResponse(license)
          });
        }

        // HWID validation
        if (!license.hwid) {
          // First time usage - bind HWID
          db.run(
            'UPDATE licenses SET hwid = ?, last_used_at = CURRENT_TIMESTAMP, usage_count = usage_count + 1 WHERE license_key = ?',
            [hwid, licenseKey],
            function(updateErr) {
              if (updateErr) {
                return reject(updateErr);
              }
              
              // Log the verification
              License.logVerification(licenseKey, ipAddress, hwid, 'first_bind', true);
              
              // Get updated license
              License.findByKey(licenseKey)
                .then(updatedLicense => {
                  resolve({
                    valid: true,
                    reason: 'License valid - HWID bound',
                    license: updatedLicense
                  });
                })
                .catch(err => reject(err));
            }
          );
        } else if (license.hwid === hwid) {
          // HWID matches - update usage
          db.run(
            'UPDATE licenses SET last_used_at = CURRENT_TIMESTAMP, usage_count = usage_count + 1 WHERE license_key = ?',
            [licenseKey],
            function(updateErr) {
              if (updateErr) {
                return reject(updateErr);
              }
              
              // Log the verification
              License.logVerification(licenseKey, ipAddress, hwid, 'verify_success', true);
              
              // Get updated license
              License.findByKey(licenseKey)
                .then(updatedLicense => {
                  resolve({
                    valid: true,
                    reason: 'License valid',
                    license: updatedLicense
                  });
                })
                .catch(err => reject(err));
            }
          );
        } else {
          // HWID mismatch
          License.logVerification(licenseKey, ipAddress, hwid, 'hwid_mismatch', false);
          
          resolve({
            valid: false,
            reason: 'HWID mismatch - license bound to different hardware',
            license: formatLicenseResponse(license)
          });
        }
      });
    });
  }

  /**
   * Reset HWID for a license
   * @param {string} licenseKey - License key
   * @returns {Promise<boolean>} Success status
   */
  static async resetHWID(licenseKey) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      const query = 'UPDATE licenses SET hwid = NULL, updated_at = CURRENT_TIMESTAMP WHERE license_key = ?';
      
      db.run(query, [licenseKey], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Update license status
   * @param {string} licenseKey - License key
   * @param {string} status - New status
   * @returns {Promise<boolean>} Success status
   */
  static async updateStatus(licenseKey, status) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      const query = 'UPDATE licenses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE license_key = ?';
      
      db.run(query, [status, licenseKey], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Get all licenses (admin only)
   * @param {number} limit - Limit results
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of licenses
   */
  static async getAll(limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      const query = 'SELECT * FROM licenses ORDER BY created_at DESC LIMIT ? OFFSET ?';
      
      db.all(query, [limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const licenses = rows.map(row => formatLicenseResponse(row));
          resolve(licenses);
        }
      });
    });
  }

  /**
   * Delete a license
   * @param {string} licenseKey - License key
   * @returns {Promise<boolean>} Success status
   */
  static async delete(licenseKey) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      const query = 'DELETE FROM licenses WHERE license_key = ?';
      
      db.run(query, [licenseKey], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Log license verification attempt
   * @param {string} licenseKey - License key
   * @param {string} ipAddress - IP address
   * @param {string} hwid - Hardware ID
   * @param {string} action - Action performed
   * @param {boolean} success - Success status
   */
  static logVerification(licenseKey, ipAddress, hwid, action, success) {
    const db = database.getDb();
    const query = `
      INSERT INTO license_logs (license_key, ip_address, hwid, action, success)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(query, [licenseKey, ipAddress, hwid, action, success ? 1 : 0], (err) => {
      if (err) {
        console.error('Error logging verification:', err);
      }
    });
  }

  /**
   * Get license logs
   * @param {string} licenseKey - License key
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Array of logs
   */
  static async getLogs(licenseKey, limit = 50) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      const query = `
        SELECT * FROM license_logs 
        WHERE license_key = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      
      db.all(query, [licenseKey, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = License;