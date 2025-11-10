const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // НОВОЕ: Уникальный никнейм для входа и отображения
  nickname: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  // НОВОЕ: Путь к файлу аватара
  avatarUrl: {
    type: String,
    default: '/uploads/default-avatar.png' // Убедитесь, что этот файл существует в /uploads
  },
  // НОВОЕ: Флаг для скрытия профиля
  isProfilePrivate: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  coins: {
    type: Number,
    default: 1000,
  },
  // Коллекция - только 1 карточка каждого типа (не стакаются)
  cardCollection: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
  }],
  // Хранилище - максимум 100 карт, могут быть дубликаты, но не стакаются
  storage: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
  }],
  // Текущий сезон
  currentSeason: {
    type: Number,
    default: 1,
  },
  // История сезонов (архив карточек из прошлых сезонов)
  seasonHistory: [{
    season: {
      type: Number,
      required: true,
    },
    cardCollection: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    }],
    storage: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    }],
    coins: {
      type: Number,
      default: 0,
    },
    endDate: {
      type: Date,
      required: true,
    },
  }],
}, { timestamps: true });

// Хеширование пароля перед сохранением
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);