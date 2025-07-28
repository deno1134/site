const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;
const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const JWT_SECRET = 'supersecretkey'; // Change in production

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('API is running');
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

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`🔐 Login attempt for: ${username}`);
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      console.log('❌ Invalid credentials');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '1h' });
        console.log('✅ Login successful');
        res.json({ token, is_admin: user.is_admin });
      } else {
        console.log('❌ Invalid password');
        res.status(401).json({ message: 'Invalid credentials' });
      }
    });
  });
});

// Key validation endpoint for executable loaders
app.post('/api/validate-key', (req, res) => {
  const { key, hwid, product_name } = req.body;
  console.log(`🔑 Validating key: ${key} for product: ${product_name}`);
  
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
      console.error('❌ Database error:', err);
      return res.status(500).json({ valid: false, message: 'Database error' });
    }
    
    if (!keyData) {
      console.log('❌ Invalid key or product');
      return res.status(401).json({ valid: false, message: 'Invalid key or product' });
    }

    // Check if key is already bound to a different HWID
    if (keyData.hwid && keyData.hwid !== hwid) {
      console.log('❌ Key already bound to another device');
      return res.status(401).json({ 
        valid: false, 
        message: 'Key is already bound to another device' 
      });
    }

    // If key is not bound yet, bind it to this HWID
    if (!keyData.hwid) {
      db.run('UPDATE keys SET hwid = ?, is_used = 1 WHERE id = ?', [hwid, keyData.id], (err) => {
        if (err) {
          console.error('❌ Failed to bind key:', err);
          return res.status(500).json({ valid: false, message: 'Failed to bind key' });
        }
        
        console.log('✅ Key validated and bound to device');
        return res.json({
          valid: true,
          message: 'Key validated and bound to device',
          key_id: keyData.id,
          product: keyData.product_name
        });
      });
    } else {
      // Key is already bound to this HWID
      console.log('✅ Key validated (already bound)');
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

// List products
app.get('/api/products', (req, res) => {
  console.log('📦 Fetching products');
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      console.error('❌ Database error fetching products:', err);
      return res.status(500).json({ message: 'DB error' });
    }
    console.log(`✅ Found ${rows.length} products`);
    res.json(rows);
  });
});

// Add product (admin only)
app.post('/api/products', verifyAdmin, (req, res) => {
  const { name, description } = req.body;
  console.log(`📦 Adding product: ${name} - ${description}`);
  
  if (!name) {
    console.log('❌ Missing product name');
    return res.status(400).json({ message: 'Product name is required' });
  }
  
  db.run('INSERT INTO products (name, description) VALUES (?, ?)', [name, description], function(err) {
    if (err) {
      console.error('❌ Database error adding product:', err);
      return res.status(500).json({ message: 'DB error: ' + err.message });
    }
    console.log(`✅ Product added successfully with ID: ${this.lastID}`);
    res.json({ id: this.lastID, name, description });
  });
});

// List keys for a product (admin only)
app.get('/api/keys/:productId', verifyAdmin, (req, res) => {
  const productId = req.params.productId;
  console.log(`🔑 Fetching keys for product ID: ${productId}`);
  
  db.all('SELECT * FROM keys WHERE product_id = ?', [productId], (err, rows) => {
    if (err) {
      console.error('❌ Database error fetching keys:', err);
      return res.status(500).json({ message: 'DB error' });
    }
    console.log(`✅ Found ${rows.length} keys for product ${productId}`);
    res.json(rows);
  });
});

// Add key (admin only)
app.post('/api/keys', verifyAdmin, (req, res) => {
  const { product_id, key } = req.body;
  console.log(`🔑 Adding key: ${key} for product_id: ${product_id}`);
  
  if (!product_id || !key) {
    console.log('❌ Missing required fields');
    return res.status(400).json({ message: 'Product ID and key are required' });
  }
  
  db.run('INSERT INTO keys (product_id, key) VALUES (?, ?)', [product_id, key], function(err) {
    if (err) {
      console.error('❌ Database error adding key:', err);
      return res.status(500).json({ message: 'DB error: ' + err.message });
    }
    console.log(`✅ Key added successfully with ID: ${this.lastID}`);
    res.json({ id: this.lastID, product_id, key });
  });
});

// Delete key (admin only)
app.delete('/api/keys/:id', verifyAdmin, (req, res) => {
  const keyId = req.params.id;
  console.log(`🗑️ Deleting key with ID: ${keyId}`);
  
  db.run('DELETE FROM keys WHERE id = ?', [keyId], function(err) {
    if (err) {
      console.error('❌ Database error deleting key:', err);
      return res.status(500).json({ message: 'DB error' });
    }
    console.log(`✅ Deleted ${this.changes} key(s)`);
    res.json({ deleted: this.changes });
  });
});

// Reset HWID for a key (admin only)
app.post('/api/reset-key', verifyAdmin, (req, res) => {
  const { key } = req.body;
  console.log(`🔄 Resetting HWID for key: ${key}`);
  
  if (!key) {
    return res.status(400).json({ message: 'Key is required' });
  }
  
  db.run('UPDATE keys SET hwid = NULL, is_used = 0 WHERE key = ?', [key], function(err) {
    if (err) {
      console.error('❌ Database error resetting key:', err);
      return res.status(500).json({ message: 'DB error' });
    }
    console.log(`✅ Reset ${this.changes} key(s)`);
    res.json({ reset: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📖 API Documentation:`);
  console.log(`   GET  /               - Health check`);
  console.log(`   POST /api/login      - Admin login`);
  console.log(`   POST /api/validate-key - Key validation for loaders`);
  console.log(`   GET  /api/products   - List products`);
  console.log(`   POST /api/products   - Add product (admin)`);
  console.log(`   GET  /api/keys/:id   - List keys for product (admin)`);
  console.log(`   POST /api/keys       - Add key (admin)`);
  console.log(`   DELETE /api/keys/:id - Delete key (admin)`);
  console.log(`   POST /api/reset-key  - Reset key HWID (admin)`);
});