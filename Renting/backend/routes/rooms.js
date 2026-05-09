const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/rooms  (optionally filter by ?property_id=X)
router.get('/', async (req, res) => {
  try {
    const { property_id } = req.query;
    let rows;
    if (property_id) {
      [rows] = await pool.execute('SELECT * FROM Room WHERE Property_idProperty = ?', [property_id]);
    } else {
      [rows] = await pool.execute('SELECT * FROM Room');
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms
router.post('/', async (req, res) => {
  const { type, price, status, Property_idProperty } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO Room (type, price, status, Property_idProperty, Admin_idAdmin) VALUES (?, ?, ?, ?, 1)',
      [type, price || 0, status || 'available', Property_idProperty]
    );
    res.status(201).json({ success: true, idRoom: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rooms/:id  (update status)
router.put('/:id', async (req, res) => {
  const { type, price, status } = req.body;
  try {
    await pool.execute(
      'UPDATE Room SET type = COALESCE(?, type), price = COALESCE(?, price), status = COALESCE(?, status) WHERE idRoom = ?',
      [type, price, status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rooms/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM Booking WHERE Room_idRoom = ?', [req.params.id]);
    await pool.execute('DELETE FROM Room WHERE idRoom = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
