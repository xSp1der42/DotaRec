const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['match_starting', 'prediction_result'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PredictorMatch',
    },
    betId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PredictorBet',
    },
    reward: {
      type: Number,
      default: 0,
    },
  },
  read: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
  },
}, { timestamps: true });

// Индексы для оптимизации запросов
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
// TTL индекс для автоудаления через 30 дней
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
