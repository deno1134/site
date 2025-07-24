const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;
const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = 'supersecretkey'; // Change in production

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running');
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

// Reset HWID for a key (admin only)
app.post('/api/reset-key', verifyAdmin, (req, res) => {
  const { key } = req.body;
  db.run('UPDATE keys SET hwid = NULL WHERE key = ?', [key], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ reset: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});