const express = require('express');
const router = express.Router();
const Pack = require('../models/packModel');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/packs
router.get('/', async (req, res) => {
  try {
    const packs = await Pack.find({});
    res.json(packs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/packs
router.post('/', protect, admin, async (req, res) => {
  try {
    const newPack = new Pack(req.body);
    const createdPack = await newPack.save();
    res.status(201).json(createdPack);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/packs/:id
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { name, description, price, cards_in_pack, player_pool } = req.body;
        const pack = await Pack.findById(req.params.id);

        if (pack) {
            pack.name = name;
            pack.description = description;
            pack.price = price;
            pack.cards_in_pack = cards_in_pack;
            pack.player_pool = player_pool;

            const updatedPack = await pack.save();
            res.json(updatedPack);
        } else {
            res.status(404).json({ message: 'Pack not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// @route   DELETE /api/packs/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const pack = await Pack.findById(req.params.id);
    if (pack) {
      await pack.deleteOne();
      res.json({ message: 'Pack removed' });
    } else {
      res.status(404).json({ message: 'Pack not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;