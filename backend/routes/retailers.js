// backend/routes/retailers.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email & password required' });

  try {
    const [exists] = await db.query('SELECT id FROM retailers WHERE email = ?', [email]);
    if (exists.length) return res.status(400).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO retailers (name, email, phone, password, status) VALUES (?, ?, ?, ?, ?)',
      [name || null, email, phone || null, hash, 'pending'] // 👈 default pending
    );

    res.json({ id: result.insertId, message: 'Registered! Awaiting admin approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email & password required' });

  try {
    const [rows] = await db.query('SELECT * FROM retailers WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const r = rows[0];

    // Check approval
    if (r.status !== 'approved') {
      return res.status(403).json({ message: 'Your account is not approved yet' });
    }

    const ok = await bcrypt.compare(password, r.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: r.id, email: r.email, name: r.name },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '7d' }
    );

    res.json({ token, retailer: { id: r.id, name: r.name, email: r.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// get all retailers
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, status, created_at FROM retailers ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Get retailers error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
