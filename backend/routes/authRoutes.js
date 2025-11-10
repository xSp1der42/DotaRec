const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Вспомогательная функция для генерации токена
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  // ИЗМЕНЕНИЕ: Добавили nickname
  const { email, password, nickname } = req.body;
  try {
    // ИЗМЕНЕНИЕ: Проверяем уникальность и email, и nickname
    const userExistsByEmail = await User.findOne({ email });
    if (userExistsByEmail) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }
    
    const userExistsByNickname = await User.findOne({ nickname });
    if (userExistsByNickname) {
      return res.status(400).json({ message: 'Этот никнейм уже занят' });
    }

    const user = new User({ email, password, nickname });
    await user.save();

    res.status(201).json({ message: 'Регистрация прошла успешно' });
  } catch (error) {
    console.error('ОШИБКА РЕГИСТРАЦИИ:', error.message);
    res.status(500).send('Ошибка сервера');
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        // ИЗМЕНЕНИЕ: Возвращаем новые поля
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
        coins: user.coins,
      },
    });
  } catch (error) {
    console.error('ОШИБКА ВХОДА:', error.message);
    res.status(500).send('Ошибка сервера');
  }
});

module.exports = router;