const PredictorMatch = require('../models/predictorMatchModel');
const PredictorBet = require('../models/predictorBetModel');
const User = require('../models/userModel');

class PredictionService {
  /**
   * Расчет коэффициентов для конкретного варианта предсказания
   * odds = (totalRewardPool / optionRewardPool) * 0.95
   * Минимальный коэффициент: 1.1, Максимальный: 10.0
   * 
   * @param {String} matchId - ID матча
   * @param {String} predictionType - Тип предсказания
   * @param {String} choice - Выбранный вариант
   * @returns {Number} - Рассчитанный коэффициент
   */
  async calculateOdds(matchId, predictionType, choice) {
    try {
      const match = await PredictorMatch.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      const prediction = match.predictionTypes.find(p => p.type === predictionType);
      if (!prediction) {
        throw new Error('Prediction type not found');
      }

      // Если еще нет ставок, возвращаем базовый коэффициент
      if (prediction.rewardPool === 0 || prediction.betsCount === 0) {
        return 2.0;
      }

      // Получаем все ставки на этот вариант
      const bets = await PredictorBet.find({
        matchId,
        'predictions.type': predictionType,
        'predictions.choice': choice
      });

      // Считаем сумму ставок на этот вариант
      let optionRewardPool = 0;
      bets.forEach(bet => {
        const pred = bet.predictions.find(p => p.type === predictionType && p.choice === choice);
        if (pred) {
          optionRewardPool += pred.betAmount;
        }
      });

      // Если на этот вариант еще нет ставок, возвращаем высокий коэффициент
      if (optionRewardPool === 0) {
        return 10.0;
      }

      // Расчет коэффициента с комиссией 5%
      let odds = (prediction.rewardPool / optionRewardPool) * 0.95;

      // Ограничиваем коэффициент в диапазоне 1.1 - 10.0
      odds = Math.max(1.1, Math.min(10.0, odds));

      return parseFloat(odds.toFixed(2));
    } catch (error) {
      console.error('Error calculating odds:', error);
      throw error;
    }
  }

  /**
   * Валидация ставки перед размещением
   * 
   * @param {String} userId - ID пользователя
   * @param {Object} betData - Данные ставки
   * @returns {Object} - Результат валидации
   */
  async validateBet(userId, betData) {
    try {
      const { matchId, predictions } = betData;

      // Проверка существования матча
      const match = await PredictorMatch.findById(matchId);
      if (!match) {
        return { valid: false, error: 'MATCH_NOT_FOUND', message: 'Матч не найден' };
      }

      // Проверка статуса матча
      if (match.status !== 'upcoming') {
        return { valid: false, error: 'BETTING_CLOSED', message: 'Прием ставок закрыт' };
      }

      // Проверка времени до начала матча (должно быть больше 5 минут)
      const timeUntilStart = match.startTime - new Date();
      if (timeUntilStart < 5 * 60 * 1000) {
        return { valid: false, error: 'BETTING_CLOSED', message: 'Прием ставок закрыт за 5 минут до начала матча' };
      }

      // Проверка наличия предсказаний
      if (!predictions || predictions.length === 0) {
        return { valid: false, error: 'NO_PREDICTIONS', message: 'Не указаны предсказания' };
      }

      // Проверка каждого предсказания
      let totalBet = 0;
      for (const pred of predictions) {
        // Проверка размера ставки
        if (pred.betAmount < 10 || pred.betAmount > 10000) {
          return { 
            valid: false, 
            error: 'INVALID_BET_AMOUNT', 
            message: 'Размер ставки должен быть от 10 до 10000 монет' 
          };
        }

        // Проверка существования типа предсказания
        const predictionType = match.predictionTypes.find(p => p.type === pred.type);
        if (!predictionType) {
          return { 
            valid: false, 
            error: 'INVALID_PREDICTION_TYPE', 
            message: `Тип предсказания ${pred.type} не найден` 
          };
        }

        // Проверка закрытия приема ставок для этого типа
        if (predictionType.closed) {
          return { 
            valid: false, 
            error: 'BETTING_CLOSED', 
            message: `Прием ставок на ${pred.type} закрыт` 
          };
        }

        // Проверка доступности выбранного варианта
        if (!predictionType.options.includes(pred.choice)) {
          return { 
            valid: false, 
            error: 'INVALID_CHOICE', 
            message: `Вариант ${pred.choice} недоступен для ${pred.type}` 
          };
        }

        totalBet += pred.betAmount;
      }

      // Проверка баланса пользователя
      const user = await User.findById(userId);
      if (!user) {
        return { valid: false, error: 'USER_NOT_FOUND', message: 'Пользователь не найден' };
      }

      if (user.coins < totalBet) {
        return { 
          valid: false, 
          error: 'INSUFFICIENT_FUNDS', 
          message: `Недостаточно средств. Баланс: ${user.coins}, требуется: ${totalBet}` 
        };
      }

      // Проверка на дубликат ставки
      const existingBet = await PredictorBet.findOne({ userId, matchId });
      if (existingBet) {
        return { 
          valid: false, 
          error: 'DUPLICATE_BET', 
          message: 'Вы уже сделали ставку на этот матч' 
        };
      }

      return { valid: true, totalBet };
    } catch (error) {
      console.error('Error validating bet:', error);
      throw error;
    }
  }

