const PredictionService = require('../../services/predictionService');
const PredictorMatch = require('../../models/predictorMatchModel');
const PredictorBet = require('../../models/predictorBetModel');
const User = require('../../models/userModel');
require('../setup');

describe('PredictionService', () => {
  let testUser;
  let testMatch;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      nickname: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      coins: 1000,
    });

    // Create test match
    testMatch = await PredictorMatch.create({
      game: 'dota2',
      team1: { name: 'Team A', logoUrl: '' },
      team2: { name: 'Team B', logoUrl: '' },
      startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      status: 'upcoming',
      predictionTypes: [
        {
          type: 'first_ban_team1',
          options: ['Hero1', 'Hero2', 'Hero3'],
          rewardPool: 0,
          betsCount: 0,
          closed: false,
        },
        {
          type: 'first_pick_team1',
          options: ['Hero4', 'Hero5', 'Hero6'],
          rewardPool: 0,
          betsCount: 0,
          closed: false,
        },
      ],
    });
  });

  describe('calculateOdds', () => {
    it('should return base odds of 2.0 when no bets exist', async () => {
      const odds = await PredictionService.calculateOdds(
        testMatch._id,
        'first_ban_team1',
        'Hero1'
      );

      expect(odds).toBe(2.0);
    });

    it('should return 10.0 for option with no bets when other options have bets', async () => {
      // Place a bet on Hero1
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

      // Update match reward pool
      testMatch.predictionTypes[0].rewardPool = 100;
      testMatch.predictionTypes[0].betsCount = 1;
      await testMatch.save();

      // Calculate odds for Hero2 (no bets)
      const odds = await PredictionService.calculateOdds(
        testMatch._id,
        'first_ban_team1',
        'Hero2'
      );

      expect(odds).toBe(10.0);
    });

    it('should calculate correct odds with commission', async () => {
      // Create multiple bets
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

      // Update match reward pool
      testMatch.predictionTypes[0].rewardPool = 100;
      testMatch.predictionTypes[0].betsCount = 1;
      await testMatch.save();

      const odds = await PredictionService.calculateOdds(
        testMatch._id,
        'first_ban_team1',
        'Hero1'
      );

      // odds = (100 / 100) * 0.95 = 0.95, but min is 1.1
      expect(odds).toBe(1.1);
    });

    it('should limit odds to maximum of 10.0', async () => {
      // Create bet with very small amount
      await PredictorBet.create({
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 10,
            odds: 2.0,
            status: 'pending',
          },
        ],
        totalBet: 10,
      });

      testMatch.predictionTypes[0].rewardPool = 10000;
      testMatch.predictionTypes[0].betsCount = 1;
      await testMatch.save();

      const odds = await PredictionService.calculateOdds(
        testMatch._id,
        'first_ban_team1',
        'Hero1'
      );

      expect(odds).toBeLessThanOrEqual(10.0);
    });
  });

  describe('validateBet', () => {
    it('should validate a correct bet', async () => {
      const betData = {
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
          },
        ],
      };

      const result = await PredictionService.validateBet(testUser._id, betData);

      expect(result.valid).toBe(true);
      expect(result.totalBet).toBe(100);
    });

    it('should reject bet with insufficient funds', async () => {
      const betData = {
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 2000, // More than user has
          },
        ],
      };

      const result = await PredictionService.validateBet(testUser._id, betData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('INSUFFICIENT_FUNDS');
    });

    it('should reject bet with invalid amount', async () => {
      const betData = {
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 5, // Less than minimum
          },
        ],
      };

      const result = await PredictionService.validateBet(testUser._id, betData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_BET_AMOUNT');
    });

    it('should reject bet on closed match', async () => {
      testMatch.status = 'live';
      await testMatch.save();

      const betData = {
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
          },
        ],
      };

      const result = await PredictionService.validateBet(testUser._id, betData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('BETTING_CLOSED');
    });

    it('should reject duplicate bet', async () => {
      // Create existing bet
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

      const betData = {
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero2',
            betAmount: 100,
          },
        ],
      };

      const result = await PredictionService.validateBet(testUser._id, betData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('DUPLICATE_BET');
    });
  });

  describe('placeBet', () => {
    it('should place bet and deduct coins', async () => {
      const betData = {
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
          },
        ],
      };

      const bet = await PredictionService.placeBet(testUser._id, betData);

      expect(bet).toBeDefined();
      expect(bet.totalBet).toBe(100);
      expect(bet.predictions[0].odds).toBeGreaterThan(0);

      // Check user balance
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.coins).toBe(900);

      // Check match reward pool
      const updatedMatch = await PredictorMatch.findById(testMatch._id);
      expect(updatedMatch.predictionTypes[0].rewardPool).toBe(100);
      expect(updatedMatch.predictionTypes[0].betsCount).toBe(1);
    });

    it('should handle multiple predictions in one bet', async () => {
      const betData = {
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
          },
          {
            type: 'first_pick_team1',
            choice: 'Hero4',
            betAmount: 150,
          },
        ],
      };

      const bet = await PredictionService.placeBet(testUser._id, betData);

      expect(bet.totalBet).toBe(250);
      expect(bet.predictions).toHaveLength(2);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.coins).toBe(750);
    });
  });

  describe('processResults', () => {
    beforeEach(async () => {
      // Place some bets
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

      testMatch.status = 'draft_phase';
      await testMatch.save();
    });

    it('should process results and mark winners', async () => {
      const results = {
        firstBan: { team1: 'Hero1', team2: 'Hero3' },
        firstPick: { team1: 'Hero4', team2: 'Hero5' },
        mostBanned: 'Hero2',
        picks: { team1: ['Hero4', 'Hero6'], team2: ['Hero5', 'Hero7'] },
      };

      const result = await PredictionService.processResults(testMatch._id, results);

      expect(result.success).toBe(true);
      expect(result.processedBets).toBe(1);
      expect(result.winningBets).toBe(1);

      // Check bet status
      const bet = await PredictorBet.findOne({ userId: testUser._id });
      expect(bet.predictions[0].status).toBe('won');

      // Check match status
      const updatedMatch = await PredictorMatch.findById(testMatch._id);
      expect(updatedMatch.status).toBe('completed');
      expect(updatedMatch.draftPhase.completed).toBe(true);
    });

    it('should mark losing predictions correctly', async () => {
      const results = {
        firstBan: { team1: 'Hero2', team2: 'Hero3' }, // Different from bet
        firstPick: { team1: 'Hero4', team2: 'Hero5' },
      };

      await PredictionService.processResults(testMatch._id, results);

      const bet = await PredictorBet.findOne({ userId: testUser._id });
      expect(bet.predictions[0].status).toBe('lost');
    });
  });

  describe('distributeRewards', () => {
    beforeEach(async () => {
      // Create multiple users and bets
      const user2 = await User.create({
        nickname: 'testuser2',
        email: 'test2@example.com',
        password: 'hashedpassword',
        coins: 1000,
      });

      // User 1 bets 100 on Hero1
      await PredictorBet.create({
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
            odds: 2.0,
            status: 'won',
          },
        ],
        totalBet: 100,
        totalReward: 0,
      });

      // User 2 bets 200 on Hero1
      await PredictorBet.create({
        userId: user2._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 200,
            odds: 2.0,
            status: 'won',
          },
        ],
        totalBet: 200,
        totalReward: 0,
      });

      // Update match
      testMatch.predictionTypes[0].rewardPool = 300;
      testMatch.predictionTypes[0].betsCount = 2;
      testMatch.draftPhase.completed = true;
      testMatch.status = 'completed';
      await testMatch.save();
    });

    it('should distribute rewards proportionally', async () => {
      const result = await PredictionService.distributeRewards(testMatch._id);

      expect(result.success).toBe(true);
      expect(result.usersRewarded).toBe(2);

      // Check bets
      const bet1 = await PredictorBet.findOne({ userId: testUser._id });
      const bet2 = await PredictorBet.findOne({ userId: { $ne: testUser._id } });

      // Total pool: 300, with 5% commission: 285
      // User1: (100/300) * 285 = 95
      // User2: (200/300) * 285 = 190
      expect(bet1.predictions[0].reward).toBeCloseTo(95, 0);
      expect(bet2.predictions[0].reward).toBeCloseTo(190, 0);

      // Check user balances updated
      const updatedUser1 = await User.findById(testUser._id);
      expect(updatedUser1.coins).toBeGreaterThan(1000);
    });

    it('should handle no winners scenario', async () => {
      // Mark all bets as lost
      await PredictorBet.updateMany(
        { matchId: testMatch._id },
        { $set: { 'predictions.$[].status': 'lost' } }
      );

      const result = await PredictionService.distributeRewards(testMatch._id);

      expect(result.success).toBe(true);
      expect(result.usersRewarded).toBe(0);
      expect(result.totalRewardsDistributed).toBe(0);
    });
  });

  describe('closeBetting', () => {
    it('should close betting when time is right', async () => {
      // Set match to start in 4 minutes
      testMatch.startTime = new Date(Date.now() + 4 * 60 * 1000);
      await testMatch.save();

      const result = await PredictionService.closeBetting(testMatch._id);

      expect(result.success).toBe(true);

      const updatedMatch = await PredictorMatch.findById(testMatch._id);
      expect(updatedMatch.status).toBe('live');
      expect(updatedMatch.predictionTypes[0].closed).toBe(true);
    });

    it('should not close betting too early', async () => {
      // Match starts in 10 minutes
      testMatch.startTime = new Date(Date.now() + 10 * 60 * 1000);
      await testMatch.save();

      const result = await PredictionService.closeBetting(testMatch._id);

      expect(result.success).toBe(false);

      const updatedMatch = await PredictorMatch.findById(testMatch._id);
      expect(updatedMatch.status).toBe('upcoming');
    });
  });

  describe('checkAndCloseBetting', () => {
    it('should close betting for matches starting soon', async () => {
      // Create match starting in 3 minutes
      const soonMatch = await PredictorMatch.create({
        game: 'cs2',
        team1: { name: 'Team C', logoUrl: '' },
        team2: { name: 'Team D', logoUrl: '' },
        startTime: new Date(Date.now() + 3 * 60 * 1000),
        status: 'upcoming',
        predictionTypes: [
          {
            type: 'first_ban_team1',
            options: ['Agent1', 'Agent2'],
            rewardPool: 0,
            betsCount: 0,
            closed: false,
          },
        ],
      });

      const result = await PredictionService.checkAndCloseBetting();

      expect(result.success).toBe(true);
      expect(result.closedCount).toBeGreaterThan(0);

      const updatedMatch = await PredictorMatch.findById(soonMatch._id);
      expect(updatedMatch.status).toBe('live');
    });
  });
});
