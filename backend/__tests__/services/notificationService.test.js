const NotificationService = require('../../services/notificationService');
const Notification = require('../../models/notificationModel');
const PredictorMatch = require('../../models/predictorMatchModel');
const PredictorBet = require('../../models/predictorBetModel');
const User = require('../../models/userModel');
require('../setup');

describe('NotificationService', () => {
  let testUser;
  let testMatch;

  beforeEach(async () => {
    testUser = await User.create({
      nickname: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      coins: 1000,
    });

    testMatch = await PredictorMatch.create({
      game: 'dota2',
      team1: { name: 'Team A', logoUrl: '' },
      team2: { name: 'Team B', logoUrl: '' },
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      status: 'upcoming',
      predictionTypes: [],
    });
  });

  describe('sendMatchStartingNotification', () => {
    it('should create match starting notification', async () => {
      const notification = await NotificationService.sendMatchStartingNotification(
        testUser._id,
        testMatch._id
      );

      expect(notification).toBeDefined();
      expect(notification.userId.toString()).toBe(testUser._id.toString());
      expect(notification.type).toBe('match_starting');
      expect(notification.title).toBe('Матч скоро начнется!');
      expect(notification.message).toContain('Team A');
      expect(notification.message).toContain('Team B');
      expect(notification.data.matchId.toString()).toBe(testMatch._id.toString());
      expect(notification.read).toBe(false);
    });

    it('should throw error for non-existent match', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await expect(
        NotificationService.sendMatchStartingNotification(testUser._id, fakeId)
      ).rejects.toThrow('Match not found');
    });
  });

  describe('sendPredictionResultNotification', () => {
    let testBet;

    beforeEach(async () => {
      testBet = await PredictorBet.create({
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
            odds: 2.0,
            status: 'won',
            reward: 190,
          },
        ],
        totalBet: 100,
        totalReward: 190,
      });
    });

    it('should create winning notification', async () => {
      const notification = await NotificationService.sendPredictionResultNotification(
        testUser._id,
        testBet._id
      );

      expect(notification).toBeDefined();
      expect(notification.type).toBe('prediction_result');
      expect(notification.title).toBe('Поздравляем! Вы выиграли!');
      expect(notification.message).toContain('190');
      expect(notification.data.reward).toBe(190);
    });

    it('should create losing notification', async () => {
      testBet.predictions[0].status = 'lost';
      testBet.totalReward = 0;
      await testBet.save();

      const notification = await NotificationService.sendPredictionResultNotification(
        testUser._id,
        testBet._id
      );

      expect(notification.title).toBe('Результаты предсказания');
      expect(notification.message).toContain('не оправдались');
    });

    it('should throw error for non-existent bet', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await expect(
        NotificationService.sendPredictionResultNotification(testUser._id, fakeId)
      ).rejects.toThrow('Bet not found');
    });
  });

  describe('scheduleMatchNotifications', () => {
    it('should create notifications for all users with bets', async () => {
      const user2 = await User.create({
        nickname: 'testuser2',
        email: 'test2@example.com',
        password: 'hashedpassword',
        coins: 1000,
      });

      // Create bets for both users
      await PredictorBet.create({
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
            odds: 2.0,
            status: 'pending',
          },
        ],
        totalBet: 100,
      });

      await PredictorBet.create({
        userId: user2._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero2',
            betAmount: 150,
            odds: 2.0,
            status: 'pending',
          },
        ],
        totalBet: 150,
      });

      const notifications = await NotificationService.scheduleMatchNotifications(testMatch._id);

      expect(notifications).toHaveLength(2);
      expect(notifications[0].type).toBe('match_starting');
      expect(notifications[1].type).toBe('match_starting');
    });

    it('should return empty array when no bets exist', async () => {
      const notifications = await NotificationService.scheduleMatchNotifications(testMatch._id);

      expect(notifications).toHaveLength(0);
    });

    it('should throw error for non-existent match', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await expect(
        NotificationService.scheduleMatchNotifications(fakeId)
      ).rejects.toThrow('Match not found');
    });
  });

  describe('getUserNotifications', () => {
    beforeEach(async () => {
      // Create multiple notifications
      await Notification.create({
        userId: testUser._id,
        type: 'match_starting',
        title: 'Test 1',
        message: 'Message 1',
        data: { matchId: testMatch._id },
        read: false,
      });

      await Notification.create({
        userId: testUser._id,
        type: 'prediction_result',
        title: 'Test 2',
        message: 'Message 2',
        data: { matchId: testMatch._id },
        read: true,
      });
    });

    it('should get all user notifications', async () => {
      const notifications = await NotificationService.getUserNotifications(testUser._id);

      expect(notifications).toHaveLength(2);
    });

    it('should filter unread notifications', async () => {
      const notifications = await NotificationService.getUserNotifications(testUser._id, {
        read: false,
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].read).toBe(false);
    });

    it('should respect limit and skip', async () => {
      const notifications = await NotificationService.getUserNotifications(testUser._id, {
        limit: 1,
        skip: 1,
      });

      expect(notifications).toHaveLength(1);
    });
  });

  describe('markAsRead', () => {
    let notification;

    beforeEach(async () => {
      notification = await Notification.create({
        userId: testUser._id,
        type: 'match_starting',
        title: 'Test',
        message: 'Message',
        data: { matchId: testMatch._id },
        read: false,
      });
    });

    it('should mark notification as read', async () => {
      const updated = await NotificationService.markAsRead(notification._id, testUser._id);

      expect(updated.read).toBe(true);
    });

    it('should throw error for wrong user', async () => {
      const otherUser = await User.create({
        nickname: 'otheruser',
        email: 'other@example.com',
        password: 'hashedpassword',
        coins: 1000,
      });

      await expect(
        NotificationService.markAsRead(notification._id, otherUser._id)
      ).rejects.toThrow('Notification not found or access denied');
    });
  });

  describe('getUnreadCount', () => {
    beforeEach(async () => {
      await Notification.create({
        userId: testUser._id,
        type: 'match_starting',
        title: 'Test 1',
        message: 'Message 1',
        data: { matchId: testMatch._id },
        read: false,
      });

      await Notification.create({
        userId: testUser._id,
        type: 'match_starting',
        title: 'Test 2',
        message: 'Message 2',
        data: { matchId: testMatch._id },
        read: false,
      });

      await Notification.create({
        userId: testUser._id,
        type: 'match_starting',
        title: 'Test 3',
        message: 'Message 3',
        data: { matchId: testMatch._id },
        read: true,
      });
    });

    it('should return correct unread count', async () => {
      const count = await NotificationService.getUnreadCount(testUser._id);

      expect(count).toBe(2);
    });
  });

  describe('cleanupExpiredNotifications', () => {
    it('should delete expired notifications', async () => {
      // Create expired notification
      await Notification.create({
        userId: testUser._id,
        type: 'match_starting',
        title: 'Expired',
        message: 'This is expired',
        data: { matchId: testMatch._id },
        read: false,
        expiresAt: new Date(Date.now() - 1000), // Already expired
      });

      // Create valid notification
      await Notification.create({
        userId: testUser._id,
        type: 'match_starting',
        title: 'Valid',
        message: 'This is valid',
        data: { matchId: testMatch._id },
        read: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

      const result = await NotificationService.cleanupExpiredNotifications();

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);

      const remaining = await Notification.countDocuments({ userId: testUser._id });
      expect(remaining).toBe(1);
    });
  });
});
