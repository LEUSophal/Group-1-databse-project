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
