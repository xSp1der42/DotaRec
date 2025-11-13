// backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Роуты
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/players', require('./routes/playerRoutes'));
app.use('/api/packs', require('./routes/packRoutes'));
app.use('/api/pickem', require('./routes/pickemRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/fantasy', require('./routes/fantasyRoutes'));
// --- НОВЫЙ РОУТ ---
app.use('/api/fantasy-settings', require('./routes/fantasySettingsRoutes'));
app.use('/api/emblems', require('./routes/emblemRoutes'));
app.use('/api/marketplace', require('./routes/marketplaceRoutes'));
app.use('/api/seasons', require('./routes/seasonRoutes'));
app.use('/api/predictor', require('./routes/predictorRoutes'));
app.use('/api', require('./routes/logoRoutes'));
// ------------------

// Serve static files with optimized caching headers for logos
app.use('/uploads/team-logos', express.static(path.join(__dirname, 'uploads/team-logos'), {
  maxAge: '1y', // Cache for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set additional caching headers for logo files (requirement 5.1)
    if (path.includes('team-logos')) {
      res.set({
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year, immutable
        'Vary': 'Accept-Encoding'
      });
    }
  }
}));

// Serve other uploads with standard caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d' // Cache for 1 day for other uploads
}));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));