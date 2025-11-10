const express = require('express');
const router = express.Router();
const PickemEvent = require('../models/pickemEventModel');
const UserPick = require('../models/userPickModel');
const { protect, admin } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// --- Events Routes ---

// GET all events
router.get('/events', async (req, res) => {
  try {
    const events = await PickemEvent.find({});
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST new event (admin)
router.post('/events', protect, admin, async (req, res) => {
  try {
    const newEvent = new PickemEvent({ title: req.body.title, matches: [] });
    const createdEvent = await newEvent.save();
    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE event (admin)
router.delete('/events/:id', protect, admin, async (req, res) => {
  try {
    const event = await PickemEvent.findById(req.params.id);
    if (event) {
      await event.deleteOne();
      res.json({ message: 'Event removed' });
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- Matches Routes (within events) ---

// POST or PUT match in an event (admin)
router.post('/events/:id/matches', protect, admin, async (req, res) => {
    const eventId = req.params.id;
    const matchData = req.body;
    try {
        const event = await PickemEvent.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const matchExists = event.matches.some(m => m.id === matchData.id);

        if (matchExists) {
            // Update existing match
            event.matches = event.matches.map(m => (m.id === matchData.id ? matchData : m));
        } else {
            // Add new match
            event.matches.push({ ...matchData, id: matchData.id || uuidv4() });
        }

        const updatedEvent = await event.save();
        res.json(updatedEvent);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// DELETE match from an event (admin)
router.delete('/events/:eventId/matches/:matchId', protect, admin, async (req, res) => {
    const { eventId, matchId } = req.params;
    try {
        const event = await PickemEvent.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        event.matches = event.matches.filter(m => m.id !== matchId);
        
        const updatedEvent = await event.save();
        res.json(updatedEvent);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- User Picks Routes ---

// GET user picks for all events
router.get('/picks', protect, async (req, res) => {
    try {
        const userPicks = await UserPick.find({ user_id: req.user.id });
        res.json(userPicks);
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
            { picks: picks },
            { new: true, upsert: true } // upsert: create if not found
        );
        res.json(userPick);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


module.exports = router;