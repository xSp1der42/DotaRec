// backend/models/predictorMatchModel.js

const mongoose = require('mongoose');

// Вложенная схема для описания типа предсказания
const predictionTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['winner', 'overtime', 'mvp', 'first_blood', 'total_maps'], // Добавляем возможные типы
  },
  title: { // Заголовок, который будет отображаться в UI
    type: String,
    required: true,
  },
  options: [{ // Предопределенные варианты, например, для овертайма ['Да', 'Нет']
    type: String,
  }],
  // НОВОЕ: Поле для динамических опций, например, для MVP
  playerSource: {
    type: String,
    enum: ['match_teams', null], // Указывает, что опции - это игроки из команд матча
    default: null,
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
  },
  odds: { // Можно хранить коэффициенты здесь
    type: Map,
    of: Number,
  },
}, { _id: false });

const predictorMatchSchema = new mongoose.Schema({
  game: {
    type: String,
    enum: ['dota2', 'cs2'],
    required: true,
  },
  team1: {
    name: { type: String, required: true },
    logoUrl: { type: String, default: '' },
    // НОВОЕ: Ссылка на модель Team для удобного получения игроков
    teamRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
  },
  team2: {
    name: { type: String, required: true },
    logoUrl: { type: String, default: '' },
    // НОВОЕ: Ссылка на модель Team для удобного получения игроков
    teamRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
  },
  startTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  // Используем новую, более гибкую схему
  predictionTypes: [predictionTypeSchema],
  
  // Результаты матча для автоматического расчета ставок
  results: {
    winner: { type: String }, // 'team1' или 'team2'
    overtime: { type: Boolean },
    mvp: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    // ... другие результаты
  },
}, { timestamps: true });

// Индексы для ускорения запросов
predictorMatchSchema.index({ status: 1, startTime: 1 });
predictorMatchSchema.index({ game: 1 });

module.exports = mongoose.model('PredictorMatch', predictorMatchSchema);