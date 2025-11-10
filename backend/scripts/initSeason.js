// Скрипт для инициализации первого сезона
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Season = require('../models/seasonModel');
const Player = require('../models/playerModel');

dotenv.config();

const initSeason = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // Проверяем, есть ли уже сезоны
        const existingSeasons = await Season.find({});
        if (existingSeasons.length > 0) {
            console.log('⚠️ Сезоны уже существуют. Пропускаем инициализацию.');
            process.exit(0);
        }

        // Создаем первый сезон
        const season1 = new Season({
            seasonNumber: 1,
            name: 'Первый сезон',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            isActive: true,
            description: 'Первый сезон CyberCard',
        });

        await season1.save();
        console.log('✅ Создан первый сезон');

        // Обновляем все существующие карточки, устанавливая им season: 1
        const result = await Player.updateMany(
            { season: { $exists: false } },
            { $set: { season: 1 } }
        );
        console.log(`✅ Обновлено ${result.modifiedCount} карточек (установлен season: 1)`);

        console.log('✅ Инициализация завершена');
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка при инициализации:', error);
        process.exit(1);
    }
};

initSeason();
