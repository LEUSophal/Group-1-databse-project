const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/reviews  (optionally filter by ?property_id=X)
router.get('/', async (req, res) => {
  try {
    const { property_id } = req.query;
    let rows;
    if (property_id) {
      [rows] = await pool.execute('SELECT * FROM Review WHERE Property_idProperty = ?', [property_id]);
    } else {
      [rows] = await pool.execute('SELECT * FROM Review');
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews
router.post('/', async (req, res) => {
  const { rating, comment, Tenant_idTenant, Property_idProperty } = req.body;
  try {
    // Gate: tenant must have a confirmed booking for a room in this property
    const [bookings] = await pool.execute(
      `SELECT b.idBooking FROM Booking b
       JOIN Room r ON b.Room_idRoom = r.idRoom
       WHERE b.Tenant_idTenant = ? AND r.Property_idProperty = ? AND b.status = 'confirmed'`,
      [Tenant_idTenant, Property_idProperty]
    );
    if (bookings.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only review a property after a confirmed stay'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO Review (rating, comment, Tenant_idTenant, Property_idProperty, Admin_idAdmin) VALUES (?, ?, ?, ?, 1)',
      [rating, comment || '', Tenant_idTenant, Property_idProperty]
    );
    res.status(201).json({ success: true, idReview: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE /api/reviews/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM Review WHERE idReview = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
