const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  console.log(`Login attempt: ${email} as ${role}`);
  try {
    if (role === 'admin') {
      // Admin login: query the Admin table
      const [rows] = await pool.execute(
        'SELECT * FROM Admin WHERE email = ? ORDER BY idAdmin ASC',
        [email]
      );
      console.log(`Admin query result for ${email}:`, rows.length, 'rows found');
      if (rows.length > 0) {
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.json({ success: false, message: 'Invalid admin email or password' });
        user.role = 'admin';
        // Normalise id field so frontend can use user_id consistently
        user.idTenant = undefined;
        user.idLandlord = undefined;
        return res.json({ success: true, user });
      } else {
        return res.json({ success: false, message: 'Invalid admin email or password' });
      }
    }

    // Tenant / Landlord login
    const table = role === 'landlord' ? 'Landlord' : 'Tenant';
    const idField = role === 'landlord' ? 'idLandlord' : 'idTenant';
    const [rows] = await pool.execute(
      `SELECT * FROM ${table} WHERE email = ? ORDER BY ${idField} ASC`,
      [email]
    );
    console.log(`Query result for ${email}:`, rows.length, 'rows found');
    if (rows.length > 0) {
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.json({ success: false, message: 'Invalid email or password' });
      // Check if account is blocked
      if (user.is_active === 0) {
        return res.json({ success: false, message: 'Your account has been blocked. Please contact support.' });
      }
      user.role = role;
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role, gender } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  try {
    // 1. Check if email already exists (across all user types)
    const [existingTenants]   = await pool.execute('SELECT email FROM Tenant   WHERE email = ?', [email]);
    const [existingLandlords] = await pool.execute('SELECT email FROM Landlord WHERE email = ?', [email]);
    const [existingAdmins]    = await pool.execute('SELECT email FROM Admin    WHERE email = ?', [email]);

    if (existingTenants.length > 0 || existingLandlords.length > 0 || existingAdmins.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please use a different email or sign in.' });
    }

    let result;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === 'landlord') {
      [result] = await pool.execute(
        'INSERT INTO Landlord (name, email, phone, password, gender, Admin_idAdmin) VALUES (?, ?, ?, ?, ?, 1)',
        [name, email, phone, hashedPassword, gender || null]
      );
    } else {
      [result] = await pool.execute(
        'INSERT INTO Tenant (full_name, email, phone, password, gender, Admin_idAdmin) VALUES (?, ?, ?, ?, ?, 1)',
        [name, email, phone, hashedPassword, gender || null]
      );
    }
    res.status(201).json({
      success: true,
      user: { id: result.insertId, name, email, phone, role, gender }
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
  let { full_name, email, phone, profile_image, gender } = req.body;
  const nullIfEmpty = v => (v === '' || v === undefined) ? null : v;
  full_name     = nullIfEmpty(full_name);
  email         = nullIfEmpty(email);
  phone         = nullIfEmpty(phone);
  profile_image = nullIfEmpty(profile_image);
  gender        = nullIfEmpty(gender);

  try {
    await pool.execute(
      'UPDATE Tenant SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), phone = COALESCE(?, phone), profile_image = COALESCE(?, profile_image), gender = COALESCE(?, gender) WHERE idTenant = ?',
      [full_name, email, phone, profile_image, gender, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/landlords/:id
router.put('/landlords/:id', async (req, res) => {
  let { name, email, phone, profile_image, gender } = req.body;
  const nullIfEmpty = v => (v === '' || v === undefined) ? null : v;
  name          = nullIfEmpty(name);
  email         = nullIfEmpty(email);
  phone         = nullIfEmpty(phone);
  profile_image = nullIfEmpty(profile_image);
  gender        = nullIfEmpty(gender);

  try {
    await pool.execute(
      'UPDATE Landlord SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), profile_image = COALESCE(?, profile_image), gender = COALESCE(?, gender) WHERE idLandlord = ?',
      [name, email, phone, profile_image, gender, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/tenants/:id/block  — toggle is_active for tenant
router.put('/tenants/:id/block', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT is_active FROM Tenant WHERE idTenant = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });
    const newStatus = rows[0].is_active ? 0 : 1;
    await pool.execute('UPDATE Tenant SET is_active = ? WHERE idTenant = ?', [newStatus, req.params.id]);
    res.json({ success: true, is_active: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/landlords/:id/block  — toggle is_active for landlord
router.put('/landlords/:id/block', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT is_active FROM Landlord WHERE idLandlord = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Landlord not found' });
    const newStatus = rows[0].is_active ? 0 : 1;
    await pool.execute('UPDATE Landlord SET is_active = ? WHERE idLandlord = ?', [newStatus, req.params.id]);
    res.json({ success: true, is_active: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/auth/tenants/:id
router.delete('/tenants/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM Booking WHERE Tenant_idTenant = ?', [req.params.id]);
    await pool.execute('DELETE FROM Review  WHERE Tenant_idTenant = ?', [req.params.id]);
    await pool.execute('DELETE FROM Tenant  WHERE idTenant = ?',        [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/auth/landlords/:id
router.delete('/landlords/:id', async (req, res) => {
  try {
    // Cascade: delete rooms/bookings/reviews belonging to landlord's properties
    const [props] = await pool.execute('SELECT idProperty FROM Property WHERE Landlord_idLandlord = ?', [req.params.id]);
    for (const p of props) {
      const [rooms] = await pool.execute('SELECT idRoom FROM Room WHERE Property_idProperty = ?', [p.idProperty]);
      const roomIds = rooms.map(r => r.idRoom);
      if (roomIds.length > 0) {
        await pool.execute(`DELETE FROM Booking WHERE Room_idRoom IN (${roomIds.map(() => '?').join(',')})`, roomIds);
      }
      await pool.execute('DELETE FROM Review   WHERE Property_idProperty = ?', [p.idProperty]);
      await pool.execute('DELETE FROM Room     WHERE Property_idProperty = ?', [p.idProperty]);
    }
    await pool.execute('DELETE FROM Property WHERE Landlord_idLandlord = ?', [req.params.id]);
    await pool.execute('DELETE FROM Landlord WHERE idLandlord = ?',          [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

