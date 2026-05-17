const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/bookings  (optionally filter by ?tenant_id=X or ?landlord_id=X)
router.get('/', async (req, res) => {
  try {
    const { tenant_id, landlord_id } = req.query;
    let rows;
    if (tenant_id) {
      [rows] = await pool.execute('SELECT * FROM Booking WHERE Tenant_idTenant = ?', [tenant_id]);
    } else if (landlord_id) {
      [rows] = await pool.execute(
        `SELECT b.* FROM Booking b
         JOIN Room r ON b.Room_idRoom = r.idRoom
         JOIN Property p ON r.Property_idProperty = p.idProperty
         WHERE p.Landlord_idLandlord = ?`, [landlord_id]
      );
    } else {
      [rows] = await pool.execute('SELECT * FROM Booking');
    }
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
    // When confirming, mark the room as booked; when cancelling, mark it available again
    if (status === 'confirmed' || status === 'cancelled') {
      const roomStatus = status === 'confirmed' ? 'booked' : 'available';
      const [booking] = await pool.execute('SELECT Room_idRoom FROM Booking WHERE idBooking = ?', [req.params.id]);
      if (booking.length > 0) {
        await pool.execute('UPDATE Room SET status = ? WHERE idRoom = ?', [roomStatus, booking[0].Room_idRoom]);
      }
    }
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
