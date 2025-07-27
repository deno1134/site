const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DBSOURCE = 'db.sqlite';
const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Users table (admin only for now)
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  is_admin INTEGER DEFAULT 0
)`);

// Products table
db.run(`CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  description TEXT
)`);

// Keys table
db.run(`CREATE TABLE IF NOT EXISTS keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  key TEXT,
  hwid TEXT,
  is_used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id)
)`);

// Add hwid column to existing keys table if it doesn't exist
db.run(`ALTER TABLE keys ADD COLUMN hwid TEXT`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding hwid column:', err);
  }
});

// Add created_at column to existing keys table if it doesn't exist
db.run(`ALTER TABLE keys ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding created_at column:', err);
  }
});

// Create default admin if not exists
const defaultAdmin = {
  username: 'admin',
  password: 'admin123', // Change after first login!
};

bcrypt.hash(defaultAdmin.password, 10, (err, hash) => {
  if (err) return;
  db.run(
    'INSERT OR IGNORE INTO users (username, password, is_admin) VALUES (?, ?, 1)',
    [defaultAdmin.username, hash],
    (err) => {
      if (err) console.error('Error creating default admin:', err);
    }
  );
});

module.exports = db;