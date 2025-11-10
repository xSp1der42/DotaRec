// backend/routes/playerRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Player = require('../models/playerModel');
const { protect, admin } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const players = await Player.find({}).sort({ order: 1 });
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- ИЗМЕНЕНИЕ ЗДЕСЬ (добавлена positionNumber) ---
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const playerData = JSON.parse(req.body.playerData);
    const { id, _id, ...restData } = playerData;

    const newPlayer = new Player({
      ...restData,
      image_url: req.file ? `/uploads/${req.file.filename}` : null,
    });

    const createdPlayer = await newPlayer.save();
    res.status(201).json(createdPlayer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- ИЗМЕНЕНИЕ ЗДЕСЬ (добавлена positionNumber) ---
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);

        if (player) {
            const playerData = JSON.parse(req.body.playerData);
            const { _id, id, ...updateData } = playerData;

            Object.assign(player, updateData);
            
            if (req.file) {
                player.image_url = `/uploads/${req.file.filename}`;
            }

            const updatedPlayer = await player.save();
            res.json(updatedPlayer);
        } else {
            res.status(404).json({ message: 'Player not found' });
        }
    } catch (error) {
        console.error("ОШИБКА ПРИ ОБНОВЛЕНИНИИ:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (player) {
      await player.deleteOne();
      res.json({ message: 'Player removed' });
    } else {
      res.status(404).json({ message: 'Player not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/reorder', protect, admin, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    const updatePromises = orderedIds.map((id, index) =>
      Player.findByIdAndUpdate(id, { order: index })
    );
    await Promise.all(updatePromises);
    res.json({ message: 'Players reordered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/:id/click', async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (player) {
            player.clicks = (player.clicks || 0) + 1;
            await player.save();
            res.json({ clicks: player.clicks });
        } else {
            res.status(404).json({ message: 'Player not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;