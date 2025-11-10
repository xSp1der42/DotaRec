const mongoose = require('mongoose');

const predictorBetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PredictorMatch',
    required: true,
  },
  predictions: [{
    type: {
      type: String,
      required: true,
    },
    choice: {
      type: String,
      required: true,
    },
    betAmount: {
      type: Number,
      required: true,
      min: 10,
      max: 10000,
    },
    odds: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'won', 'lost'],
      default: 'pending',
    },
    reward: {
      type: Number,
      default: 0,
    },
  }],
  totalBet: {
    type: Number,
    required: true,
    default: 0,
  },
  totalReward: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Индексы для оптимизации запросов
predictorBetSchema.index({ userId: 1, createdAt: -1 });
predictorBetSchema.index({ matchId: 1 });
predictorBetSchema.index({ userId: 1, matchId: 1 });

module.exports = mongoose.model('PredictorBet', predictorBetSchema);
