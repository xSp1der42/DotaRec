// backend/routes/fantasyRoutes.js

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

const FantasyEvent = require('../models/fantasyEventModel');
const FantasyTeam = require('../models/fantasyTeamModel');
const User = require('../models/userModel');

// --- PUBLIC ROUTES ---

// Получить все активные и предстоящие события
router.get('/events', async (req, res) => {
  try {
    const events = await FantasyEvent.find({ status: { $in: ['Upcoming', 'Active'] } }).sort({ rosterLockDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Получить лидерборд для события
router.get('/leaderboard/:eventId', async (req, res) => {
    try {
        const teams = await FantasyTeam.find({ event: req.params.eventId })
            .sort({ totalScore: -1 })
            .limit(100)
            .populate('user', 'nickname avatarUrl');
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// --- USER PROTECTED ROUTES ---

// Получить игроков, доступных пользователю для выбора (из его коллекции)
router.get('/available-players', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('cardCollection');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const uniquePlayersMap = new Map();
    user.cardCollection.forEach(player => {
      uniquePlayersMap.set(player._id.toString(), player);
    });
    const uniquePlayers = Array.from(uniquePlayersMap.values());

    res.json(uniquePlayers);
  } catch (error)
 {
    console.error('Error fetching available players:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


// Получить свою фэнтези-команду для конкретного события
router.get('/my-team/:eventId', protect, async (req, res) => {
  try {
    const team = await FantasyTeam.findOne({ user: req.user._id, event: req.params.eventId })
      .populate('players.core.player')
      .populate('players.mid.player')
      .populate('players.support.player');
      
    res.json(team);

  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});


// --- ИСПРАВЛЕННЫЙ РОУТ ---
// PUT /api/fantasy/my-team/:eventId - Создать или обновить свою фэнтези-команду
router.put('/my-team/:eventId', protect, async (req, res) => {
  try {
    const { players, replacementTokens } = req.body;
    const eventId = req.params.eventId;
    
    const event = await FantasyEvent.findById(eventId);
    if (!event || new Date() > new Date(event.rosterLockDate)) {
        return res.status(403).json({ message: 'Roster lock is active. Cannot update team.' });
    }
    
    // Получаем текущую команду из БД, чтобы безопасно обновить её
    let team = await FantasyTeam.findOne({ user: req.user._id, event: eventId });

    // Если команды нет, создаем новую пустую структуру
    if (!team) {
        team = new FantasyTeam({
            user: req.user._id,
            event: eventId,
            players: {
                core: { player: null, title: { adjective: '', noun: '' }, banner: [] },
                mid: { player: null, title: { adjective: '', noun: '' }, banner: [] },
                support: { player: null, title: { adjective: '', noun: '' }, banner: [] },
            }
        });
    }

    // Проверяем, что игроки есть в коллекции
    const user = await User.findById(req.user.id).select('cardCollection');
    const userCollectionIds = new Set(user.cardCollection.map(id => id.toString()));
    
    const roles = ['core', 'mid', 'support'];
    for (const role of roles) {
        const slotData = players[role];
        if (slotData && slotData.player) { // Если в запросе есть данные для этого слота
            if (!userCollectionIds.has(slotData.player)) {
                return res.status(403).json({ message: `Player with ID ${slotData.player} is not in your collection.` });
            }
            // Обновляем слот в нашей команде
            team.players[role] = slotData;
        } else if (slotData === null) { // Если фронтенд явно прислал null, значит слот очистили
            team.players[role] = { player: null, title: { adjective: '', noun: '' }, banner: [] };
        }
    }

    if (replacementTokens !== undefined) {
        team.replacementTokens = replacementTokens;
    }
    
    await team.save();

    // Отправляем обратно полностью населённую команду
    const populatedTeam = await FantasyTeam.findById(team._id)
      .populate('players.core.player')
      .populate('players.mid.player')
      .populate('players.support.player');
      
    res.status(200).json(populatedTeam);

  } catch (error) {
    console.error("ERROR SAVING FANTASY TEAM:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});


// --- ADMIN ROUTES ---

router.post('/events', protect, admin, async (req, res) => {
  try {
    const { title, rosterLockDate, endDate } = req.body;
    const newEvent = new FantasyEvent({ title, rosterLockDate, endDate });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({ message: 'Error creating event' });
  }
});

router.put('/events/:id', protect, admin, async (req, res) => {
    try {
        const updatedEvent = await FantasyEvent.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: 'Error updating event' });
    }
});

router.delete('/events/:id', protect, admin, async (req, res) => {
    try {
        await FantasyTeam.deleteMany({ event: req.params.id }); // Удаляем все команды, связанные с событием
        await FantasyEvent.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event and associated teams deleted' });
    } catch (error) {
        res.status(400).json({ message: 'Error deleting event' });
    }
});

router.post('/calculate-scores/:eventId', protect, admin, async (req, res) => {
    console.log(`Запущена симуляция подсчета очков для события ${req.params.eventId}`);
    res.json({ message: "Score calculation process started (simulation)." });
});

module.exports = router;