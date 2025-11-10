const PredictorMatch = require('../../models/predictorMatchModel');
const PredictorBet = require('../../models/predictorBetModel');
const User = require('../../models/userModel');
require('../setup');

describe('Predictor Models', () => {
  describe('PredictorMatch Model', () => {
    it('should create a valid match', async () => {
      const matchData = {
        game: 'dota2',
        team1: { name: 'Team A', logoUrl: 'http://example.com/logo1.png' },
        team2: { name: 'Team B', logoUrl: 'http://example.com/logo2.png' },
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        status: 'upcoming',
        predictionTypes: [
          {
            type: 'first_ban_team1',
            options: ['Hero1', 'Hero2', 'Hero3'],
            rewardPool: 0,
            betsCount: 0,
            closed: false,
          },
        ],
      };

      const match = await PredictorMatch.create(matchData);

      expect(match._id).toBeDefined();
      expect(match.game).toBe('dota2');
      expect(match.team1.name).toBe('Team A');
      expect(match.status).toBe('upcoming');
      expect(match.predictionTypes).toHaveLength(1);
    });

    it('should require game field', async () => {
      const matchData = {
        team1: { name: 'Team A' },
        team2: { name: 'Team B' },
        startTime: new Date(),
      };

      await expect(PredictorMatch.create(matchData)).rejects.toThrow();
    });

    it('should validate game enum', async () => {
      const matchData = {
        game: 'invalid_game',
        team1: { name: 'Team A' },
        team2: { name: 'Team B' },
        startTime: new Date(),
      };

      await expect(PredictorMatch.create(matchData)).rejects.toThrow();
    });

    it('should require team names', async () => {
      const matchData = {
        game: 'dota2',
        team1: { logoUrl: 'http://example.com/logo1.png' },
        team2: { name: 'Team B' },
        startTime: new Date(),
      };

      await expect(PredictorMatch.create(matchData)).rejects.toThrow();
    });

    it('should validate status enum', async () => {
      const matchData = {
        game: 'dota2',
        team1: { name: 'Team A' },
        team2: { name: 'Team B' },
        startTime: new Date(),
        status: 'invalid_status',
      };

      await expect(PredictorMatch.create(matchData)).rejects.toThrow();
    });

    it('should set default values', async () => {
      const matchData = {
        game: 'cs2',
        team1: { name: 'Team A' },
        team2: { name: 'Team B' },
        startTime: new Date(),
      };

      const match = await PredictorMatch.create(matchData);

      expect(match.status).toBe('upcoming');
      expect(match.team1.logoUrl).toBe('');
      expect(match.team2.logoUrl).toBe('');
      expect(match.draftPhase.started).toBe(false);
      expect(match.draftPhase.completed).toBe(false);
    });

    it('should create timestamps', async () => {
      const matchData = {
        game: 'dota2',
        team1: { name: 'Team A' },
        team2: { name: 'Team B' },
        startTime: new Date(),
      };

      const match = await PredictorMatch.create(matchData);

      expect(match.createdAt).toBeDefined();
      expect(match.updatedAt).toBeDefined();
    });
  });

  describe('PredictorBet Model', () => {
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
        team1: { name: 'Team A' },
        team2: { name: 'Team B' },
        startTime: new Date(),
      });
    });

    it('should create a valid bet', async () => {
      const betData = {
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
            odds: 2.5,
            status: 'pending',
            reward: 0,
          },
        ],
        totalBet: 100,
        totalReward: 0,
      };

      const bet = await PredictorBet.create(betData);

      expect(bet._id).toBeDefined();
      expect(bet.userId.toString()).toBe(testUser._id.toString());
      expect(bet.matchId.toString()).toBe(testMatch._id.toString());
      expect(bet.predictions).toHaveLength(1);
      expect(bet.totalBet).toBe(100);
    });

    it('should require userId', async () => {
      const betData = {
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
            odds: 2.5,
          },
        ],
        totalBet: 100,
      };

      await expect(PredictorBet.create(betData)).rejects.toThrow();
    });

    it('should require matchId', async () => {
      const betData = {
        userId: testUser._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
            odds: 2.5,
          },
        ],
        totalBet: 100,
      };

      await expect(PredictorBet.create(betData)).rejects.toThrow();
    });

    it('should validate betAmount minimum', async () => {
      const betData = {
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 5, // Below minimum
            odds: 2.5,
          },
        ],
        totalBet: 5,
      };

      await expect(PredictorBet.create(betData)).rejects.toThrow();
    });

    it('should validate betAmount maximum', async () => {
      const betData = {
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 15000, // Above maximum
            odds: 2.5,
          },
        ],
        totalBet: 15000,
      };

      await expect(PredictorBet.create(betData)).rejects.toThrow();
    });

    it('should validate prediction status enum', async () => {
      const betData = {
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
            odds: 2.5,
            status: 'invalid_status',
          },
        ],
        totalBet: 100,
      };

      await expect(PredictorBet.create(betData)).rejects.toThrow();
    });

    it('should set default values', async () => {
      const betData = {
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
            odds: 2.5,
          },
        ],
        totalBet: 100,
      };

      const bet = await PredictorBet.create(betData);

      expect(bet.predictions[0].status).toBe('pending');
      expect(bet.predictions[0].reward).toBe(0);
      expect(bet.totalReward).toBe(0);
    });

    it('should support multiple predictions', async () => {
      const betData = {
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
            odds: 2.5,
          },
          {
            type: 'first_pick_team1',
            choice: 'Hero2',
            betAmount: 150,
            odds: 3.0,
          },
        ],
        totalBet: 250,
      };

      const bet = await PredictorBet.create(betData);

      expect(bet.predictions).toHaveLength(2);
      expect(bet.totalBet).toBe(250);
    });

    it('should create timestamps', async () => {
      const betData = {
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
            odds: 2.5,
          },
        ],
        totalBet: 100,
      };

      const bet = await PredictorBet.create(betData);

      expect(bet.createdAt).toBeDefined();
      expect(bet.updatedAt).toBeDefined();
    });

    it('should populate userId reference', async () => {
      const betData = {
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
            odds: 2.5,
          },
        ],
        totalBet: 100,
      };

      const bet = await PredictorBet.create(betData);
      const populatedBet = await PredictorBet.findById(bet._id).populate('userId');

      expect(populatedBet.userId.nickname).toBe('testuser');
      expect(populatedBet.userId.email).toBe('test@example.com');
    });

    it('should populate matchId reference', async () => {
      const betData = {
        userId: testUser._id,
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 100,
            odds: 2.5,
          },
        ],
        totalBet: 100,
      };

      const bet = await PredictorBet.create(betData);
      const populatedBet = await PredictorBet.findById(bet._id).populate('matchId');

      expect(populatedBet.matchId.game).toBe('dota2');
      expect(populatedBet.matchId.team1.name).toBe('Team A');
    });
  });
});
