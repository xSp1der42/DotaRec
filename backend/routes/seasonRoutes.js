const express = require('express');
const router = express.Router();
const Season = require('../models/seasonModel');
const User = require('../models/userModel');
const { protect, admin } = require('../middleware/authMiddleware');

// Получить все сезоны
router.get('/', async (req, res) => {
    try {
        const seasons = await Season.find({}).sort({ seasonNumber: -1 });
        res.json(seasons);
    } catch (error) {
        console.error("Ошибка при получении сезонов:", error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить активный сезон
router.get('/active', async (req, res) => {
    try {
        const activeSeason = await Season.findOne({ isActive: true });
        if (!activeSeason) {
            return res.status(404).json({ message: 'Активный сезон не найден' });
        }
        res.json(activeSeason);
    } catch (error) {
        console.error("Ошибка при получении активного сезона:", error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить историю сезонов пользователя
router.get('/history', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate({
                path: 'seasonHistory.cardCollection',
                model: 'Player'
            })
            .populate({
                path: 'seasonHistory.storage',
                model: 'Player'
            })
            .lean();
        
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        res.json(user.seasonHistory || []);
    } catch (error) {
        console.error("Ошибка при получении истории сезонов:", error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создать новый сезон (только для админов)
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, startDate, endDate, description } = req.body;
        
        // Получаем последний сезон
        const lastSeason = await Season.findOne({}).sort({ seasonNumber: -1 });
        const newSeasonNumber = lastSeason ? lastSeason.seasonNumber + 1 : 1;
        
        const season = new Season({
            seasonNumber: newSeasonNumber,
            name,
            startDate,
            endDate,
            isActive: false,
            description: description || '',
        });
        
        await season.save();
        res.status(201).json(season);
    } catch (error) {
        console.error("Ошибка при создании сезона:", error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Активировать сезон (только для админов)
router.put('/:seasonId/activate', protect, admin, async (req, res) => {
    try {
        const { seasonId } = req.params;
        
        // Деактивируем все сезоны
        await Season.updateMany({}, { isActive: false });
        
        // Активируем выбранный сезон
        const season = await Season.findByIdAndUpdate(
            seasonId,
            { isActive: true },
            { new: true }
        );
        
        if (!season) {
            return res.status(404).json({ message: 'Сезон не найден' });
        }
        
        // Архивируем карточки всех пользователей из предыдущего сезона
        const users = await User.find({});
        
        for (const user of users) {
            // Если у пользователя есть карточки текущего сезона
            if (user.cardCollection.length > 0 || user.storage.length > 0) {
                // Добавляем в историю
                user.seasonHistory.push({
                    season: user.currentSeason,
                    cardCollection: user.cardCollection,
                    storage: user.storage,
                    coins: user.coins,
                    endDate: new Date(),
                });
                
                // Очищаем текущие карточки
                user.cardCollection = [];
                user.storage = [];
            }
            
            // Обновляем текущий сезон
            user.currentSeason = season.seasonNumber;
            
            await user.save({ validateBeforeSave: false });
        }
        
        res.json({ 
            message: 'Сезон активирован, карточки пользователей архивированы',
            season 
        });
    } catch (error) {
        console.error("Ошибка при активации сезона:", error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
