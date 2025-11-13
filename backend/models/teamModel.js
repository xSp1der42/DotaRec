const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  game: {
    type: String,
    enum: ['dota2', 'cs2'],
    required: true,
  },
  logo: {
    originalUrl: String,
    sizes: {
      small: String,    // 32x32
      medium: String,   // 64x64
      large: String,    // 128x128
    },
    uploadedAt: Date,
    fileSize: Number,
    mimeType: String,
  },
}, { timestamps: true });

// Compound index for game and name
teamSchema.index({ game: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);