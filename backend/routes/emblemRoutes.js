// backend/routes/emblemRoutes.js

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Emblem = require('../models/emblemModel');
const multer = require('multer');
const path = require('path');

// Настройка multer для загрузки изображений эмблем
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/emblems/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'emblem-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'));
    }
  }
});

// --- PUBLIC ROUTES ---

// Получить все активные эмблемы
router.get('/', async (req, res) => {
  try {
    const { color, quality, property, stat } = req.query;
    const filter = { isActive: true };
    
    if (color) filter.color = color;
    if (quality) filter.quality = parseInt(quality);
    if (property) filter.property = property;
    if (stat) filter.stat = stat;
    
    const emblems = await Emblem.find(filter).sort({ quality: -1, name: 1 });
    res.json(emblems);
  } catch (error) {
    console.error('Error fetching emblems:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- ADMIN ROUTES ---

// Получить все эмблемы (включая неактивные) для админа
// ВАЖНО: Этот роут должен быть ПЕРЕД /:id, иначе Express будет интерпретировать /admin/all как /:id
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const emblems = await Emblem.find().sort({ createdAt: -1 });
    res.json(emblems);
  } catch (error) {
    console.error('Error fetching all emblems:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Получить эмблему по ID
router.get('/:id', async (req, res) => {
  try {
    const emblem = await Emblem.findById(req.params.id);
    if (!emblem) {
      return res.status(404).json({ message: 'Emblem not found' });
    }
    res.json(emblem);
  } catch (error) {
    console.error('Error fetching emblem:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Создать новую эмблему
router.post('/', protect, admin, upload.single('icon'), async (req, res) => {
  try {
    const { name, description, color, stat, quality, property, rarity } = req.body;
    
    const emblemData = {
      name,
      description: description || '',
      color,
      stat,
      quality: parseInt(quality),
      property,
      rarity: rarity || 'common',
    };
    
    if (req.file) {
      emblemData.iconUrl = `/uploads/emblems/${req.file.filename}`;
    }
    
    const emblem = new Emblem(emblemData);
    await emblem.save();
    
    res.status(201).json(emblem);
  } catch (error) {
    console.error('Error creating emblem:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Эмблема с таким именем уже существует' });
    }
    res.status(400).json({ message: 'Error creating emblem', error: error.message });
  }
});

// Обновить эмблему
router.put('/:id', protect, admin, upload.single('icon'), async (req, res) => {
  try {
    const { name, description, color, stat, quality, property, rarity, isActive } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color) updateData.color = color;
    if (stat) updateData.stat = stat;
    if (quality) updateData.quality = parseInt(quality);
    if (property) updateData.property = property;
    if (rarity) updateData.rarity = rarity;
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    
    if (req.file) {
      updateData.iconUrl = `/uploads/emblems/${req.file.filename}`;
    }
    
    const emblem = await Emblem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!emblem) {
      return res.status(404).json({ message: 'Emblem not found' });
    }
    
    res.json(emblem);
  } catch (error) {
    console.error('Error updating emblem:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Эмблема с таким именем уже существует' });
    }
    res.status(400).json({ message: 'Error updating emblem', error: error.message });
  }
});

// Удалить эмблему
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const emblem = await Emblem.findByIdAndDelete(req.params.id);
    if (!emblem) {
      return res.status(404).json({ message: 'Emblem not found' });
    }
    res.json({ message: 'Emblem deleted successfully' });
  } catch (error) {
    console.error('Error deleting emblem:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;