  /**
   * Размещение ставки с проверкой баланса и списанием монет
   * 
   * @param {String} userId - ID пользователя
   * @param {Object} betData - Данные ставки
   * @returns {Object} - Созданная ставка
   */
  async placeBet(userId, betData) {
    try {
      const { matchId, predictions } = betData;

      // Валидация ставки
      const validation = await this.validateBet(userId, betData);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      const match = await PredictorMatch.findById(matchId);
      const user = await User.findById(userId);

      // Расчет коэффициентов для каждого предсказания
      const predictionsWithOdds = [];
      for (const pred of predictions) {
        const odds = await this.calculateOdds(matchId, pred.type, pred.choice);
        predictionsWithOdds.push({
          type: pred.type,
          choice: pred.choice,
          betAmount: pred.betAmount,
          odds,
          status: 'pending',
          reward: 0
        });
      }

      // Создание ставки
      const bet = new PredictorBet({
        userId,
        matchId,
        predictions: predictionsWithOdds,
        totalBet: validation.totalBet,
        totalReward: 0
      });

      await bet.save();

      // Списание монет с баланса пользователя
      user.coins -= validation.totalBet;
      await user.save();

      // Обновление пула наград и счетчика ставок для каждого типа предсказания
      for (const pred of predictionsWithOdds) {
        const predictionType = match.predictionTypes.find(p => p.type === pred.type);
        if (predictionType) {
          predictionType.rewardPool += pred.betAmount;
          predictionType.betsCount += 1;
        }
      }

      await match.save();

      return bet;
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  /**
   * Обработка результатов драфта и определение победителей
   * 
   * @param {String} matchId - ID матча
   * @param {Object} results - Результаты драфта
   * @returns {Object} - Результат обработки
   */
  async processResults(matchId, results) {
    try {
      const match = await PredictorMatch.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Обновление результатов драфта
      match.draftPhase.completed = true;
      match.draftPhase.results = results;
      match.status = 'completed';

      await match.save();

      // Получение всех ставок на этот матч
      const bets = await PredictorBet.find({ matchId });

      let processedBets = 0;
      let winningBets = 0;

      // Обработка каждой ставки
      for (const bet of bets) {
        let betHasWinnings = false;

        for (const prediction of bet.predictions) {
          const isWinner = this._checkPredictionResult(prediction, results);

          if (isWinner) {
            prediction.status = 'won';
            betHasWinnings = true;
            winningBets++;
          } else {
            prediction.status = 'lost';
          }
        }

        await bet.save();
        processedBets++;
      }

      return {
        success: true,
        processedBets,
        winningBets,
        message: `Обработано ${processedBets} ставок, выигрышных: ${winningBets}`
      };
    } catch (error) {
      console.error('Error processing results:', error);
      throw error;
    }
  }

  /**
   * Проверка результата конкретного предсказания
   * 
   * @param {Object} prediction - Предсказание
   * @param {Object} results - Результаты драфта
   * @returns {Boolean} - Выиграло ли предсказание
   */
  _checkPredictionResult(prediction, results) {
    const { type, choice } = prediction;

    switch (type) {
      case 'first_ban_team1':
        return results.firstBan?.team1 === choice;
      case 'first_ban_team2':
        return results.firstBan?.team2 === choice;
      case 'first_pick_team1':
        return results.firstPick?.team1 === choice;
      case 'first_pick_team2':
        return results.firstPick?.team2 === choice;
      case 'most_banned':
        return results.mostBanned === choice;
      default:
        // Для других типов предсказаний (например, конкретные пики по позициям)
        if (type.startsWith('pick_team1_')) {
          return results.picks?.team1?.includes(choice);
        }
        if (type.startsWith('pick_team2_')) {
          return results.picks?.team2?.includes(choice);
        }
        return false;
    }
  }

  /**
   * Распределение наград пропорционально ставкам
   * 
   * @param {String} matchId - ID матча
   * @returns {Object} - Результат распределения
   */
  async distributeRewards(matchId) {
    try {
      const match = await PredictorMatch.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      if (!match.draftPhase.completed) {
        throw new Error('Draft phase not completed');
      }

      // Получение всех ставок на этот матч
      const bets = await PredictorBet.find({ matchId });

      let totalRewardsDistributed = 0;
      let usersRewarded = 0;

      // Обработка наград для каждого типа предсказания
      for (const predictionType of match.predictionTypes) {
        const { type, rewardPool } = predictionType;

        // Получение всех выигрышных ставок для этого типа
        const winningBets = [];
        let totalWinningBets = 0;

        for (const bet of bets) {
          const winningPrediction = bet.predictions.find(
            p => p.type === type && p.status === 'won'
          );
          if (winningPrediction) {
            winningBets.push({ bet, prediction: winningPrediction });
            totalWinningBets += winningPrediction.betAmount;
          }
        }

        // Если нет победителей, пул остается нераспределенным
        if (winningBets.length === 0 || totalWinningBets === 0) {
          continue;
        }

        // Распределение наград пропорционально ставкам с комиссией 5%
        const availableRewardPool = rewardPool * 0.95;

        for (const { bet, prediction } of winningBets) {
          const rewardShare = (prediction.betAmount / totalWinningBets) * availableRewardPool;
          prediction.reward = parseFloat(rewardShare.toFixed(2));
          bet.totalReward += prediction.reward;

          await bet.save();

          // Начисление награды на баланс пользователя
          const user = await User.findById(bet.userId);
          if (user) {
            user.coins += prediction.reward;
            await user.save();
            usersRewarded++;
          }

          totalRewardsDistributed += prediction.reward;
        }
      }

      return {
        success: true,
        totalRewardsDistributed: parseFloat(totalRewardsDistributed.toFixed(2)),
        usersRewarded,
        message: `Распределено ${totalRewardsDistributed.toFixed(2)} монет среди ${usersRewarded} пользователей`
      };
    } catch (error) {
      console.error('Error distributing rewards:', error);
      throw error;
    }
  }

  /**
   * Автоматическое закрытие приема ставок за 5 минут до матча
   * 
   * @param {String} matchId - ID матча
   * @returns {Object} - Результат закрытия
   */
  async closeBetting(matchId) {
    try {
      const match = await PredictorMatch.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Проверка времени до начала матча
      const timeUntilStart = match.startTime - new Date();
      const fiveMinutes = 5 * 60 * 1000;

      if (timeUntilStart > fiveMinutes) {
        return {
          success: false,
          message: 'Еще рано закрывать прием ставок'
        };
      }

      // Закрытие приема ставок для всех типов предсказаний
      match.predictionTypes.forEach(predictionType => {
        predictionType.closed = true;
      });

      // Обновление статуса матча
      if (match.status === 'upcoming') {
        match.status = 'live';
      }

      await match.save();

      return {
        success: true,
        message: 'Прием ставок закрыт'
      };
    } catch (error) {
      console.error('Error closing betting:', error);
      throw error;
    }
  }

  /**
   * Проверка и автоматическое закрытие ставок для всех предстоящих матчей
   * Должна вызываться периодически (например, каждую минуту)
   * 
   * @returns {Object} - Результат проверки
   */
  async checkAndCloseBetting() {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      // Находим все матчи, которые начинаются в ближайшие 5 минут
      const matches = await PredictorMatch.find({
        status: 'upcoming',
        startTime: { $lte: fiveMinutesFromNow }
      });

      let closedCount = 0;

      for (const match of matches) {
        const result = await this.closeBetting(match._id);
        if (result.success) {
          closedCount++;
        }
      }

      return {
        success: true,
        closedCount,
        message: `Закрыт прием ставок для ${closedCount} матчей`
      };
    } catch (error) {
      console.error('Error checking and closing betting:', error);
      throw error;
    }
  }
}

module.exports = new PredictionService();
