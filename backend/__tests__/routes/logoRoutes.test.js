const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const Team = require('../../models/teamModel');
const User = require('../../models/userModel');
const logoRoutes = require('../../routes/logoRoutes');
require('../setup');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api', logoRoutes);

describe('Logo Management API Tests', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;
  let testTeam;
  let fixturesDir;
  let testImagePath;

  beforeAll(() => {
    // Create fixtures directory
    fixturesDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // Create test image path
    testImagePath = path.join(fixturesDir, 'test-logo.png');
  });

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      nickname: 'admin',
      email: 'admin@example.com',
      password: 'hashedpassword',
      coins: 1000,
      role: 'admin',
    });

    // Create regular user
    regularUser = await User.create({
      nickname: 'user',
      email: 'user@example.com',
      password: 'hashedpassword',
      coins: 1000,
      role: 'user',
    });

    adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET || 'testsecret');
    userToken = jwt.sign({ id: regularUser._id }, process.env.JWT_SECRET || 'testsecret');

    // Create test team
    testTeam = await Team.create({
      name: 'Test Team',
      game: 'dota2'
    });

    // Create a minimal valid PNG file for testing (32x32 transparent PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x20, 0x08, 0x06, 0x00, 0x00, 0x00, 0x73, 0x7A, 0x7A,
      0xF4, 0x00, 0x00, 0x00, 0x19, 0x74, 0x45, 0x58, 0x74, 0x53, 0x6F, 0x66, 0x74, 0x77, 0x61, 0x72,
      0x65, 0x00, 0x41, 0x64, 0x6F, 0x62, 0x65, 0x20, 0x49, 0x6D, 0x61, 0x67, 0x65, 0x52, 0x65, 0x61,
      0x64, 0x79, 0x71, 0xC9, 0x65, 0x3C, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x78, 0xDA,
      0x62, 0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x04, 0x00, 0x01, 0x27, 0x5C, 0x22, 0xEC, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(testImagePath, pngBuffer);
  });

  afterEach(() => {
    // Clean up uploaded test files
    const teamLogosDir = path.join(__dirname, '../../uploads/team-logos');
    if (fs.existsSync(teamLogosDir)) {
      const files = fs.readdirSync(teamLogosDir);
      files.forEach(file => {
        if (file.startsWith('team-')) {
          try {
            fs.unlinkSync(path.join(teamLogosDir, file));
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      });
    }

    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  describe('POST /api/admin/teams/:teamId/logo', () => {
    it('should upload logo successfully for admin', async () => {
      const res = await request(app)
        .post(`/api/admin/teams/${testTeam._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('logo', testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logo uploaded successfully');
      expect(res.body.team).toBeDefined();
      expect(res.body.team.logo).toBeDefined();
      expect(res.body.team.logo.originalUrl).toBeDefined();
      expect(res.body.team.logo.sizes).toBeDefined();
      expect(res.body.team.logo.sizes.small).toBeDefined();
      expect(res.body.team.logo.sizes.medium).toBeDefined();
      expect(res.body.team.logo.sizes.large).toBeDefined();

      // Verify team was updated in database
      const updatedTeam = await Team.findById(testTeam._id);
      expect(updatedTeam.logo).toBeDefined();
      expect(updatedTeam.logo.originalUrl).toBeTruthy();
    });

    it('should reject upload by non-admin user', async () => {
      const res = await request(app)
        .post(`/api/admin/teams/${testTeam._id}/logo`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('logo', testImagePath);

      expect(res.status).toBe(403);
    });

    it('should reject upload without authentication', async () => {
      const res = await request(app)
        .post(`/api/admin/teams/${testTeam._id}/logo`)
        .attach('logo', testImagePath);

      expect(res.status).toBe(401);
    });

    it('should reject upload without file', async () => {
      const res = await request(app)
        .post(`/api/admin/teams/${testTeam._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No file uploaded');
    });

    it('should reject upload for non-existent team', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post(`/api/admin/teams/${fakeId}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('logo', testImagePath);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Team not found');
    });

    it('should reject invalid file format', async () => {
      const textFilePath = path.join(fixturesDir, 'test-file.txt');
      fs.writeFileSync(textFilePath, 'This is not an image');

      const res = await request(app)
        .post(`/api/admin/teams/${testTeam._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('logo', textFilePath);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid file type');

      fs.unlinkSync(textFilePath);
    });

    it('should reject file larger than 2MB', async () => {
      const largeFilePath = path.join(fixturesDir, 'large-file.png');
      const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB
      fs.writeFileSync(largeFilePath, largeBuffer);

      const res = await request(app)
        .post(`/api/admin/teams/${testTeam._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('logo', largeFilePath);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('File too large');

      fs.unlinkSync(largeFilePath);
    });

    it('should replace existing logo', async () => {
      // First upload
      await request(app)
        .post(`/api/admin/teams/${testTeam._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('logo', testImagePath);

      // Second upload (should replace)
      const res = await request(app)
        .post(`/api/admin/teams/${testTeam._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('logo', testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/teams/logos', () => {
    beforeEach(async () => {
      // Create additional test teams
      await Team.create({ name: 'Team A', game: 'dota2' });
      await Team.create({ name: 'Team B', game: 'cs2' });
    });

    it('should get all teams with logos for admin', async () => {
      const res = await request(app)
        .get('/api/admin/teams/logos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.teams).toBeDefined();
      expect(Array.isArray(res.body.teams)).toBe(true);
      expect(res.body.count).toBe(3); // testTeam + 2 additional teams
    });

    it('should filter teams by game', async () => {
      const res = await request(app)
        .get('/api/admin/teams/logos?game=dota2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.teams).toBeDefined();
      expect(res.body.teams.every(team => team.game === 'dota2')).toBe(true);
    });

    it('should reject access by non-admin user', async () => {
      const res = await request(app)
        .get('/api/admin/teams/logos')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject access without authentication', async () => {
      const res = await request(app)
        .get('/api/admin/teams/logos');

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/admin/teams/:teamId/logo', () => {
    beforeEach(async () => {
      // Upload a logo first
      await request(app)
        .post(`/api/admin/teams/${testTeam._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('logo', testImagePath);
    });

    it('should delete logo successfully for admin', async () => {
      const res = await request(app)
        .delete(`/api/admin/teams/${testTeam._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logo deleted successfully');

      // Verify logo was removed from database
      const updatedTeam = await Team.findById(testTeam._id);
      expect(updatedTeam.logo).toBeUndefined();
    });

    it('should reject delete by non-admin user', async () => {
      const res = await request(app)
        .delete(`/api/admin/teams/${testTeam._id}/logo`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject delete for team without logo', async () => {
      const teamWithoutLogo = await Team.create({
        name: 'No Logo Team',
        game: 'dota2'
      });

      const res = await request(app)
        .delete(`/api/admin/teams/${teamWithoutLogo._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Team has no logo to delete');
    });

    it('should reject delete for non-existent team', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .delete(`/api/admin/teams/${fakeId}/logo`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Team not found');
    });
  });

  describe('GET /api/teams/:teamId/logo', () => {
    beforeEach(async () => {
      // Upload a logo first
      await request(app)
        .post(`/api/admin/teams/${testTeam._id}/logo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('logo', testImagePath);
    });

    it('should get team logo information (public access)', async () => {
      const res = await request(app)
        .get(`/api/teams/${testTeam._id}/logo`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.team).toBeDefined();
      expect(res.body.team.logo).toBeDefined();
      expect(res.body.team.logo.url).toBeDefined();
      expect(res.body.team.logo.sizes).toBeDefined();
    });

    it('should get specific logo size', async () => {
      const res = await request(app)
        .get(`/api/teams/${testTeam._id}/logo?size=small`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.team.logo.url).toContain('-32'); // Small size suffix
    });

    it('should return 404 for team without logo', async () => {
      const teamWithoutLogo = await Team.create({
        name: 'No Logo Team',
        game: 'dota2'
      });

      const res = await request(app)
        .get(`/api/teams/${teamWithoutLogo._id}/logo`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Team has no logo');
      expect(res.body.team).toBeDefined(); // Should still return team info
    });

    it('should return 404 for non-existent team', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/teams/${fakeId}/logo`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Team not found');
    });
  });
});