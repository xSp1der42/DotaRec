const mongoose = require('mongoose');

const predictorMatchSchema = new mongoose.Schema({
  game: {
    type: String,
    enum: ['dota2', 'cs2'],
    required: true,
  },
  team1: {
    name: {
      type: String,
      required: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
  },
  team2: {
    name: {
      type: String,
      required: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
  },
  startTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'draft_phase', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  draftPhase: {
    started: {
      type: Boolean,
      default: false,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    results: {
      firstBan: {
        team1: String,
        team2: String,
      },
      firstPick: {
        team1: String,
        team2: String,
      },
      mostBanned: String,
      picks: {
        team1: [String],
        team2: [String],
      },
    },
  },
  predictionTypes: [{
    type: {
      type: String,
      required: true,
    },
    options: [String],
    rewardPool: {
      type: Number,
      default: 0,
    },
    betsCount: {
      type: Number,
      default: 0,
    },
    closed: {
      type: Boolean,
      default: false,
    },
  }],
}, { timestamps: true });

// Индексы для оптимизации запросов
predictorMatchSchema.index({ startTime: 1, status: 1 });
predictorMatchSchema.index({ game: 1 });
predictorMatchSchema.index({ status: 1 });

module.exports = mongoose.model('PredictorMatch', predictorMatchSchema);
