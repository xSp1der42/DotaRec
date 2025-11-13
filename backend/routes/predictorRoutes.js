const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, admin } = require('../middleware/authMiddleware');
const PredictorMatch = require('../models/predictorMatchModel');
const PredictorBet = require('../models/predictorBetModel');
const Notification = require('../models/notificationModel');
const PredictionService = require('../services/predictionService');
const teamService = require('../services/teamService');

// Создаем директорию для логотипов команд, если её нет
const teamLogosDir = 'uploads/team-logos';
if (!fs.existsSync(teamLogosDir)) {
  fs.mkdirSync(teamLogosDir, { recursive: true });
}

// Настройка Multer для загрузки логотипов команд
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, teamLogosDir);
  },
  filename(req, file, cb) {
    const matchId = req.params.id;
    const team = req.body.team || 'team'; // 'team1' или 'team2'
    cb(null, `logo-${matchId}-${team}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
  const allowedTypes = /png|jpg|jpeg|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_FORMAT'));
  }
};

// Настройка Multer с ограничением размера 2 МБ
const uploadLogo = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 МБ
  fileFilter: fileFilter,
});

// GET /api/predictor/matches - Получить список доступных матчей с фильтрацией по статусу
router.get('/matches', async (req, res) => {
  try {
    const { status, game } = req.query;
    
    const filter = {};
    
    // Фильтрация по статусу
    if (status) {
      filter.status = status;
    }
    
    // Фильтрация по игре
    if (game) {
      filter.game = game;
    }
    
    const matches = await PredictorMatch.find(filter)
      .sort({ startTime: 1 })
      .limit(50);
    
    // Populate team logos from Team collection
    const matchesWithLogos = await teamService.populateMatchesLogos(matches);
    
    res.json(matchesWithLogos);
  } catch (error) {
    console.error('Error fetching predictor matches:', error);
    res.status(500).json({ 
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server Error'
      }
    });
  }
});

// GET /api/predictor/matches/:id - Получить детали конкретного матча
router.get('/matches/:id', async (req, res) => {
  try {
    const match = await PredictorMatch.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ 
        success: false,
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Match not found'
        }
      });
    }
    
    // Populate team logos from Team collection
    const matchWithLogos = await teamService.populateMatchLogos(match);
    
    res.json(matchWithLogos);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ 
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server Error'
      }
    });
  }
});

// POST /api/predictor/matches - Создать новый матч (только admin)
router.post('/matches', protect, admin, async (req, res) => {
  try {
    const { 
      game, 
      team1, 
      team2, 
      startTime, 
      predictionTypes 
    } = req.body;
    
    // Валидация обязательных полей
    if (!game || !team1?.name || !team2?.name || !startTime) {
      return res.status(400).json({ 
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'Game, team names, and start time are required'
        }
      });
    }
    
    // Валидация игры
    if (!['dota2', 'cs2'].includes(game)) {
      return res.status(400).json({ 
        success: false,
        error: {
          code: 'INVALID_GAME',
          message: 'Game must be either dota2 or cs2'
        }
      });
    }
    
    const match = new PredictorMatch({
      game,
      team1: {
        name: team1.name,
        logoUrl: team1.logoUrl || '',
      },
      team2: {
        name: team2.name,
        logoUrl: team2.logoUrl || '',
      },
      startTime: new Date(startTime),
      status: 'upcoming',
      predictionTypes: predictionTypes || [],
    });
    
    await match.save();
    
    res.status(201).json(match);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ 
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server Error'
      }
    });
  }
});

// PUT /api/predictor/matches/:id - Обновить данные матча (только admin)
router.put('/matches/:id', protect, admin, async (req, res) => {
  try {
    const match = await PredictorMatch.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ 
        success: false,
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Match not found'
        }
      });
    }
    
    const { 
      game, 
      team1, 
      team2, 
      startTime, 
      status,
      predictionTypes 
    } = req.body;
    
    // Обновляем только переданные поля
    if (game) {
      if (!['dota2', 'cs2'].includes(game)) {
        return res.status(400).json({ 
          success: false,
          error: {
            code: 'INVALID_GAME',
            message: 'Game must be either dota2 or cs2'
          }
        });
      }
      match.game = game;
    }
    
    if (team1) {
      if (team1.name) match.team1.name = team1.name;
      if (team1.logoUrl !== undefined) match.team1.logoUrl = team1.logoUrl;
    }
    
    if (team2) {
      if (team2.name) match.team2.name = team2.name;
      if (team2.logoUrl !== undefined) match.team2.logoUrl = team2.logoUrl;
    }
    
    if (startTime) {
      match.startTime = new Date(startTime);
    }
    
    if (status) {
      const validStatuses = ['upcoming', 'live', 'draft_phase', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Invalid status value'
          }
        });
      }
      match.status = status;
    }
    
    if (predictionTypes) {
      match.predictionTypes = predictionTypes;
    }
    
    await match.save();
    
    res.json(match);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ 
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server Error'
      }
    });
  }
});

// DELETE /api/predictor/matches/:id - Удалить матч (только admin)
router.delete('/matches/:id', protect, admin, async (req, res) => {
  try {
    const match = await PredictorMatch.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ 
        success: false,
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Match not found'
        }
      });
    }
    
    // Проверяем, есть ли активные ставки на этот матч
    // (это будет реализовано позже, когда будет модель ставок)
    
    await PredictorMatch.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true,
      message: 'Match deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ 
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server Error'
      }
    });
  }
});

// POST /api/predictor/matches/:id/results - Установить результаты драфта (только admin)
router.post('/matches/:id/results', protect, admin, async (req, res) => {
  try {
    const match = await PredictorMatch.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ 
        success: false,
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Match not found'
        }
      });
    }
    
    // Проверяем, что матч в правильном статусе
    if (match.status !== 'draft_phase' && match.status !== 'live') {
      return res.status(400).json({ 
        success: false,
        error: {
          code: 'INVALID_MATCH_STATUS',
          message: 'Match must be in draft_phase or live status to set results'
        }
      });
    }
    
    const { results } = req.body;
    
    if (!results) {
      return res.status(400).json({ 
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'Results data is required'
        }
      });
    }
    
    // Обновляем результаты драфта
    match.draftPhase.completed = true;
    match.draftPhase.results = {
      firstBan: results.firstBan || match.draftPhase.results?.firstBan || {},
      firstPick: results.firstPick || match.draftPhase.results?.firstPick || {},
      mostBanned: results.mostBanned || match.draftPhase.results?.mostBanned || '',
      picks: results.picks || match.draftPhase.results?.picks || { team1: [], team2: [] },
    };
    
    match.status = 'completed';
    
    await match.save();
    
    // Обрабатываем результаты и распределяем награды
    try {
      await PredictionService.processResults(match._id, match.draftPhase.results);
    } catch (serviceError) {
      console.error('Error processing results in PredictionService:', serviceError);
      // Продолжаем выполнение, даже если сервис не смог обработать результаты
    }
    
    res.json({
      success: true,
      message: 'Results set successfully',
      match
    });
  } catch (error) {
    console.error('Error setting match results:', error);
    res.status(500).json({ 
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server Error'
      }
    });
  }
});

// POST /api/predictor/matches/:id/logo - Загрузить логотип команды (только admin)
router.post('/matches/:id/logo', protect, admin, (req, res) => {
  uploadLogo.single('logo')(req, res, async (err) => {
    try {
      // Обработка ошибок Multer
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'File size exceeds 2 MB limit',
            },
          });
        }
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: err.message,
          },
        });
      } else if (err) {
        if (err.message === 'INVALID_FILE_FORMAT') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_FILE_FORMAT',
              message: 'Only PNG, JPG, JPEG, and SVG files are allowed',
            },
          });
        }
        return res.status(500).json({
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Error uploading file',
          },
        });
      }

      // Проверяем, что файл был загружен
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file was uploaded',
          },
        });
      }

      // Проверяем, что указана команда
      const { team } = req.body;
      if (!team || !['team1', 'team2'].includes(team)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TEAM',
            message: 'Team must be either team1 or team2',
          },
        });
      }

      // Находим матч
      const match = await PredictorMatch.findById(req.params.id);
      if (!match) {
        // Удаляем загруженный файл, если матч не найден
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          error: {
            code: 'MATCH_NOT_FOUND',
            message: 'Match not found',
          },
        });
      }

      // Формируем URL для логотипа
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const logoUrl = `${baseUrl}/uploads/team-logos/${req.file.filename}`;

      // Удаляем старый логотип, если он существует
      if (match[team].logoUrl) {
        const oldLogoPath = match[team].logoUrl.replace(baseUrl, '').replace(/^\//, '');
        const fullOldPath = path.join(oldLogoPath);
        if (fs.existsSync(fullOldPath)) {
          try {
            fs.unlinkSync(fullOldPath);
          } catch (unlinkErr) {
            console.error('Error deleting old logo:', unlinkErr);
          }
        }
      }

      // Обновляем URL логотипа в матче
      match[team].logoUrl = logoUrl;
      await match.save();

      res.json({
        success: true,
        message: 'Logo uploaded successfully',
        logoUrl: logoUrl,
        team: team,
      });
    } catch (error) {
      console.error('Error uploading team logo:', error);
      // Удаляем загруженный файл в случае ошибки
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Server Error',
        },
      });
    }
  });
});

// POST /api/predictor/bets - Создать ставку
router.post('/bets', protect, async (req, res) => {
  try {
    const { matchId, predictions } = req.body;

    // Валидация входных данных
    if (!matchId || !predictions || !Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'Match ID and predictions are required',
        },
      });
    }

    // Валидация каждого предсказания
    for (const pred of predictions) {
      if (!pred.type || !pred.choice || pred.betAmount === undefined) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PREDICTION_DATA',
            message: 'Each prediction must have type, choice, and betAmount',
          },
        });
      }

      // Проверка диапазона ставки (10-10000 монет)
      if (pred.betAmount < 10 || pred.betAmount > 10000) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_BET_AMOUNT',
            message: 'Bet amount must be between 10 and 10000 coins',
            details: {
              min: 10,
              max: 10000,
              provided: pred.betAmount,
            },
          },
        });
      }
    }

    // Размещение ставки через PredictionService
    const bet = await PredictionService.placeBet(req.user._id, { matchId, predictions });

    res.status(201).json({
      success: true,
      message: 'Bet placed successfully',
      bet,
    });
  } catch (error) {
    console.error('Error placing bet:', error);

    // Обработка специфичных ошибок
    const errorMessage = error.message || 'Server Error';

    if (errorMessage.includes('Недостаточно средств')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: errorMessage,
        },
      });
    }

    if (errorMessage.includes('Прием ставок закрыт')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BETTING_CLOSED',
          message: errorMessage,
        },
      });
    }

    if (errorMessage.includes('уже сделали ставку')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_BET',
          message: errorMessage,
        },
      });
    }

    if (errorMessage.includes('не найден')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: errorMessage,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error placing bet',
      },
    });
  }
});

// GET /api/predictor/bets - Получить все ставки текущего пользователя
router.get('/bets', protect, async (req, res) => {
  try {
    const { status, game, limit = 20, page = 1 } = req.query;

    const filter = { userId: req.user._id };

    // Фильтрация по статусу предсказаний
    if (status && ['pending', 'won', 'lost'].includes(status)) {
      filter['predictions.status'] = status;
    }

    // Получение ставок с пагинацией
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let bets = await PredictorBet.find(filter)
      .populate('matchId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Фильтрация по игре (после populate)
    if (game && ['dota2', 'cs2'].includes(game)) {
      bets = bets.filter(bet => bet.matchId && bet.matchId.game === game);
    }

    // Подсчет общего количества ставок
    const total = await PredictorBet.countDocuments(filter);

    res.json({
      success: true,
      bets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching user bets:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching bets',
      },
    });
  }
});

// GET /api/predictor/bets/:id - Получить детали конкретной ставки
router.get('/bets/:id', protect, async (req, res) => {
  try {
    const bet = await PredictorBet.findById(req.params.id).populate('matchId');

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BET_NOT_FOUND',
          message: 'Bet not found',
        },
      });
    }

    // Проверка, что ставка принадлежит текущему пользователю
    if (bet.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this bet',
        },
      });
    }

    res.json({
      success: true,
      bet,
    });
  } catch (error) {
    console.error('Error fetching bet details:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching bet details',
      },
    });
  }
});

// GET /api/predictor/stats/:matchId - Получить статистику ставок по матчу
router.get('/stats/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    // Проверяем существование матча
    const match = await PredictorMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Match not found',
        },
      });
    }

    // Получаем все ставки для этого матча
    const bets = await PredictorBet.find({ matchId });

    // Инициализируем статистику для каждого типа предсказания
    const stats = {};
    
    match.predictionTypes.forEach(predType => {
      stats[predType.type] = {
        type: predType.type,
        totalBets: 0,
        totalAmount: 0,
        participants: new Set(),
        options: {},
      };

      // Инициализируем каждый вариант
      predType.options.forEach(option => {
        stats[predType.type].options[option] = {
          choice: option,
          betsCount: 0,
          totalAmount: 0,
          percentage: 0,
        };
      });
    });

    // Подсчитываем статистику по ставкам
    bets.forEach(bet => {
      bet.predictions.forEach(pred => {
        if (stats[pred.type]) {
          stats[pred.type].totalBets += 1;
          stats[pred.type].totalAmount += pred.betAmount;
          stats[pred.type].participants.add(bet.userId.toString());

          if (stats[pred.type].options[pred.choice]) {
            stats[pred.type].options[pred.choice].betsCount += 1;
            stats[pred.type].options[pred.choice].totalAmount += pred.betAmount;
          }
        }
      });
    });

    // Рассчитываем процентное распределение
    Object.keys(stats).forEach(predType => {
      const totalAmount = stats[predType].totalAmount;
      
      Object.keys(stats[predType].options).forEach(option => {
        if (totalAmount > 0) {
          const optionAmount = stats[predType].options[option].totalAmount;
          stats[predType].options[option].percentage = 
            Math.round((optionAmount / totalAmount) * 100 * 100) / 100; // Округляем до 2 знаков
        }
      });

      // Конвертируем Set в число
      stats[predType].participants = stats[predType].participants.size;
      
      // Конвертируем объект options в массив
      stats[predType].options = Object.values(stats[predType].options);
    });

    // Конвертируем объект stats в массив
    const statsArray = Object.values(stats);

    res.json({
      success: true,
      matchId,
      stats: statsArray,
    });
  } catch (error) {
    console.error('Error fetching match stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching match statistics',
      },
    });
  }
});

// GET /api/predictor/history - Получить историю предсказаний пользователя
router.get('/history', protect, async (req, res) => {
  try {
    const { game, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Строим фильтр для ставок
    const betFilter = { userId: req.user._id };

    // Фильтрация по статусу предсказаний
    if (status && ['pending', 'won', 'lost'].includes(status)) {
      betFilter['predictions.status'] = status;
    }

    // Фильтрация по дате
    if (startDate || endDate) {
      betFilter.createdAt = {};
      if (startDate) {
        betFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        betFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Получаем ставки с пагинацией
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let bets = await PredictorBet.find(betFilter)
      .populate('matchId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Фильтрация по игре (после populate)
    if (game && ['dota2', 'cs2'].includes(game)) {
      bets = bets.filter(bet => bet.matchId && bet.matchId.game === game);
    }

    // Подсчет общего количества ставок для пагинации
    let totalBets = await PredictorBet.countDocuments(betFilter);

    // Если есть фильтр по игре, нужно пересчитать total после фильтрации
    if (game && ['dota2', 'cs2'].includes(game)) {
      // Получаем все ID матчей для данной игры
      const matchIds = await PredictorMatch.find({ game }).distinct('_id');
      const gameFilter = { ...betFilter, matchId: { $in: matchIds } };
      totalBets = await PredictorBet.countDocuments(gameFilter);
    }

    // Рассчитываем общую статистику пользователя
    const allUserBets = await PredictorBet.find({ userId: req.user._id }).populate('matchId');

    let totalWins = 0;
    let totalLosses = 0;
    let totalPending = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;
    let totalBetAmount = 0;

    allUserBets.forEach(bet => {
      totalBetAmount += bet.totalBet;

      bet.predictions.forEach(pred => {
        if (pred.status === 'won') {
          totalWins += 1;
          totalWinAmount += pred.reward;
        } else if (pred.status === 'lost') {
          totalLosses += 1;
          totalLossAmount += pred.betAmount;
        } else if (pred.status === 'pending') {
          totalPending += 1;
        }
      });
    });

    const totalPredictions = totalWins + totalLosses + totalPending;
    const successRate = totalPredictions > 0 
      ? Math.round((totalWins / (totalWins + totalLosses)) * 100 * 100) / 100 
      : 0;

    const netProfit = totalWinAmount - totalBetAmount;

    const userStats = {
      totalPredictions,
      totalWins,
      totalLosses,
      totalPending,
      successRate,
      totalBetAmount,
      totalWinAmount,
      totalLossAmount,
      netProfit,
    };

    res.json({
      success: true,
      bets,
      stats: userStats,
      pagination: {
        total: totalBets,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalBets / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching prediction history',
      },
    });
  }
});

// GET /api/predictor/notifications - Получить уведомления пользователя
router.get('/notifications', protect, async (req, res) => {
  try {
    const { unread, page = 1, limit = 50 } = req.query;

    // Строим фильтр для уведомлений
    const filter = { userId: req.user._id };

    // Фильтрация непрочитанных уведомлений
    if (unread === 'true') {
      filter.read = false;
    }

    // Получаем уведомления с пагинацией
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const notifications = await Notification.find(filter)
      .populate('data.matchId', 'team1 team2 game startTime')
      .populate('data.betId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Подсчет общего количества уведомлений
    const total = await Notification.countDocuments(filter);

    // Подсчет непрочитанных уведомлений
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user._id, 
      read: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching notifications',
      },
    });
  }
});

// PUT /api/predictor/notifications/:id - Отметить уведомление как прочитанное
router.put('/notifications/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
        },
      });
    }

    // Проверка, что уведомление принадлежит текущему пользователю
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this notification',
        },
      });
    }

    // Отмечаем уведомление как прочитанное
    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error updating notification',
      },
    });
  }
});

module.exports = router;
