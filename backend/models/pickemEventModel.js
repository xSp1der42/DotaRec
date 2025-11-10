// backend/models/pickemEventModel.js

const mongoose = require('mongoose');

// Схема для одного матча (для большей строгости)
const matchSchema = new mongoose.Schema({
  id: { type: String, required: true },
  matchTime: { type: String, required: true },
  boFormat: { type: String, default: 'BO3' },
  status: { type: String, enum: ['upcoming', 'live', 'finished'], default: 'upcoming' },
  teamA: {
    name: { type: String, required: true },
    logoUrl: { type: String },
    score: { type: Number, default: 0 }
  },
  teamB: {
    name: { type: String, required: true },
    logoUrl: { type: String },
    score: { type: Number, default: 0 }
  },
  maps: [{
    name: String,
    teamAScore: Number,
    teamBScore: Number,
  }],
  winner: { type: String, default: null },
}, { _id: false });


// Схема для одного этапа (Stage)
const stageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    matches: [matchSchema] // Используем строгую схему матчей
}, { _id: false });

// Основная схема события Pick'em
const pickemEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  stages: [stageSchema], // Теперь у нас массив этапов
}, { timestamps: true });

module.exports = mongoose.model('PickemEvent', pickemEventSchema);