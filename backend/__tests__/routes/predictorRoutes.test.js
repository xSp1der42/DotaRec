const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const PredictorMatch = require('../../models/predictorMatchModel');
const PredictorBet = require('../../models/predictorBetModel');
const User = require('../../models/userModel');
const predictorRoutes = require('../../routes/predictorRoutes');
require('../setup');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/predictor', predictorRoutes);

describe('Predictor Routes', () => {
  let testUser;
  let adminUser;
  let userToken;
  let adminToken;
  let testMatch;

  beforeEach(async () => {
    // Create test users
    testUser = await User.create({
      nickname: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      coins: 1000,
      role: 'user',
    });

    adminUser = await User.create({
      nickname: 'admin',
      email: 'admin@example.com',
      password: 'hashedpassword',
      coins: 1000,
      role: 'admin',
    });

    // Generate tokens
    userToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET || 'testsecret');
    adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET || 'testsecret');

    // Create test match
    testMatch = await PredictorMatch.create({
      game: 'dota2',
      team1: { name: 'Team A', logoUrl: '' },
      team2: { name: 'Team B', logoUrl: '' },
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
    });
  });

  describe('GET /api/predictor/matches', () => {
    it('should get all matches', async () => {
      const res = await request(app).get('/api/predictor/matches');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter matches by status', async () => {
      await PredictorMatch.create({
        game: 'cs2',
        team1: { name: 'Team C', logoUrl: '' },
        team2: { name: 'Team D', logoUrl: '' },
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        status: 'completed',
        predictionTypes: [],
      });

      const res = await request(app).get('/api/predictor/matches?status=upcoming');

      expect(res.status).toBe(200);
      expect(res.body.every(m => m.status === 'upcoming')).toBe(true);
    });

    it('should filter matches by game', async () => {
      await PredictorMatch.create({
        game: 'cs2',
        team1: { name: 'Team C', logoUrl: '' },
        team2: { name: 'Team D', logoUrl: '' },
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        status: 'upcoming',
        predictionTypes: [],
      });

      const res = await request(app).get('/api/predictor/matches?game=dota2');

      expect(res.status).toBe(200);
      expect(res.body.every(m => m.game === 'dota2')).toBe(true);
    });
  });

  describe('GET /api/predictor/matches/:id', () => {
    it('should get match by id', async () => {
      const res = await request(app).get(`/api/predictor/matches/${testMatch._id}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(testMatch._id.toString());
      expect(res.body.team1.name).toBe('Team A');
    });

    it('should return 404 for non-existent match', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/predictor/matches/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MATCH_NOT_FOUND');
    });
  });

  describe('POST /api/predictor/matches', () => {
    it('should create match as admin', async () => {
      const matchData = {
        game: 'cs2',
        team1: { name: 'Team E', logoUrl: '' },
        team2: { name: 'Team F', logoUrl: '' },
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        predictionTypes: [
          {
            type: 'first_ban_team1',
            options: ['Agent1', 'Agent2'],
            rewardPool: 0,
            betsCount: 0,
            closed: false,
          },
        ],
      };

      const res = await request(app)
        .post('/api/predictor/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(matchData);

      expect(res.status).toBe(201);
      expect(res.body.game).toBe('cs2');
      expect(res.body.team1.name).toBe('Team E');
    });

    it('should reject creation by non-admin', async () => {
      const matchData = {
        game: 'cs2',
        team1: { name: 'Team E', logoUrl: '' },
        team2: { name: 'Team F', logoUrl: '' },
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      };

      const res = await request(app)
        .post('/api/predictor/matches')
        .set('Authorization', `Bearer ${userToken}`)
        .send(matchData);

      expect(res.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/predictor/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ game: 'dota2' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_DATA');
    });
  });

  describe('POST /api/predictor/bets', () => {
    it('should place bet successfully', async () => {
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

      const res = await request(app)
        .post('/api/predictor/bets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(betData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.bet.totalBet).toBe(100);

      // Verify user balance
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.coins).toBe(900);
    });

    it('should reject bet with invalid amount', async () => {
      const betData = {
        matchId: testMatch._id,
        predictions: [
          {
            type: 'first_ban_team1',
            choice: 'Hero1',
            betAmount: 5, // Too low
          },
        ],
      };

      const res = await request(app)
        .post('/api/predictor/bets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(betData);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_BET_AMOUNT');
    });

    it('should reject bet without authentication', async () => {
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

      const res = await request(app).post('/api/predictor/bets').send(betData);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/predictor/bets', () => {
    beforeEach(async () => {
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
    });

    it('should get user bets', async () => {
      const res = await request(app)
        .get('/api/predictor/bets')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bets).toHaveLength(1);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/predictor/bets?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/predictor/stats/:matchId', () => {
    beforeEach(async () => {
      // Create bets for statistics
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
    });

    it('should get match statistics', async () => {
      const res = await request(app).get(`/api/predictor/stats/${testMatch._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(Array.isArray(res.body.stats)).toBe(true);
    });

    it('should calculate percentages correctly', async () => {
      const res = await request(app).get(`/api/predictor/stats/${testMatch._id}`);

      const firstBanStats = res.body.stats.find(s => s.type === 'first_ban_team1');
      expect(firstBanStats).toBeDefined();
      expect(firstBanStats.totalAmount).toBe(100);
      expect(firstBanStats.participants).toBe(1);
    });
  });

  describe('POST /api/predictor/matches/:id/results', () => {
    beforeEach(async () => {
      testMatch.status = 'draft_phase';
      await testMatch.save();

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
    });

    it('should set match results as admin', async () => {
      const results = {
        firstBan: { team1: 'Hero1', team2: 'Hero3' },
        firstPick: { team1: 'Hero4', team2: 'Hero5' },
        mostBanned: 'Hero2',
        picks: { team1: ['Hero4'], team2: ['Hero5'] },
      };

      const res = await request(app)
        .post(`/api/predictor/matches/${testMatch._id}/results`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ results });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.match.status).toBe('completed');
    });

    it('should reject results from non-admin', async () => {
      const results = {
        firstBan: { team1: 'Hero1', team2: 'Hero3' },
      };

      const res = await request(app)
        .post(`/api/predictor/matches/${testMatch._id}/results`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ results });

      expect(res.status).toBe(403);
    });
  });
});
