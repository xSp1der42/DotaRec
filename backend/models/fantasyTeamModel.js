// backend/models/fantasyTeamModel.js

const mongoose = require('mongoose');

const emblemSchema = new mongoose.Schema({
  color: { type: String, required: true, enum: ['red', 'green', 'blue'] },
  stat: { type: String, required: true }, // e.g., 'kills', 'gpm', 'wards_placed'
  quality: { type: Number, required: true, min: 1, max: 5 }, // Разряд 1-5
  property: {
    type: String,
    required: true,
    enum: ['nesgibaemaya', 'unikalnaya', 'blagotvornaya', 'vampiricheskaya', 'druzhelyubnaya'],
  },
}, { _id: false });

const playerSlotSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player', // <-- ИЗМЕНЕНИЕ: было 'ProPlayer', стало 'Player'
    default: null,
  },
  title: {
    adjective: { type: String, default: '' }, // e.g., 'зверский'
    noun: { type: String, default: '' }, // e.g., 'служитель Муравья'
  },
  banner: [emblemSchema],
}, { _id: false });

const fantasyTeamSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FantasyEvent',
    required: true,
  },
  players: {
    // ВАЖНО: Мы будем использовать position из модели Player для определения ролей
    // На фронтенде мы будем фильтровать: 'Carry'/'Offlane' -> core, 'Midlane' -> mid, 'Support' -> support
    core: playerSlotSchema,
    mid: playerSlotSchema,
    support: playerSlotSchema,
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  replacementTokens: {
    type: Number,
    default: 40,
  },
}, { timestamps: true });

// Гарантируем, что у одного пользователя может быть только одна команда на одно событие
fantasyTeamSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('FantasyTeam', fantasyTeamSchema);