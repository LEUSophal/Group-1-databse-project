const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/bookings
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Booking');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings
router.post('/', async (req, res) => {
  const { check_in, check_out, Tenant_idTenant, Room_idRoom } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO Booking (check_in, check_out, status, Tenant_idTenant, Room_idRoom, Admin_idAdmin) VALUES (?, ?, ?, ?, ?, 1)',
      [check_in, check_out, 'pending', Tenant_idTenant, Room_idRoom]
    );
    res.status(201).json({ success: true, idBooking: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bookings/:id
router.put('/:id', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.execute('UPDATE Booking SET status = ? WHERE idBooking = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bookings/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM Booking WHERE idBooking = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
