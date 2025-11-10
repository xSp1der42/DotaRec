// backend/models/fantasyEventModel.js

const mongoose = require('mongoose');

const fantasyEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  rosterLockDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Active', 'Completed'],
    default: 'Upcoming',
  },
}, { timestamps: true });

module.exports = mongoose.model('FantasyEvent', fantasyEventSchema);