const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Player = require('../models/playerModel');
const Pack = require('../models/packModel');
const Season = require('../models/seasonModel');
const { protect } = require('../middleware/authMiddleware');

// Настройка Multer для аватаров
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    // ИСПРАВЛЕНИЕ: Используем req.user._id, это надежнее и исправит ошибку 500
    if (!req.user || !req.user._id) {
      return cb(new Error('User not authenticated for file upload'));
    }
    cb(null, `avatar-${req.user._id.toString()}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// Роут для получения своего профиля
router.get('/', protect, async (req, res) => {
    try {
        // Сначала загружаем пользователя
        const user = await User.findById(req.user.id).lean();
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Определяем сезон для фильтрации
        const seasonToShow = req.query.season || user.currentSeason || 1;
        
        // Теперь загружаем пользователя с populate
        const userWithCards = await User.findById(req.user.id)
            .populate({
                path: 'cardCollection',
                match: { season: seasonToShow }
            })
            .populate({
                path: 'storage',
                match: { season: seasonToShow }
            })
            .lean();
        
        res.json({
            id: userWithCards._id,
            email: userWithCards.email,
            nickname: userWithCards.nickname,
            avatarUrl: userWithCards.avatarUrl,
            isProfilePrivate: userWithCards.isProfilePrivate,
            role: userWithCards.role,
            coins: userWithCards.coins,
            collection: userWithCards.cardCollection || [],
            storage: userWithCards.storage || [],
            currentSeason: userWithCards.currentSeason || 1,
            seasonHistory: userWithCards.seasonHistory || [],
        });
    } catch (error) {
        console.error("Error fetching logged-in user profile data:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Роут для получения публичного профиля
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const viewingUser = await User.findById(userId).lean();

        if (!viewingUser) {
            return res.status(404).json({ message: 'Профиль не найден' });
        }
        
        let isOwner = false;
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.id === userId) {
                    isOwner = true;
                }
            } catch (e) {
                console.log("Invalid token used to view profile, ignoring.");
            }
        }
        
        if (viewingUser.isProfilePrivate && !isOwner) {
            return res.status(403).json({ 
                message: 'Этот профиль является приватным.',
                isPrivate: true,
                profile: {
                    nickname: viewingUser.nickname,
                    avatarUrl: viewingUser.avatarUrl
                } 
            });
        }
        
        const [user, allCards] = await Promise.all([
            User.findById(userId).populate('cardCollection').populate('storage').lean(),
            Player.find({}).sort({ ovr: -1, nickname: 1 }).lean()
        ]);

        if (!user) {
             return res.status(404).json({ message: 'Профиль не найден' });
        }

        res.json({
            id: user._id,
            email: user.email,
            nickname: user.nickname,
            avatarUrl: user.avatarUrl,
            coins: user.coins,
            collection: user.cardCollection || [],
            storage: user.storage || [],
            currentSeason: user.currentSeason || 1,
            allPossibleCards: allCards,
            isProfilePrivate: user.isProfilePrivate,
        });

    } catch (error) {
        console.error("ОШИБКА НА /api/profile/:userId :", error);
        if (error.kind === 'ObjectId') {
             return res.status(404).json({ message: 'Профиль не найден (неверный ID)' });
        }
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Роут для загрузки аватара
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не был загружен' });
        }
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        // Формируем полный URL для аватарки
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        user.avatarUrl = `${baseUrl}/uploads/${req.file.filename}`;
        
        // Используем validateBeforeSave: false, чтобы избежать валидации всех полей
        await user.save({ validateBeforeSave: false });
        res.json({ avatarUrl: user.avatarUrl });
    } catch (error) {
        console.error("ОШИБКА ЗАГРУЗКИ АВАТАРА:", error);
        res.status(500).json({ message: 'Ошибка сервера при загрузке аватара' });
    }
});

// Роут для обновления настроек профиля
router.put('/settings', protect, async (req, res) => {
    try {
        const { nickname, email, isProfilePrivate, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (nickname) {
            const existingUser = await User.findOne({ nickname: nickname });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Этот никнейм уже занят' });
            }
            user.nickname = nickname;
        }
        if (email) {
             const existingUser = await User.findOne({ email: email });
             if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Этот email уже занят' });
            }
            user.email = email;
        }
        if (typeof isProfilePrivate === 'boolean') {
            user.isProfilePrivate = isProfilePrivate;
        }

        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Текущий пароль неверен' });
            }
            user.password = newPassword;
        }
        
        await user.save();
        
        res.json({
            id: user._id,
            email: user.email,
            nickname: user.nickname,
            avatarUrl: user.avatarUrl,
            isProfilePrivate: user.isProfilePrivate,
            role: user.role,
            coins: user.coins,
        });

    } catch (error) {
        console.error("ОШИБКА ОБНОВЛЕНИЯ НАСТРОЕК:", error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Роут открытия паков - теперь возвращает карточки, но не добавляет их автоматически
router.post('/open-pack', protect, async (req, res) => {
    try {
        const { packId } = req.body;
        if (!packId) {
            return res.status(400).json({ message: "Не указан ID пака" });
        }
        const [user, pack] = await Promise.all([ 
            User.findById(req.user._id).select('+password'), // Загружаем пользователя заново со всеми полями
            Pack.findById(packId) 
        ]);
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
        if (!pack) return res.status(404).json({ message: 'Пак не найден' });
        if (user.coins < pack.price) return res.status(400).json({ message: 'Недостаточно коинов' });
        if (!pack.player_pool || pack.player_pool.length === 0) {
            return res.status(400).json({ message: 'Ошибка: в паке отсутствуют карточки.' });
        }
        
        // Получаем текущий сезон
        const currentSeason = await Season.findOne({ isActive: true });
        const seasonNumber = currentSeason ? currentSeason.seasonNumber : (user.currentSeason || 1);
        
        // Фильтруем карточки только из текущего сезона
        const playerPool = await Player.find({ 
            '_id': { $in: pack.player_pool },
            'season': seasonNumber
        });
        if (playerPool.length < pack.cards_in_pack) {
            return res.status(400).json({ message: `Ошибка: в пуле пака (${playerPool.length}) меньше карт, чем должно выпасть (${pack.cards_in_pack}).` });
        }
        const chosenCards = [];
        const poolCopy = [...playerPool];
        for (let i = 0; i < pack.cards_in_pack; i++) {
            const randomIndex = Math.floor(Math.random() * poolCopy.length);
            chosenCards.push(poolCopy[randomIndex]);
            poolCopy.splice(randomIndex, 1);
        }
        
        // Списываем коины, но карточки не добавляем - пользователь выберет куда их поместить
        user.coins -= pack.price;
        
        // Используем validateBeforeSave: false, чтобы избежать валидации всех полей
        await user.save({ validateBeforeSave: false });
        
        res.json({ 
            revealedCards: chosenCards, 
            newBalance: user.coins,
            season: seasonNumber
        });
    } catch (error) {
        console.error("КРИТИЧЕСКАЯ ОШИБКА ПРИ ОТКРЫТИИ ПАКА:", error);
        res.status(500).json({ message: "Неизвестная ошибка сервера при открытии пака." });
    }
});

// Роут для обработки выбора карточек после открытия пака
router.post('/process-cards', protect, async (req, res) => {
    try {
        const { cards, action } = req.body; // action: 'collection', 'storage', 'sell'
        if (!cards || !Array.isArray(cards) || cards.length === 0) {
            return res.status(400).json({ message: "Не указаны карточки" });
        }
        if (!action || !['collection', 'storage', 'sell'].includes(action)) {
            return res.status(400).json({ message: "Неверное действие" });
        }
        
        const user = await User.findById(req.user.id).select('+password');
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
        
        // Получаем текущий сезон
        const currentSeason = await Season.findOne({ isActive: true });
        const seasonNumber = currentSeason ? currentSeason.seasonNumber : (user.currentSeason || 1);
        
        const cardIds = cards.map(c => c._id || c);
        let coinsEarned = 0;
        
        for (const cardId of cardIds) {
            if (action === 'collection') {
                // Добавляем в коллекцию только если такой карточки еще нет
                if (!user.cardCollection.includes(cardId)) {
                    user.cardCollection.push(cardId);
                }
            } else if (action === 'storage') {
                // Добавляем в хранилище (максимум 100 карт)
                if (user.storage.length < 100) {
                    user.storage.push(cardId);
                } else {
                    return res.status(400).json({ message: 'Хранилище переполнено (максимум 100 карт)' });
                }
            } else if (action === 'sell') {
                // Продаем карточку (получаем 50% от базовой стоимости)
                const card = await Player.findById(cardId);
                if (card) {
                    const sellPrice = Math.floor(card.ovr * 10); // Базовая цена: OVR * 10
                    coinsEarned += sellPrice;
                }
            }
        }
        
        user.coins += coinsEarned;
        await user.save({ validateBeforeSave: false });
        
        res.json({ 
            message: 'Карточки обработаны',
            coinsEarned,
            newBalance: user.coins
        });
    } catch (error) {
        console.error("ОШИБКА ПРИ ОБРАБОТКЕ КАРТОЧЕК:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// Роут добавления монет
router.put('/coins', protect, async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.user.id);
        if (user) {
            user.coins = (user.coins || 0) + Number(amount);
            const updatedUser = await user.save();
            res.json({ id: updatedUser._id, coins: updatedUser.coins });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Error adding coins:", error);
        res.status(500).json({ message: "Ошибка сервера при добавлении коинов" });
    }
});

module.exports = router;