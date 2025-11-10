const Notification = require('../models/notificationModel');
const PredictorMatch = require('../models/predictorMatchModel');
const PredictorBet = require('../models/predictorBetModel');

class NotificationService {
  /**
   * Отправить уведомление о скором начале матча (за 10 минут)
   * @param {String} userId - ID пользователя
   * @param {String} matchId - ID матча
   * @returns {Promise<Object>} Созданное уведомление
   */
  async sendMatchStartingNotification(userId, matchId) {
    try {
      const match = await PredictorMatch.findById(matchId);
      
      if (!match) {
        throw new Error('Match not found');
      }

      const notification = await Notification.create({
        userId,
        type: 'match_starting',
        title: 'Матч скоро начнется!',
        message: `Матч ${match.team1.name} vs ${match.team2.name} начнется через 10 минут`,
        data: {
          matchId,
        },
      });

      return notification;
    } catch (error) {
      console.error('Error sending match starting notification:', error);
      throw error;
    }
  }

  /**
   * Отправить уведомление о результатах предсказания
   * @param {String} userId - ID пользователя
   * @param {String} betId - ID ставки
   * @returns {Promise<Object>} Созданное уведомление
   */
  async sendPredictionResultNotification(userId, betId) {
    try {
      const bet = await PredictorBet.findById(betId).populate('matchId');
      
      if (!bet) {
        throw new Error('Bet not found');
      }

      const match = bet.matchId;
      const hasWon = bet.predictions.some(p => p.status === 'won');
      const totalReward = bet.totalReward;

      let title, message;
      
      if (hasWon) {
        title = 'Поздравляем! Вы выиграли!';
        message = `Ваши предсказания для матча ${match.team1.name} vs ${match.team2.name} оказались верными. Вы выиграли ${totalReward} монет!`;
      } else {
        title = 'Результаты предсказания';
        message = `К сожалению, ваши предсказания для матча ${match.team1.name} vs ${match.team2.name} не оправдались.`;
      }

      const notification = await Notification.create({
        userId,
        type: 'prediction_result',
        title,
        message,
        data: {
          matchId: match._id,
          betId,
          reward: totalReward,
        },
      });

      return notification;
    } catch (error) {
      console.error('Error sending prediction result notification:', error);
      throw error;
    }
  }

  /**
   * Запланировать уведомления для матча
   * Создает уведомления для всех пользователей, сделавших ставки на матч
   * @param {String} matchId - ID матча
   * @returns {Promise<Array>} Массив созданных уведомлений
   */
  async scheduleMatchNotifications(matchId) {
    try {
      const match = await PredictorMatch.findById(matchId);
      
      if (!match) {
        throw new Error('Match not found');
      }

      // Получить всех пользователей, сделавших ставки на этот матч
      const bets = await PredictorBet.find({ matchId }).distinct('userId');
      
      if (bets.length === 0) {
        return [];
      }

      // Создать уведомления для всех пользователей
      const notifications = [];
      for (const userId of bets) {
        try {
          const notification = await this.sendMatchStartingNotification(userId, matchId);
          notifications.push(notification);
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error);
          // Продолжаем отправку остальным пользователям
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error scheduling match notifications:', error);
      throw error;
    }
  }

  /**
   * Очистить просроченные уведомления
   * MongoDB автоматически удаляет документы с истекшим TTL,
   * но этот метод может быть использован для принудительной очистки
   * @returns {Promise<Object>} Результат операции удаления
   */
  async cleanupExpiredNotifications() {
    try {
      const now = new Date();
      
      const result = await Notification.deleteMany({
        expiresAt: { $lt: now },
      });

      console.log(`Cleaned up ${result.deletedCount} expired notifications`);
      
      return {
        success: true,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  /**
   * Получить все уведомления пользователя
   * @param {String} userId - ID пользователя
   * @param {Object} options - Опции фильтрации
   * @returns {Promise<Array>} Массив уведомлений
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { 
        read = null, 
        limit = 50, 
        skip = 0 
      } = options;

      const query = { userId };
      
      if (read !== null) {
        query.read = read;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('data.matchId', 'team1 team2 game startTime')
        .lean();

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Отметить уведомление как прочитанное
   * @param {String} notificationId - ID уведомления
   * @param {String} userId - ID пользователя (для проверки прав)
   * @returns {Promise<Object>} Обновленное уведомление
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found or access denied');
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Получить количество непрочитанных уведомлений
   * @param {String} userId - ID пользователя
   * @returns {Promise<Number>} Количество непрочитанных уведомлений
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        userId,
        read: false,
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
