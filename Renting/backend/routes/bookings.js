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
    // Guard: ensure room is still available before booking
    const [roomRows] = await pool.execute('SELECT status, price FROM Room WHERE idRoom = ?', [Room_idRoom]);
    if (roomRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    if (roomRows[0].status !== 'available') {
      return res.status(409).json({ success: false, message: 'This room is not available for booking' });
    }

    // Guard: check for date overlap with existing non-cancelled bookings
    const [overlap] = await pool.execute(
      `SELECT idBooking FROM Booking
       WHERE Room_idRoom = ? AND status != 'cancelled'
       AND NOT (check_out <= ? OR check_in >= ?)`,
      [Room_idRoom, check_in, check_out]
    );
    if (overlap.length > 0) {
      return res.status(409).json({ success: false, message: 'Room is already booked for the selected dates' });
    }

    // Validate dates
    const inDate  = new Date(check_in);
    const outDate = new Date(check_out);
    if (isNaN(inDate) || isNaN(outDate) || outDate <= inDate) {
      return res.status(400).json({ success: false, message: 'Invalid dates: move-out must be after move-in' });
    }

    // Calculate total_price (price per month × months)
    const months = Math.max(1, Math.round((outDate - inDate) / (1000 * 60 * 60 * 24 * 30)));
    const total_price = (roomRows[0].price * months).toFixed(2);

    const [result] = await pool.execute(
      'INSERT INTO Booking (check_in, check_out, status, Tenant_idTenant, Room_idRoom, Admin_idAdmin) VALUES (?, ?, ?, ?, ?, 1)',
      [check_in, check_out, 'pending', Tenant_idTenant, Room_idRoom]
    );
    res.status(201).json({ success: true, idBooking: result.insertId, total_price });
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
