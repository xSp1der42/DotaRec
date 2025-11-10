// backend/routes/marketplaceRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const MarketplaceListing = require('../models/marketplaceModel');
const User = require('../models/userModel');
const Player = require('../models/playerModel');
const Season = require('../models/seasonModel');

// Получить все активные объявления (публичный роут)
router.get('/', async (req, res) => {
  try {
    const { season, minPrice, maxPrice, cardId, sortBy = 'newest' } = req.query;
    
    // Получаем текущий сезон
    const currentSeason = await Season.findOne({ isActive: true });
    const seasonNumber = season ? parseInt(season) : (currentSeason ? currentSeason.seasonNumber : 1);
    
    const filter = { 
      status: 'active',
      season: seasonNumber
    };
    
    if (cardId) filter.card = cardId;
    if (minPrice) filter.price = { ...filter.price, $gte: parseInt(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: parseInt(maxPrice) };
    
    let sort = {};
    switch (sortBy) {
      case 'price_asc':
        sort = { price: 1 };
        break;
      case 'price_desc':
        sort = { price: -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }
    
    const listings = await MarketplaceListing.find(filter)
      .populate('seller', 'nickname avatarUrl')
      .populate('card')
      .sort(sort)
      .limit(50);
    
    res.json(listings);
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Получить мои объявления (требует авторизации) - ДОЛЖЕН БЫТЬ ПЕРЕД /:id
router.get('/my/listings', protect, async (req, res) => {
  try {
    const listings = await MarketplaceListing.find({ seller: req.user.id })
      .populate('card')
      .populate('buyer', 'nickname avatarUrl')
      .sort({ createdAt: -1 });
    
    res.json(listings);
  } catch (error) {
    console.error('Error fetching my listings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Получить объявление по ID
router.get('/:id', async (req, res) => {
  try {
    const listing = await MarketplaceListing.findById(req.params.id)
      .populate('seller', 'nickname avatarUrl')
      .populate('card');
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    res.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Создать объявление (требует авторизации)
router.post('/', protect, async (req, res) => {
  try {
    const { cardId, price } = req.body;
    
    if (!cardId || !price) {
      return res.status(400).json({ message: 'Card ID and price are required' });
    }
    
    if (price < 1) {
      return res.status(400).json({ message: 'Price must be at least 1 coin' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Проверяем, есть ли карточка в коллекции или хранилище
    const hasInCollection = user.cardCollection.includes(cardId);
    const hasInStorage = user.storage.includes(cardId);
    
    if (!hasInCollection && !hasInStorage) {
      return res.status(400).json({ message: 'Card not found in your collection or storage' });
    }
    
    // Получаем текущий сезон
    const currentSeason = await Season.findOne({ isActive: true });
    const seasonNumber = currentSeason ? currentSeason.seasonNumber : (user.currentSeason || 1);
    
    // Удаляем карточку из коллекции или хранилища
    if (hasInCollection) {
      user.cardCollection = user.cardCollection.filter(id => id.toString() !== cardId.toString());
    } else {
      user.storage = user.storage.filter(id => id.toString() !== cardId.toString());
    }
    await user.save();
    
    // Создаем объявление
    const listing = new MarketplaceListing({
      seller: user._id,
      card: cardId,
      price: parseInt(price),
      season: seasonNumber,
    });
    
    await listing.save();
    
    const populatedListing = await MarketplaceListing.findById(listing._id)
      .populate('seller', 'nickname avatarUrl')
      .populate('card');
    
    res.status(201).json(populatedListing);
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Купить карточку (требует авторизации)
router.post('/:id/buy', protect, async (req, res) => {
  try {
    const listing = await MarketplaceListing.findById(req.params.id)
      .populate('seller')
      .populate('card');
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    if (listing.status !== 'active') {
      return res.status(400).json({ message: 'Listing is not active' });
    }
    
    if (listing.seller._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot buy your own listing' });
    }
    
    const buyer = await User.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    
    if (buyer.coins < listing.price) {
      return res.status(400).json({ message: 'Insufficient coins' });
    }
    
    // Получаем текущий сезон
    const currentSeason = await Season.findOne({ isActive: true });
    const seasonNumber = currentSeason ? currentSeason.seasonNumber : (buyer.currentSeason || 1);
    
    // Проверяем, есть ли уже такая карточка в коллекции
    if (!buyer.cardCollection.includes(listing.card._id)) {
      buyer.cardCollection.push(listing.card._id);
    } else {
      // Если уже есть, добавляем в хранилище (если есть место)
      if (buyer.storage.length < 100) {
        buyer.storage.push(listing.card._id);
      } else {
        return res.status(400).json({ message: 'Your collection and storage are full' });
      }
    }
    
    // Переводим коины
    buyer.coins -= listing.price;
    const seller = await User.findById(listing.seller._id);
    seller.coins += listing.price;
    
    // Обновляем объявление
    listing.status = 'sold';
    listing.buyer = buyer._id;
    listing.soldAt = new Date();
    
    await Promise.all([buyer.save(), seller.save(), listing.save()]);
    
    res.json({
      message: 'Card purchased successfully',
      newBalance: buyer.coins,
      card: listing.card
    });
  } catch (error) {
    console.error('Error buying card:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Отменить объявление (только продавец)
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await MarketplaceListing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own listings' });
    }
    
    if (listing.status !== 'active') {
      return res.status(400).json({ message: 'Only active listings can be cancelled' });
    }
    
    // Возвращаем карточку в хранилище
    const user = await User.findById(req.user.id);
    if (user.storage.length < 100) {
      user.storage.push(listing.card);
      await user.save();
    }
    
    listing.status = 'cancelled';
    await listing.save();
    
    res.json({ message: 'Listing cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling listing:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;

