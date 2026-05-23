const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/upload
// Accepts an array of files under the field name 'images'
router.post('/', upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    // Return the URLs for the uploaded files
    const urls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ success: true, urls });
  } catch (err) {
    console.error('[POST /api/upload] ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
