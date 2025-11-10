// backend/routes/pickemRoutes.js

const express = require('express');
const router = express.Router();
const PickemEvent = require('../models/pickemEventModel');
const UserPick = require('../models/userPickModel');
const { protect, admin } = require('../middleware/authMiddleware');

// --- Events Routes ---

// GET all active events
router.get('/events', async (req, res) => {
  try {
    const events = await PickemEvent.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET all events for admin
router.get('/events/all', protect, admin, async (req, res) => {
  try {
    const events = await PickemEvent.find({}).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET single event by ID
router.get('/events/:id', async (req, res) => {
    try {
        const event = await PickemEvent.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// POST new event (admin)
router.post('/events', protect, admin, async (req, res) => {
  try {
    const { title, description } = req.body;
    const newEvent = new PickemEvent({ title, description, stages: [] });
    const createdEvent = await newEvent.save();
    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(400).json({ message: 'Error creating event', error: error.message });
  }
});

// PUT update event (admin) - ОСНОВНОЙ РОУТ ДЛЯ ИЗМЕНЕНИЙ
// Мы будем присылать весь обновленный объект события с фронтенда
router.put('/events/:id', protect, admin, async (req, res) => {
    try {
        const { title, description, isActive, stages } = req.body;
        const event = await PickemEvent.findById(req.params.id);

        if (event) {
            event.title = title || event.title;
            event.description = description || event.description;
            event.isActive = isActive !== undefined ? isActive : event.isActive;
            event.stages = stages || event.stages;

            const updatedEvent = await event.save();
            res.json(updatedEvent);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error updating event', error: error.message });
    }
});


// DELETE event (admin)
router.delete('/events/:id', protect, admin, async (req, res) => {
  try {
    const result = await PickemEvent.findByIdAndDelete(req.params.id);
    if (result) {
      // Также удаляем пики пользователей, связанные с этим событием
      await UserPick.deleteMany({ event_id: req.params.id });
      res.json({ message: 'Event and associated picks removed' });
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});


// --- User Picks Routes ---

// GET user picks for a specific event
router.get('/picks/:eventId', protect, async (req, res) => {
    try {
        const userPick = await UserPick.findOne({ user_id: req.user.id, event_id: req.params.eventId });
        if (userPick) {
            res.json(userPick);
        } else {
            // Если пиков нет, возвращаем пустой объект, чтобы фронтенд не падал
            res.json({ event_id: req.params.eventId, picks: {} });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// POST/PUT user pick for a specific event
router.post('/picks', protect, async (req, res) => {
    const { eventId, picks } = req.body;
    try {
        const userPick = await UserPick.findOneAndUpdate(
            { user_id: req.user.id, event_id: eventId },
            { $set: { picks: picks } }, // Используем $set для безопасности
            { new: true, upsert: true } // upsert: create if not found
        );
        res.json(userPick);
    } catch (error) {
        res.status(400).json({ message: 'Error saving picks', error: error.message });
    }
});

module.exports = router;