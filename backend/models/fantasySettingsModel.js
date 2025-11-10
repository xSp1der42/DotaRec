// backend/models/fantasySettingsModel.js

const mongoose = require('mongoose');

const fantasySettingsSchema = new mongoose.Schema({
  // Настройки очков
  scoringRules: {
    kills: { type: Number, default: 121 },
    deaths: { type: Number, default: -180 },
    initialDeathScore: { type: Number, default: 1800 },
    creeps: { type: Number, default: 3 },
    gpm: { type: Number, default: 2 },
    runes: { type: Number, default: 121 },
    towers: { type: Number, default: 340 },
    roshan: { type: Number, default: 850 },
    // ... и так далее для всех правил
  },
  
  // Списки слов для генерации титулов
  titles: {
    adjectives: [String],
    nouns: [String],
  },
  
  // Доступные характеристики для эмблем по цветам
  emblemStats: {
    red: [String],   // e.g., ['kills', 'gpm', 'creeps']
    green: [String], // e.g., ['teamfights', 'stuns']
    blue: [String],  // e.g., ['wards_placed', 'camps_stacked']
  },
  
  // Бонусы от качества эмблем (в процентах)
  qualityBonuses: {
    1: { type: Number, default: 10 }, // +10%
    2: { type: Number, default: 30 },
    3: { type: Number, default: 60 },
    4: { type: Number, default: 100 },
    5: { type: Number, default: 150 },
  },

  // Бонусы от свойств эмблем (в процентах)
  propertyBonuses: {
    unikalnaya: { type: Number, default: 30 },
    blagotvornaya: { type: Number, default: 20 },
    vampiricheskaya_self: { type: Number, default: 50 },
    vampiricheskaya_others: { type: Number, default: -10 },
    druzhelyubnaya: { type: Number, default: 50 },
  }
});

// Мы будем использовать эту модель как синглтон (всегда будет только один документ с настройками)
module.exports = mongoose.model('FantasySettings', fantasySettingsSchema);