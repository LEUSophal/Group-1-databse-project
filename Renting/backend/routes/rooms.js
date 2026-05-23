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
  const { type, price, status, size, capacity, facilities, images, Property_idProperty } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO Room (type, price, status, size, capacity, facilities, images, Property_idProperty, Admin_idAdmin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [type, price || 0, status || 'available', size || 0, capacity || 1, facilities || '', images || null, Property_idProperty]
    );
    res.status(201).json({ success: true, idRoom: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rooms/:id
router.put('/:id', async (req, res) => {
  let { type, price, status, size, capacity, facilities, images } = req.body;
  console.log(`[PUT /api/rooms/${req.params.id}] Body:`, req.body);

  // Convert empty strings / undefined to null so COALESCE keeps the existing DB value
  const nullIfEmpty = v => (v === '' || v === undefined || v === null) ? null : v;
  type       = nullIfEmpty(type);
  status     = nullIfEmpty(status);
  facilities = nullIfEmpty(facilities);
  images     = nullIfEmpty(images);
  // Numeric fields: keep null if not provided so COALESCE falls back
  price    = (price === '' || price === undefined || price === null) ? null : Number(price);
  size     = (size  === '' || size  === undefined || size  === null) ? null : Number(size);
  capacity = (capacity === '' || capacity === undefined || capacity === null) ? null : Number(capacity);

  console.log(`[PUT /api/rooms/${req.params.id}] Processed:`, { type, price, status, size, capacity, facilities, images });

  try {
    const [result] = await pool.execute(
      `UPDATE Room SET 
        type       = COALESCE(?, type), 
        price      = COALESCE(?, price), 
        status     = COALESCE(?, status),
        size       = COALESCE(?, size),
        capacity   = COALESCE(?, capacity),
        facilities = COALESCE(?, facilities),
        images     = COALESCE(?, images)
       WHERE idRoom = ?`,
      [type, price, status, size, capacity, facilities, images, req.params.id]
    );
    console.log(`[PUT /api/rooms/${req.params.id}] affectedRows:`, result.affectedRows);
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error(`[PUT /api/rooms/${req.params.id}] ERROR:`, err.message);
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
