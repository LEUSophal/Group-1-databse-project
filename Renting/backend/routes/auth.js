const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  console.log(`Login attempt: ${email} as ${role}`);
  try {
    const table = role === 'landlord' ? 'Landlord' : 'Tenant';
    const idField = role === 'landlord' ? 'idLandlord' : 'idTenant';
    const [rows] = await pool.execute(
      `SELECT * FROM ${table} WHERE email = ? AND password = ? ORDER BY ${idField} ASC`,
      [email, password]
    );
    console.log(`Query result for ${email}:`, rows.length, "rows found");
    if (rows.length > 0) {
      const user = rows[0];
      user.role = role;
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  try {
    // 1. Check if email already exists
    const [existingTenants] = await pool.execute('SELECT email FROM Tenant WHERE email = ?', [email]);
    const [existingLandlords] = await pool.execute('SELECT email FROM Landlord WHERE email = ?', [email]);
    
    if (existingTenants.length > 0 || existingLandlords.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

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

// GET /api/auth/tenants
router.get('/tenants', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Tenant');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/landlords
router.get('/landlords', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Landlord');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/tenants/:id
router.put('/tenants/:id', async (req, res) => {
  const { full_name, email, phone } = req.body;
  try {
    await pool.execute(
      'UPDATE Tenant SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), phone = COALESCE(?, phone) WHERE idTenant = ?',
      [full_name, email, phone, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/landlords/:id
router.put('/landlords/:id', async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    await pool.execute(
      'UPDATE Landlord SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone) WHERE idLandlord = ?',
      [name, email, phone, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
