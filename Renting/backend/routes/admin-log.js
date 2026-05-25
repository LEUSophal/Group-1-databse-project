const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/admin-log  — fetch all log entries newest first
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT al.log_id, al.action_type, al.target_table, al.target_id,
             al.description, al.action_date, a.name AS admin_name
      FROM Admin_Log al
      LEFT JOIN Admin a ON al.Admin_idAdmin = a.idAdmin
      ORDER BY al.action_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/admin-log] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin-log  — insert a new log entry
router.post('/', async (req, res) => {
  const { Admin_idAdmin, action_type, target_table, target_id, description } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO Admin_Log (Admin_idAdmin, action_type, target_table, target_id, description) VALUES (?, ?, ?, ?, ?)',
      [Admin_idAdmin || 1, action_type, target_table, target_id || null, description || null]
    );
    res.status(201).json({ success: true, log_id: result.insertId });
  } catch (err) {
    console.error('[POST /api/admin-log] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
