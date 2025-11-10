const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const PredictorMatch = require('../../models/predictorMatchModel');
const User = require('../../models/userModel');
const predictorRoutes = require('../../routes/predictorRoutes');
require('../setup');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/predictor', predictorRoutes);

describe('Logo Upload Tests', () => {
  let adminUser;
  let adminToken;
  let testMatch;

  beforeEach(async () => {
    adminUser = await User.create({
      nickname: 'admin',
      email: 'admin@example.com',
      password: 'hashedpassword',
      coins: 1000,
      role: 'admin',
    });

    adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET || 'testsecret');

    testMatch = await PredictorMatch.create({
      game: 'dota2',
      team1: { name: 'Team A', logoUrl: '' },
      team2: { name: 'Team B', logoUrl: '' },
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      status: 'upcoming',
      predictionTypes: [],
    });
  });

  afterEach(() => {
    // Clean up uploaded test files
    const teamLogosDir = 'uploads/team-logos';
    if (fs.existsSync(teamLogosDir)) {
      const files = fs.readdirSync(teamLogosDir);
      files.forEach(file => {
        if (file.startsWith('logo-')) {
          fs.unlinkSync(path.join(teamLogosDir, file));
        }
      });
    }
  });

  describe('POST /api/predictor/matches/:id/logo', () => {
    it('should upload PNG logo successfully', async () => {
      // Create a test PNG file
      const testImagePath = path.join(__dirname, '../fixtures/test-logo.png');
      
      // Create fixtures directory if it doesn't exist
      const fixturesDir = path.join(__dirname, '../fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }

      // Create a minimal PNG file (1x1 pixel)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
        0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, pngBuffer);

      const res = await request(app)
        .post(`/api/predictor/matches/${testMatch._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('team', 'team1')
        .attach('logo', testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.logoUrl).toBeDefined();
      expect(res.body.team).toBe('team1');

      // Verify match was updated
      const updatedMatch = await PredictorMatch.findById(testMatch._id);
      expect(updatedMatch.team1.logoUrl).toBeTruthy();

      // Clean up test file
      fs.unlinkSync(testImagePath);
    });

    it('should reject file larger than 2MB', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/large-logo.png');
      
      const fixturesDir = path.join(__dirname, '../fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }

      // Create a file larger than 2MB
      const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB
      fs.writeFileSync(testImagePath, largeBuffer);

      const res = await request(app)
        .post(`/api/predictor/matches/${testMatch._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('team', 'team1')
        .attach('logo', testImagePath);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('FILE_TOO_LARGE');

      // Clean up test file
      fs.unlinkSync(testImagePath);
    });

    it('should reject invalid file format', async () => {
      const testFilePath = path.join(__dirname, '../fixtures/test-file.txt');
      
      const fixturesDir = path.join(__dirname, '../fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }

      fs.writeFileSync(testFilePath, 'This is not an image');

      const res = await request(app)
        .post(`/api/predictor/matches/${testMatch._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('team', 'team1')
        .attach('logo', testFilePath);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE_FORMAT');

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });

    it('should reject upload without team field', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-logo.png');
      
      const fixturesDir = path.join(__dirname, '../fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }

      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
        0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, pngBuffer);

      const res = await request(app)
        .post(`/api/predictor/matches/${testMatch._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('logo', testImagePath);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TEAM');

      // Clean up test file
      fs.unlinkSync(testImagePath);
    });

    it('should reject upload without file', async () => {
      const res = await request(app)
        .post(`/api/predictor/matches/${testMatch._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('team', 'team1');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('NO_FILE');
    });

    it('should reject upload for non-existent match', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-logo.png');
      
      const fixturesDir = path.join(__dirname, '../fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }

      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
        0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, pngBuffer);

      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post(`/api/predictor/matches/${fakeId}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('team', 'team1')
        .attach('logo', testImagePath);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MATCH_NOT_FOUND');

      // Clean up test file
      fs.unlinkSync(testImagePath);
    });

    it('should reject upload by non-admin', async () => {
      const regularUser = await User.create({
        nickname: 'user',
        email: 'user@example.com',
        password: 'hashedpassword',
        coins: 1000,
        role: 'user',
      });

      const userToken = jwt.sign({ id: regularUser._id }, process.env.JWT_SECRET || 'testsecret');

      const testImagePath = path.join(__dirname, '../fixtures/test-logo.png');
      
      const fixturesDir = path.join(__dirname, '../fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }

      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
        0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, pngBuffer);

      const res = await request(app)
        .post(`/api/predictor/matches/${testMatch._id}/logo`)
        .set('Authorization', `Bearer ${userToken}`)
        .field('team', 'team1')
        .attach('logo', testImagePath);

      expect(res.status).toBe(403);

      // Clean up test file
      fs.unlinkSync(testImagePath);
    });
  });
});
