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
// ------------------

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));