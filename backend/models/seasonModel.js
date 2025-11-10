// backend/models/seasonModel.js

const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  seasonNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Индекс для быстрого поиска активного сезона
seasonSchema.index({ isActive: 1 });
seasonSchema.index({ seasonNumber: -1 });

module.exports = mongoose.model('Season', seasonSchema);

