const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/properties
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Property');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/properties
router.post('/', async (req, res) => {
  const { title, location, description, image, Landlord_idLandlord } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO Property (title, location, description, image, Landlord_idLandlord, Admin_idAdmin) VALUES (?, ?, ?, ?, ?, 1)',
      [title, location, description, image || 'assets/images/property-1.png', Landlord_idLandlord]
    );
    res.status(201).json({ success: true, idProperty: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/properties/:id
router.delete('/:id', async (req, res) => {
  try {
    // Delete related bookings first (via rooms)
    const [rooms] = await pool.execute('SELECT idRoom FROM Room WHERE Property_idProperty = ?', [req.params.id]);
    const roomIds = rooms.map(r => r.idRoom);
    if (roomIds.length > 0) {
      await pool.execute(`DELETE FROM Booking WHERE Room_idRoom IN (${roomIds.join(',')})`);
    }
    // Delete reviews, rooms, then property
    await pool.execute('DELETE FROM Review WHERE Property_idProperty = ?', [req.params.id]);
    await pool.execute('DELETE FROM Room WHERE Property_idProperty = ?', [req.params.id]);
    await pool.execute('DELETE FROM Property WHERE idProperty = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
