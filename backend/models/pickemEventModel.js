const mongoose = require('mongoose');

const pickemEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  matches: { type: Array, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('PickemEvent', pickemEventSchema);