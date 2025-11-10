// backend/models/marketplaceModel.js

const mongoose = require('mongoose');

const marketplaceListingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 1,
  },
  season: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled'],
    default: 'active',
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  soldAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Индексы для быстрого поиска
marketplaceListingSchema.index({ status: 1, season: 1 });
marketplaceListingSchema.index({ seller: 1 });
marketplaceListingSchema.index({ card: 1 });
marketplaceListingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MarketplaceListing', marketplaceListingSchema);

