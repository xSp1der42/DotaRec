// backend/models/playerModel.js

const mongoose = require('mongoose');

// Вложенные схемы для детализации
const achievementSchema = new mongoose.Schema({
  year: { type: String }, // Используем String для гибкости, например '2023-08-15'
  event: { type: String },
  placing: { type: String },
}, { _id: false });

const matchHistorySchema = new mongoose.Schema({
  event: { type: String },
  opponent: { type: String },
  result: { type: String },
}, { _id: false });

const playerSchema = new mongoose.Schema({
  ovr: { type: Number, required: true },
  game: { type: String, enum: ['dota', 'cs'], default: 'dota' },
  image_url: { type: String },
  nickname: { type: String, required: true },
  fullName: { type: String },
  team: { type: String },
  rarity: { type: String, default: 'common' },
  position: { type: String }, // e.g., 'POS 1', 'Entry Fragger'
  stats: {
    type: Map,
    of: Number, // Статы теперь числовые
  },
  detailedInfo: { type: String },
  achievements: [achievementSchema],
  matchHistory: [matchHistorySchema],
  
  // НОВОЕ: Привязка к сезону
  season: {
    type: Number,
    required: true,
    default: 1,
  },
  
  // Старые поля для совместимости
  clicks: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);