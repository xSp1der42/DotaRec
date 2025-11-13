/**
 * Logo Performance Tests
 * Tests image processing performance and memory usage
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const imageProcessingService = require('../../services/imageProcessingService');

describe('Logo Performance Tests', () => {
  const testDir = path.join(__dirname, 'temp');
  let testImages = {};

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });

    // Create test images of different sizes
    const sizes = [
      { name: 'small', width: 64, height: 64 },
      { name: 'medium', width: 256, height: 256 },
      { name: 'large', width: 512, height: 512 },
      { name: 'xlarge', width: 1024, height: 1024 }
    ];

    for (const size of sizes) {
      const imagePath = path.join(testDir, `test-${size.name}.png`);
      
      await sharp({
        create: {
          width: size.width,
          height: size.height,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
      .png()
      .toFile(imagePath);

      testImages[size.name] = imagePath;
    }
  });

  afterAll(async () => {
    // Clean up test files
    try {
      const files = await fs.readdir(testDir);
      await Promise.all(files.map(file => fs.unlink(path.join(testDir, file))));
      await fs.rmdir(testDir);
    } catch (error) {
      // Directory might not exist
    }
  });

  test('image processing performance with different sizes', async () => {
    const results = {};

    for (const [sizeName, imagePath] of Object.entries(testImages)) {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();

      try {
        const generatedFiles = await imageProcessingService.generateLogoSizes(imagePath, 'perf-test');
        
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        
        const duration = endTime - startTime;
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

        results[sizeName] = {
          duration,
          memoryDelta: Math.round(memoryDelta / 1024 / 1024), // MB
          success: true,
          filesGenerated: Object.keys(generatedFiles).length,
          hasWebP: generatedFiles.webp ? Object.keys(generatedFiles.webp).length : 0
        };

        // Verify WebP files were created
        expect(generatedFiles.webp).toBeDefined();
        expect(generatedFiles.webp.small).toBeDefined();
        expect(generatedFiles.webp.medium).toBeDefined();
        expect(generatedFiles.webp.large).toBeDefined();

        // Clean up generated files
        const allFiles = [
          generatedFiles.original,
          ...Object.values(generatedFiles.sizes || {}),
          ...Object.values(generatedFiles.webp || {})
        ].filter(Boolean);

        await imageProcessingService.cleanupFiles(allFiles);

      } catch (error) {
        results[sizeName] = {
          duration: Date.now() - startTime,
          success: false,
          error: error.message
        };
      }
    }

    // Log performance results
    console.log('\n📊 Image Processing Performance:');
    Object.entries(results).forEach(([size, result]) => {
      if (result.success) {
        console.log(`  ${size}: ${result.duration}ms, ${result.memoryDelta}MB, ${result.hasWebP} WebP files`);
      } else {
        console.log(`  ${size}: FAILED - ${result.error}`);
      }
    });

    // Performance assertions
    expect(results.small.success).toBe(true);
    expect(results.medium.success).toBe(true);
    expect(results.large.success).toBe(true);
    
    // Performance benchmarks (reasonable limits)
    expect(results.small.duration).toBeLessThan(2000); // 2 seconds for small images
    expect(results.medium.duration).toBeLessThan(5000); // 5 seconds for medium images
    expect(results.large.duration).toBeLessThan(10000); // 10 seconds for large images
    
    // Memory usage should be reasonable (less than 100MB delta per operation)
    expect(Math.abs(results.small.memoryDelta)).toBeLessThan(100);
    expect(Math.abs(results.medium.memoryDelta)).toBeLessThan(100);
  });

  test('concurrent image processing', async () => {
    const concurrency = 3;
    const imagePath = testImages.medium;
    
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    const promises = Array.from({ length: concurrency }, (_, i) => 
      imageProcessingService.generateLogoSizes(imagePath, `concurrent-${i}`)
    );

    const results = await Promise.allSettled(promises);
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    const totalDuration = endTime - startTime;
    const memoryDelta = Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    console.log(`\n🔄 Concurrent Processing (${concurrency} images):`);
    console.log(`  Success: ${successCount}/${concurrency}`);
    console.log(`  Total time: ${totalDuration}ms`);
    console.log(`  Average time: ${Math.round(totalDuration / concurrency)}ms`);
    console.log(`  Memory delta: ${memoryDelta}MB`);

    // Clean up generated files
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const generatedFiles = result.value;
        const allFiles = [
          generatedFiles.original,
          ...Object.values(generatedFiles.sizes || {}),
          ...Object.values(generatedFiles.webp || {})
        ].filter(Boolean);
        
        await imageProcessingService.cleanupFiles(allFiles);
      }
    }

    // Assertions
    expect(successCount).toBe(concurrency);
    expect(totalDuration).toBeLessThan(15000); // Should complete within 15 seconds
    expect(memoryDelta).toBeLessThan(200); // Memory usage should be reasonable
  });

  test('WebP compression efficiency', async () => {
    const imagePath = testImages.medium;
    
    const generatedFiles = await imageProcessingService.generateLogoSizes(imagePath, 'webp-test');
    
    // Get file sizes
    const pngSize = (await fs.stat(generatedFiles.medium)).size;
    const webpSize = (await fs.stat(generatedFiles.webp.medium)).size;
    
    const compressionRatio = ((pngSize - webpSize) / pngSize * 100).toFixed(1);
    
    console.log(`\n📦 WebP Compression Efficiency:`);
    console.log(`  PNG size: ${Math.round(pngSize / 1024)}KB`);
    console.log(`  WebP size: ${Math.round(webpSize / 1024)}KB`);
    console.log(`  Compression: ${compressionRatio}% smaller`);

    // Clean up
    const allFiles = [
      generatedFiles.original,
      ...Object.values(generatedFiles.sizes || {}),
      ...Object.values(generatedFiles.webp || {})
    ].filter(Boolean);
    
    await imageProcessingService.cleanupFiles(allFiles);

    // WebP should be smaller than PNG (at least 10% compression)
    expect(webpSize).toBeLessThan(pngSize);
    expect(parseFloat(compressionRatio)).toBeGreaterThan(10);
  });

  test('memory cleanup after processing', async () => {
    const initialMemory = process.memoryUsage();
    
    // Process multiple images
    for (let i = 0; i < 5; i++) {
      const generatedFiles = await imageProcessingService.generateLogoSizes(testImages.medium, `cleanup-test-${i}`);
      
      // Clean up immediately
      const allFiles = [
        generatedFiles.original,
        ...Object.values(generatedFiles.sizes || {}),
        ...Object.values(generatedFiles.webp || {})
      ].filter(Boolean);
      
      await imageProcessingService.cleanupFiles(allFiles);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage();
    const memoryDelta = Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024);
    
    console.log(`\n🧹 Memory Cleanup Test:`);
    console.log(`  Initial memory: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
    console.log(`  Final memory: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
    console.log(`  Delta: ${memoryDelta}MB`);

    // Memory should not grow significantly (less than 50MB)
    expect(Math.abs(memoryDelta)).toBeLessThan(50);
  });
});