const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

// Create a simple test app
const app = express();
app.use(express.json());

// Mock database and auth middleware for integration test
const mockTeam = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Team',
  game: 'dota2',
  logo: null,
  save: jest.fn().mockResolvedValue(true)
};

// Mock Team model
jest.mock('../../models/teamModel', () => ({
  findById: jest.fn().mockResolvedValue(mockTeam)
}));

// Mock auth middleware
jest.mock('../../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'admin123', role: 'admin' };
    next();
  },
  admin: (req, res, next) => next()
}));

// Import routes after mocking
const logoRoutes = require('../../routes/logoRoutes');
app.use('/api', logoRoutes);

describe('Logo System Integration Test', () => {
  const testImagePath = path.join(__dirname, '../fixtures/test-logo.png');
  const uploadsDir = path.join(__dirname, '../../uploads/team-logos');

  beforeAll(async () => {
    // Ensure uploads directory exists
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Ensure fixtures directory exists
    const fixturesDir = path.dirname(testImagePath);
    try {
      await fs.mkdir(fixturesDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Create a simple test image using Sharp
    await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    })
    .png()
    .toFile(testImagePath);
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(testImagePath);
    } catch (error) {
      // File might not exist
    }

    // Clean up uploads directory
    try {
      const files = await fs.readdir(uploadsDir);
      await Promise.all(files.map(file => 
        fs.unlink(path.join(uploadsDir, file)).catch(() => {})
      ));
    } catch (error) {
      // Directory might not exist
    }
  });

  test('complete logo workflow: upload, retrieve, and serve with optimizations', async () => {
    // Step 1: Upload logo
    const uploadResponse = await request(app)
      .post(`/api/admin/teams/${mockTeam._id}/logo`)
      .attach('logo', testImagePath)
      .expect(200);

    expect(uploadResponse.body.success).toBe(true);
    expect(uploadResponse.body.team.logo).toBeDefined();
    expect(uploadResponse.body.team.logo.sizes).toBeDefined();
    expect(uploadResponse.body.team.logo.webp).toBeDefined();

    // Verify WebP files were created
    expect(uploadResponse.body.team.logo.webp.small).toContain('.webp');
    expect(uploadResponse.body.team.logo.webp.medium).toContain('.webp');
    expect(uploadResponse.body.team.logo.webp.large).toContain('.webp');

    // Step 2: Retrieve logo information
    const getResponse = await request(app)
      .get(`/api/teams/${mockTeam._id}/logo`)
      .set('Accept', 'image/webp,image/*,*/*;q=0.8')
      .expect(200);

    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.team.logo.url).toBeDefined();
    expect(getResponse.body.team.logo.fallbackUrl).toBeDefined();
    expect(getResponse.body.team.logo.supportsWebP).toBeDefined();

    // Step 3: Verify caching headers are set
    expect(getResponse.headers['cache-control']).toContain('public');
    expect(getResponse.headers['etag']).toBeDefined();
    expect(getResponse.headers['last-modified']).toBeDefined();
    expect(getResponse.headers['vary']).toContain('Accept');

    // Step 4: Test different size requests
    const smallLogoResponse = await request(app)
      .get(`/api/teams/${mockTeam._id}/logo?size=small`)
      .expect(200);

    expect(smallLogoResponse.body.team.logo.url).toContain('-32');

    const largeLogoResponse = await request(app)
      .get(`/api/teams/${mockTeam._id}/logo?size=large`)
      .expect(200);

    expect(largeLogoResponse.body.team.logo.url).toContain('-128');

    // Step 5: Verify files exist on filesystem
    const logoData = uploadResponse.body.team.logo;
    const originalFile = path.join(uploadsDir, path.basename(logoData.originalUrl));
    const smallFile = path.join(uploadsDir, path.basename(logoData.sizes.small));
    const webpFile = path.join(uploadsDir, path.basename(logoData.webp.small));

    await expect(fs.access(originalFile)).resolves.toBeUndefined();
    await expect(fs.access(smallFile)).resolves.toBeUndefined();
    await expect(fs.access(webpFile)).resolves.toBeUndefined();

    // Step 6: Test logo deletion
    const deleteResponse = await request(app)
      .delete(`/api/admin/teams/${mockTeam._id}/logo`)
      .expect(200);

    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toBe('Logo deleted successfully');
  });

  test('handles WebP content negotiation correctly', async () => {
    // Upload a logo first
    await request(app)
      .post(`/api/admin/teams/${mockTeam._id}/logo`)
      .attach('logo', testImagePath)
      .expect(200);

    // Request with WebP support
    const webpResponse = await request(app)
      .get(`/api/teams/${mockTeam._id}/logo`)
      .set('Accept', 'image/webp,image/*,*/*;q=0.8')
      .expect(200);

    expect(webpResponse.body.team.logo.supportsWebP).toBe(true);
    expect(webpResponse.body.team.logo.url).toContain('.webp');

    // Request without WebP support
    const pngResponse = await request(app)
      .get(`/api/teams/${mockTeam._id}/logo`)
      .set('Accept', 'image/png,image/*,*/*;q=0.8')
      .expect(200);

    expect(pngResponse.body.team.logo.fallbackUrl).toBeDefined();
  });

  test('performance: handles multiple concurrent uploads', async () => {
    const concurrentUploads = Array.from({ length: 3 }, (_, i) => 
      request(app)
        .post(`/api/admin/teams/${mockTeam._id}/logo`)
        .attach('logo', testImagePath)
    );

    const responses = await Promise.all(concurrentUploads);
    
    // All uploads should succeed (last one wins)
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});