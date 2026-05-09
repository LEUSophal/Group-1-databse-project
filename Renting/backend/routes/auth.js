const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const table = role === 'landlord' ? 'Landlord' : 'Tenant';
    const [rows] = await pool.execute(
      `SELECT * FROM ${table} WHERE email = ? AND password = ?`,
      [email, password]
    );
    if (rows.length > 0) {
      const user = rows[0];
      user.role = role;
      res.json({ success: true, user });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  try {
    let result;
    if (role === 'landlord') {
      [result] = await pool.execute(
        'INSERT INTO Landlord (name, email, phone, password, Admin_idAdmin) VALUES (?, ?, ?, ?, 1)',
        [name, email, phone, password]
      );
    } else {
      [result] = await pool.execute(
        'INSERT INTO Tenant (full_name, email, phone, password, Admin_idAdmin) VALUES (?, ?, ?, ?, 1)',
        [name, email, phone, password]
      );
    }
    res.status(201).json({
      success: true,
      user: { id: result.insertId, name, email, phone, role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
