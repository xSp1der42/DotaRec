const fs = require('fs').promises;
const path = require('path');
const imageProcessingService = require('../../services/imageProcessingService');
require('../setup');

describe('Image Processing Service Tests', () => {
  let fixturesDir;
  let testImagePath;
  let outputDir;

  beforeAll(async () => {
    // Create fixtures and output directories
    fixturesDir = path.join(__dirname, '../fixtures');
    outputDir = path.join(__dirname, '../output');
    
    await fs.mkdir(fixturesDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    testImagePath = path.join(fixturesDir, 'test-image.png');

    // Create a valid PNG image for testing (64x64 transparent PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x40, 0x08, 0x06, 0x00, 0x00, 0x00, 0xAA, 0x69, 0x71,
      0xDE, 0x00, 0x00, 0x00, 0x19, 0x74, 0x45, 0x58, 0x74, 0x53, 0x6F, 0x66, 0x74, 0x77, 0x61, 0x72,
      0x65, 0x00, 0x41, 0x64, 0x6F, 0x62, 0x65, 0x20, 0x49, 0x6D, 0x61, 0x67, 0x65, 0x52, 0x65, 0x61,
      0x64, 0x79, 0x71, 0xC9, 0x65, 0x3C, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x78, 0xDA,
      0x62, 0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x04, 0x00, 0x01, 0x27, 0x5C, 0x22, 0xEC, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    await fs.writeFile(testImagePath, pngBuffer);
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.rm(fixturesDir, { recursive: true, force: true });
      await fs.rm(outputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    // Clean up generated files after each test
    try {
      const files = await fs.readdir(outputDir);
      for (const file of files) {
        await fs.unlink(path.join(outputDir, file));
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('validateImage', () => {
    it('should validate a valid PNG image', async () => {
      const metadata = await imageProcessingService.validateImage(testImagePath);
      
      expect(metadata).toBeDefined();
      expect(metadata.width).toBe(64);
      expect(metadata.height).toBe(64);
      expect(metadata.format).toBe('png');
    });

    it('should reject image smaller than 32x32', async () => {
      const smallImagePath = path.join(fixturesDir, 'small-image.png');
      
      // Create a 16x16 image (transparent PNG)
      const smallPngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF,
        0x61, 0x00, 0x00, 0x00, 0x19, 0x74, 0x45, 0x58, 0x74, 0x53, 0x6F, 0x66, 0x74, 0x77, 0x61, 0x72,
        0x65, 0x00, 0x41, 0x64, 0x6F, 0x62, 0x65, 0x20, 0x49, 0x6D, 0x61, 0x67, 0x65, 0x52, 0x65, 0x61,
        0x64, 0x79, 0x71, 0xC9, 0x65, 0x3C, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x78, 0xDA,
        0x62, 0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x04, 0x00, 0x01, 0x27, 0x5C, 0x22, 0xEC, 0x00, 0x00,
        0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      await fs.writeFile(smallImagePath, smallPngBuffer);

      await expect(imageProcessingService.validateImage(smallImagePath))
        .rejects.toThrow('Image too small: Minimum size is 32x32 pixels');

      await fs.unlink(smallImagePath);
    });

    it('should reject non-image file', async () => {
      const textFilePath = path.join(fixturesDir, 'text-file.txt');
      await fs.writeFile(textFilePath, 'This is not an image');

      await expect(imageProcessingService.validateImage(textFilePath))
        .rejects.toThrow('Invalid image file');

      await fs.unlink(textFilePath);
    });

    it('should reject non-existent file', async () => {
      const nonExistentPath = path.join(fixturesDir, 'non-existent.png');

      await expect(imageProcessingService.validateImage(nonExistentPath))
        .rejects.toThrow();
    });
  });

  describe('generateLogoSizes', () => {
    it('should generate multiple logo sizes', async () => {
      const teamId = 'test-team-123';
      const outputPath = path.join(outputDir, 'team-test-team-123.png');
      
      // Copy test image to output directory
      await fs.copyFile(testImagePath, outputPath);

      const generatedFiles = await imageProcessingService.generateLogoSizes(outputPath, teamId);

      expect(generatedFiles).toBeDefined();
      expect(generatedFiles.original).toBe(outputPath);
      expect(generatedFiles.small).toBeDefined();
      expect(generatedFiles.medium).toBeDefined();
      expect(generatedFiles.large).toBeDefined();

      // Verify files were created
      const smallExists = await fs.access(generatedFiles.small).then(() => true).catch(() => false);
      const mediumExists = await fs.access(generatedFiles.medium).then(() => true).catch(() => false);
      const largeExists = await fs.access(generatedFiles.large).then(() => true).catch(() => false);

      expect(smallExists).toBe(true);
      expect(mediumExists).toBe(true);
      expect(largeExists).toBe(true);

      // Verify file naming convention
      expect(generatedFiles.small).toContain('-32');
      expect(generatedFiles.medium).toContain('-64');
      expect(generatedFiles.large).toContain('-128');
    });

    it('should handle invalid input file', async () => {
      const teamId = 'test-team-456';
      const invalidPath = path.join(outputDir, 'non-existent.png');

      await expect(imageProcessingService.generateLogoSizes(invalidPath, teamId))
        .rejects.toThrow('Failed to process image');
    });
  });

  describe('getLogoUrls', () => {
    it('should convert file paths to URLs', () => {
      const filePaths = {
        original: '/path/to/uploads/team-logos/team-123-original.png',
        small: '/path/to/uploads/team-logos/team-123-32.png',
        medium: '/path/to/uploads/team-logos/team-123-64.png',
        large: '/path/to/uploads/team-logos/team-123-128.png'
      };

      const urls = imageProcessingService.getLogoUrls(filePaths);

      expect(urls.original).toBe('/uploads/team-logos/team-123-original.png');
      expect(urls.small).toBe('/uploads/team-logos/team-123-32.png');
      expect(urls.medium).toBe('/uploads/team-logos/team-123-64.png');
      expect(urls.large).toBe('/uploads/team-logos/team-123-128.png');
    });

    it('should handle empty or null paths', () => {
      const filePaths = {
        original: '/path/to/uploads/team-logos/team-123-original.png',
        small: null,
        medium: '',
        large: undefined
      };

      const urls = imageProcessingService.getLogoUrls(filePaths);

      expect(urls.original).toBe('/uploads/team-logos/team-123-original.png');
      expect(urls.small).toBeUndefined();
      expect(urls.medium).toBeUndefined();
      expect(urls.large).toBeUndefined();
    });
  });

  describe('cleanupFiles', () => {
    it('should delete specified files', async () => {
      // Create test files
      const file1 = path.join(outputDir, 'test-file-1.png');
      const file2 = path.join(outputDir, 'test-file-2.png');
      
      await fs.writeFile(file1, 'test content 1');
      await fs.writeFile(file2, 'test content 2');

      // Verify files exist
      const file1ExistsBefore = await fs.access(file1).then(() => true).catch(() => false);
      const file2ExistsBefore = await fs.access(file2).then(() => true).catch(() => false);
      expect(file1ExistsBefore).toBe(true);
      expect(file2ExistsBefore).toBe(true);

      // Clean up files
      await imageProcessingService.cleanupFiles([file1, file2]);

      // Verify files were deleted
      const file1ExistsAfter = await fs.access(file1).then(() => true).catch(() => false);
      const file2ExistsAfter = await fs.access(file2).then(() => true).catch(() => false);
      expect(file1ExistsAfter).toBe(false);
      expect(file2ExistsAfter).toBe(false);
    });

    it('should handle non-existent files gracefully', async () => {
      const nonExistentFiles = [
        path.join(outputDir, 'non-existent-1.png'),
        path.join(outputDir, 'non-existent-2.png')
      ];

      // Should not throw error
      await expect(imageProcessingService.cleanupFiles(nonExistentFiles))
        .resolves.not.toThrow();
    });

    it('should handle empty file list', async () => {
      await expect(imageProcessingService.cleanupFiles([]))
        .resolves.not.toThrow();
    });
  });

  describe('optimizeForWeb', () => {
    it('should optimize image for web display', async () => {
      const outputPath = path.join(outputDir, 'optimized-image.png');

      await imageProcessingService.optimizeForWeb(testImagePath, outputPath);

      // Verify optimized file was created
      const optimizedExists = await fs.access(outputPath).then(() => true).catch(() => false);
      expect(optimizedExists).toBe(true);

      // Verify file has content
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should handle invalid input file', async () => {
      const invalidPath = path.join(fixturesDir, 'non-existent.png');
      const outputPath = path.join(outputDir, 'optimized-invalid.png');

      await expect(imageProcessingService.optimizeForWeb(invalidPath, outputPath))
        .rejects.toThrow('Failed to optimize image');
    });
  });
});