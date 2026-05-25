const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/rooms  (optionally filter by ?property_id=X or search params)
router.get('/', async (req, res) => {
  try {
    const { property_id, type, min_price, max_price, location } = req.query;
    let sql = `SELECT r.*, p.location AS property_location, p.title AS property_title
               FROM Room r
               LEFT JOIN Property p ON r.Property_idProperty = p.idProperty
               WHERE 1=1`;
    const params = [];
    if (property_id)  { sql += ' AND r.Property_idProperty = ?'; params.push(property_id); }
    if (type)         { sql += ' AND r.type = ?';                 params.push(type); }
    if (min_price)    { sql += ' AND r.price >= ?';               params.push(Number(min_price)); }
    if (max_price)    { sql += ' AND r.price <= ?';               params.push(Number(max_price)); }
    if (location)     { sql += ' AND p.location LIKE ?';          params.push(`%${location}%`); }

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:id  — single room with images + facilities
router.get('/:id', async (req, res) => {
  try {
    const [rooms] = await pool.execute(
      `SELECT r.*, p.location AS property_location, p.title AS property_title
       FROM Room r LEFT JOIN Property p ON r.Property_idProperty = p.idProperty
       WHERE r.idRoom = ?`, [req.params.id]
    );
    if (rooms.length === 0) return res.status(404).json({ message: 'Room not found' });
    const room = rooms[0];

    const [images] = await pool.execute(
      'SELECT * FROM Room_Image WHERE room_id = ? ORDER BY is_cover DESC', [req.params.id]
    );
    const [facilities] = await pool.execute(
      `SELECT f.* FROM Facility f
       JOIN Room_Facility rf ON f.facility_id = rf.facility_id
       WHERE rf.room_id = ?`, [req.params.id]
    );
    room.room_images   = images;
    room.room_facilities = facilities;
    res.json(room);
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

// ── ROOM IMAGES sub-routes ──────────────────────────────────────────────────

// GET /api/rooms/:id/images
router.get('/:id/images', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM Room_Image WHERE room_id = ? ORDER BY is_cover DESC', [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms/:id/images  — save uploaded image URLs to Room_Image table
router.post('/:id/images', async (req, res) => {
  const { urls, is_cover } = req.body; // urls: string[] , is_cover index (optional)
  if (!urls || urls.length === 0) return res.status(400).json({ success: false, message: 'No URLs provided' });
  try {
    // If marking a cover, first clear existing cover for this room
    if (is_cover !== undefined) {
      await pool.execute('UPDATE Room_Image SET is_cover = 0 WHERE room_id = ?', [req.params.id]);
    }
    const inserted = [];
    for (let i = 0; i < urls.length; i++) {
      const cover = (is_cover === i || (is_cover === undefined && i === 0)) ? 1 : 0;
      const [result] = await pool.execute(
        'INSERT INTO Room_Image (room_id, image_url, is_cover) VALUES (?, ?, ?)',
        [req.params.id, urls[i], cover]
      );
      inserted.push(result.insertId);
    }
    res.status(201).json({ success: true, image_ids: inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rooms/:id/images/:imageId
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM Room_Image WHERE image_id = ? AND room_id = ?',
      [req.params.imageId, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rooms/:id/images/:imageId/set-cover
router.put('/:id/images/:imageId/set-cover', async (req, res) => {
  try {
    await pool.execute('UPDATE Room_Image SET is_cover = 0 WHERE room_id = ?', [req.params.id]);
    await pool.execute('UPDATE Room_Image SET is_cover = 1 WHERE image_id = ? AND room_id = ?',
      [req.params.imageId, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ROOM FACILITIES sub-routes ─────────────────────────────────────────────

// GET /api/rooms/:id/facilities
router.get('/:id/facilities', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT f.* FROM Facility f
       JOIN Room_Facility rf ON f.facility_id = rf.facility_id
       WHERE rf.room_id = ?`, [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms/:id/facilities  — assign facilities to a room
router.post('/:id/facilities', async (req, res) => {
  const { facility_ids } = req.body; // array of facility_id numbers
  if (!facility_ids || facility_ids.length === 0)
    return res.status(400).json({ success: false, message: 'No facility_ids provided' });
  try {
    for (const fid of facility_ids) {
      await pool.execute(
        'INSERT IGNORE INTO Room_Facility (room_id, facility_id) VALUES (?, ?)',
        [req.params.id, fid]
      );
    }
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rooms/:id/facilities/:facilityId
router.delete('/:id/facilities/:facilityId', async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM Room_Facility WHERE room_id = ? AND facility_id = ?',
      [req.params.id, req.params.facilityId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

