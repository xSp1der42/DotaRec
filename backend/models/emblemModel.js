// backend/models/emblemModel.js

const mongoose = require('mongoose');

const emblemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    required: true,
    enum: ['red', 'green', 'blue'],
  },
  stat: {
    type: String,
    required: true,
  },
  quality: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  property: {
    type: String,
    required: true,
    enum: ['nesgibaemaya', 'unikalnaya', 'blagotvornaya', 'vampiricheskaya', 'druzhelyubnaya'],
  },
  iconUrl: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
}, { timestamps: true });

// Индексы для быстрого поиска
emblemSchema.index({ color: 1, stat: 1 });
emblemSchema.index({ quality: 1 });
emblemSchema.index({ property: 1 });
emblemSchema.index({ isActive: 1 });

module.exports = mongoose.model('Emblem', emblemSchema);

