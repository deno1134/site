const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;
const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const JWT_SECRET = 'supersecretkey'; // Change in production

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running');
});

// Key validation endpoint for executable loaders
app.post('/api/validate-key', (req, res) => {
  const { key, hwid, product_name } = req.body;
  
  if (!key || !hwid || !product_name) {
    return res.status(400).json({ 
      valid: false, 
      message: 'Key, HWID, and product name are required' 
    });
  }

  // First, check if the key exists and is for the correct product
  db.get(`
    SELECT k.*, p.name as product_name 
    FROM keys k 
    JOIN products p ON k.product_id = p.id 
    WHERE k.key = ? AND p.name = ?
  `, [key, product_name], (err, keyData) => {
    if (err) {
      return res.status(500).json({ valid: false, message: 'Database error' });
    }
    
    if (!keyData) {
      return res.status(401).json({ valid: false, message: 'Invalid key or product' });
    }

    // Check if key is already bound to a different HWID
    if (keyData.hwid && keyData.hwid !== hwid) {
      return res.status(401).json({ 
        valid: false, 
        message: 'Key is already bound to another device' 
      });
    }

    // If key is not bound yet, bind it to this HWID
    if (!keyData.hwid) {
      db.run('UPDATE keys SET hwid = ?, is_used = 1 WHERE id = ?', [hwid, keyData.id], (err) => {
        if (err) {
          return res.status(500).json({ valid: false, message: 'Failed to bind key' });
        }
        
        return res.json({
          valid: true,
          message: 'Key validated and bound to device',
          key_id: keyData.id,
          product: keyData.product_name
        });
      });
    } else {
      // Key is already bound to this HWID
      return res.json({
        valid: true,
        message: 'Key validated',
        key_id: keyData.id,
        product: keyData.product_name
      });
    }
  });
});

// Generate HWID helper endpoint (for testing purposes)
app.get('/api/generate-hwid', (req, res) => {
  const hwid = crypto.randomBytes(16).toString('hex');
  res.json({ hwid });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) return res.status(401).json({ message: 'Invalid credentials' });
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, is_admin: user.is_admin });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    });
  });
});

// Middleware to verify admin
function verifyAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  const token = auth.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded.is_admin) return res.status(403).json({ message: 'Forbidden' });
    req.user = decoded;
    next();
  });
}

// List products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

// Add product (admin only)
app.post('/api/products', verifyAdmin, (req, res) => {
  const { name, description } = req.body;
  db.run('INSERT INTO products (name, description) VALUES (?, ?)', [name, description], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ id: this.lastID, name, description });
  });
});

// List keys for a product (admin only)
app.get('/api/keys/:productId', verifyAdmin, (req, res) => {
  db.all('SELECT * FROM keys WHERE product_id = ?', [req.params.productId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

// Add key (admin only)
app.post('/api/keys', verifyAdmin, (req, res) => {
  const { product_id, key } = req.body;
  db.run('INSERT INTO keys (product_id, key) VALUES (?, ?)', [product_id, key], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ id: this.lastID, product_id, key });
  });
});

// Delete key (admin only)
app.delete('/api/keys/:id', verifyAdmin, (req, res) => {
  db.run('DELETE FROM keys WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ deleted: this.changes });
  });
});

// Middleware to verify admin
function verifyAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  const token = auth.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded.is_admin) return res.status(403).json({ message: 'Forbidden' });
    req.user = decoded;
    next();
  });
}

// List products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

// Add product (admin only)
app.post('/api/products', verifyAdmin, (req, res) => {
  const { name, description } = req.body;
  db.run('INSERT INTO products (name, description) VALUES (?, ?)', [name, description], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ id: this.lastID, name, description });
  });
});

// List keys for a product (admin only)
app.get('/api/keys/:productId', verifyAdmin, (req, res) => {
  db.all('SELECT * FROM keys WHERE product_id = ?', [req.params.productId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

// Add key (admin only)
app.post('/api/keys', verifyAdmin, (req, res) => {
  const { product_id, key } = req.body;
  db.run('INSERT INTO keys (product_id, key) VALUES (?, ?)', [product_id, key], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ id: this.lastID, product_id, key });
  });
});

// Delete key (admin only)
app.delete('/api/keys/:id', verifyAdmin, (req, res) => {
  db.run('DELETE FROM keys WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ deleted: this.changes });
  });
});

// Reset HWID for a key (admin only)
app.post('/api/reset-key', verifyAdmin, (req, res) => {
  const { key } = req.body;
  db.run('UPDATE keys SET hwid = NULL, is_used = 0 WHERE key = ?', [key], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ reset: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});