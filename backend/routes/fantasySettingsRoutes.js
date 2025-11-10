// backend/routes/fantasySettingsRoutes.js

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const FantasySettings = require('../models/fantasySettingsModel');

// GET - Получить текущие настройки (доступно всем)
router.get('/', async (req, res) => {
    try {
        // Находим один единственный документ с настройками или создаем его с дефолтными значениями
        let settings = await FantasySettings.findOne();
        if (!settings) {
            settings = await new FantasySettings().save();
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT - Обновить настройки (только для админа)
router.put('/', protect, admin, async (req, res) => {
    try {
        // `findOneAndUpdate` с `upsert: true` идеально подходит для синглтона:
        // обновит, если найдет, или создаст, если нет.
        const updatedSettings = await FantasySettings.findOneAndUpdate(
            {}, // пустой фильтр, чтобы найти любой (единственный) документ
            req.body, // данные для обновления придут из админки
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.json(updatedSettings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;