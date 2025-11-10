const mongoose = require('mongoose');

const packSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  cards_in_pack: { type: Number, required: true },
  player_pool: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
  }],
}, { timestamps: true });

module.exports = mongoose.model('Pack', packSchema);