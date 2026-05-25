const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/facilities  — list all available facilities
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Facility ORDER BY facility_name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/facilities  — create a new facility (admin)
router.post('/', async (req, res) => {
  const { facility_name, description } = req.body;
  if (!facility_name) return res.status(400).json({ success: false, message: 'facility_name is required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO Facility (facility_name, description) VALUES (?, ?)',
      [facility_name, description || null]
    );
    res.status(201).json({ success: true, facility_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/facilities/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM Room_Facility WHERE facility_id = ?', [req.params.id]);
    await pool.execute('DELETE FROM Facility WHERE facility_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
