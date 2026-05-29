const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const propertiesRoutes = require('./routes/properties');
const roomsRoutes = require('./routes/rooms');
const bookingsRoutes = require('./routes/bookings');
const reviewsRoutes = require('./routes/reviews');
const uploadRoutes = require('./routes/upload');
const adminLogRoutes = require('./routes/admin-log');
const { authMiddleware, adminOnly } = require('./middleware/auth');
const facilitiesRoutes = require('./routes/facilities');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/bookings', authMiddleware, bookingsRoutes);
app.use('/api/reviews', authMiddleware, reviewsRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/admin-log', authMiddleware, adminOnly, adminLogRoutes);
app.use('/api/facilities', facilitiesRoutes);


// Start server
app.listen(PORT, () => {
  console.log(`\n  🏠 Renting API Server running on http://localhost:${PORT}`);
  console.log(`  📁 Frontend served at http://localhost:${PORT}/index.html`);
  console.log(`  📡 API available at http://localhost:${PORT}/api\n`);
});
