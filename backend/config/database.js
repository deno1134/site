const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './database.sqlite';

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
      } else {
        console.log('✅ Connected to SQLite database');
        this.initializeTables();
      }
    });
  }

  initializeTables() {
    // Admin users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        api_key TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Licenses table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_key TEXT UNIQUE NOT NULL,
        hwid TEXT,
        expires_at DATETIME,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME,
        usage_count INTEGER DEFAULT 0
      )
    `);

    // License logs table for tracking
    this.db.run(`
      CREATE TABLE IF NOT EXISTS license_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_key TEXT NOT NULL,
        ip_address TEXT,
        hwid TEXT,
        action TEXT NOT NULL,
        success INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(license_key) REFERENCES licenses(license_key)
      )
    `);

    console.log('✅ Database tables initialized');
  }

  getDb() {
    return this.db;
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  }
}

module.exports = new Database();