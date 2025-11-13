/**
 * Logo System Performance Test Script
 * Tests concurrent uploads, loading performance, and system capacity
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class LogoPerformanceTest {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:5001';
    this.testResults = {
      uploadTests: [],
      loadTests: [],
      concurrencyTests: [],
      memoryUsage: []
    };
  }

  /**
   * Create test images of various sizes
   */
  async createTestImages() {
    const testDir = path.join(__dirname, '../__tests__/performance');
    await fs.mkdir(testDir, { recursive: true });

    const sizes = [
      { name: 'small', width: 64, height: 64 },
      { name: 'medium', width: 256, height: 256 },
      { name: 'large', width: 512, height: 512 },
      { name: 'xlarge', width: 1024, height: 1024 }
    ];

    const images = {};

    for (const size of sizes) {
      const imagePath = path.join(testDir, `test-${size.name}.png`);
      
      await sharp({
        create: {
          width: size.width,
          height: size.height,
          channels: 4,
          background: { r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255), alpha: 1 }
        }
      })
      .png()
      .toFile(imagePath);

      images[size.name] = imagePath;
    }

    return images;
  }

  /**
   * Test upload performance with different image sizes
   */
  async testUploadPerformance(images, authToken) {
    console.log('🚀 Testing upload performance...');
    
    for (const [sizeName, imagePath] of Object.entries(images)) {
      const startTime = Date.now();
      
      try {
        // Create FormData for file upload
        const FormData = require('form-data');
        const form = new FormData();
        const fileBuffer = await fs.readFile(imagePath);
        form.append('logo', fileBuffer, `test-${sizeName}.png`);

        const response = await axios.post(
          `${this.baseUrl}/api/admin/teams/507f1f77bcf86cd799439011/logo`,
          form,
          {
            headers: {
              ...form.getHeaders(),
              'Authorization': `Bearer ${authToken}`
            },
            timeout: 30000
          }
        );

        const endTime = Date.now();
        const duration = endTime - startTime;

        this.testResults.uploadTests.push({
          size: sizeName,
          duration,
          success: response.status === 200,
          fileSize: (await fs.stat(imagePath)).size,
          hasWebP: response.data?.team?.logo?.webp ? true : false
        });

        console.log(`  ✅ ${sizeName}: ${duration}ms (WebP: ${response.data?.team?.logo?.webp ? 'Yes' : 'No'})`);
      } catch (error) {
        console.log(`  ❌ ${sizeName}: Failed - ${error.message}`);
        this.testResults.uploadTests.push({
          size: sizeName,
          duration: Date.now() - startTime,
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * Test concurrent uploads
   */
  async testConcurrentUploads(imagePath, authToken, concurrency = 5) {
    console.log(`🔄 Testing ${concurrency} concurrent uploads...`);
    
    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < concurrency; i++) {
      const FormData = require('form-data');
      const form = new FormData();
      const fileBuffer = await fs.readFile(imagePath);
      form.append('logo', fileBuffer, `concurrent-test-${i}.png`);

      const promise = axios.post(
        `${this.baseUrl}/api/admin/teams/507f1f77bcf86cd799439011/logo`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${authToken}`
          },
          timeout: 30000
        }
      ).then(response => ({
        success: true,
        status: response.status,
        hasWebP: response.data?.team?.logo?.webp ? true : false
      })).catch(error => ({
        success: false,
        error: error.message
      }));

      promises.push(promise);
    }

    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    this.testResults.concurrencyTests.push({
      concurrency,
      totalDuration,
      successCount,
      failureCount: concurrency - successCount,
      averageTime: totalDuration / concurrency
    });

    console.log(`  ✅ ${successCount}/${concurrency} successful in ${totalDuration}ms (avg: ${Math.round(totalDuration / concurrency)}ms)`);
  }

  /**
   * Test logo loading performance
   */
  async testLoadPerformance() {
    console.log('📥 Testing logo loading performance...');
    
    const sizes = ['small', 'medium', 'large'];
    
    for (const size of sizes) {
      const startTime = Date.now();
      
      try {
        const response = await axios.get(
          `${this.baseUrl}/api/teams/507f1f77bcf86cd799439011/logo?size=${size}`,
          {
            headers: {
              'Accept': 'image/webp,image/*,*/*;q=0.8'
            },
            timeout: 10000
          }
        );

        const endTime = Date.now();
        const duration = endTime - startTime;

        this.testResults.loadTests.push({
          size,
          duration,
          success: response.status === 200,
          hasWebP: response.data?.team?.logo?.supportsWebP || false,
          cacheHeaders: {
            cacheControl: response.headers['cache-control'],
            etag: response.headers['etag'],
            lastModified: response.headers['last-modified']
          }
        });

        console.log(`  ✅ ${size}: ${duration}ms (WebP: ${response.data?.team?.logo?.supportsWebP ? 'Yes' : 'No'})`);
      } catch (error) {
        console.log(`  ❌ ${size}: Failed - ${error.message}`);
        this.testResults.loadTests.push({
          size,
          duration: Date.now() - startTime,
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * Monitor memory usage during tests
   */
  recordMemoryUsage(testName) {
    const usage = process.memoryUsage();
    this.testResults.memoryUsage.push({
      testName,
      timestamp: Date.now(),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024) // MB
    });
  }

  /**
   * Generate performance report
   */
  generateReport() {
    console.log('\n📊 PERFORMANCE REPORT');
    console.log('='.repeat(50));

    // Upload Performance
    console.log('\n📤 Upload Performance:');
    this.testResults.uploadTests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      const webp = test.hasWebP ? '(+WebP)' : '';
      console.log(`  ${status} ${test.size}: ${test.duration}ms ${webp}`);
    });

    // Load Performance
    console.log('\n📥 Load Performance:');
    this.testResults.loadTests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      const cache = test.cacheHeaders?.cacheControl ? '(Cached)' : '';
      console.log(`  ${status} ${test.size}: ${test.duration}ms ${cache}`);
    });

    // Concurrency Tests
    console.log('\n🔄 Concurrency Tests:');
    this.testResults.concurrencyTests.forEach(test => {
      console.log(`  ${test.concurrency} concurrent: ${test.successCount}/${test.concurrency} success, avg ${Math.round(test.averageTime)}ms`);
    });

    // Memory Usage
    console.log('\n💾 Memory Usage:');
    this.testResults.memoryUsage.forEach(usage => {
      console.log(`  ${usage.testName}: ${usage.heapUsed}MB heap, ${usage.rss}MB RSS`);
    });

    // Performance Summary
    const avgUploadTime = this.testResults.uploadTests.reduce((sum, test) => sum + (test.duration || 0), 0) / this.testResults.uploadTests.length;
    const avgLoadTime = this.testResults.loadTests.reduce((sum, test) => sum + (test.duration || 0), 0) / this.testResults.loadTests.length;
    const webpSupport = this.testResults.uploadTests.filter(test => test.hasWebP).length;

    console.log('\n📈 SUMMARY:');
    console.log(`  Average Upload Time: ${Math.round(avgUploadTime)}ms`);
    console.log(`  Average Load Time: ${Math.round(avgLoadTime)}ms`);
    console.log(`  WebP Generation: ${webpSupport}/${this.testResults.uploadTests.length} tests`);
    console.log(`  Upload Success Rate: ${(this.testResults.uploadTests.filter(t => t.success).length / this.testResults.uploadTests.length * 100).toFixed(1)}%`);
    console.log(`  Load Success Rate: ${(this.testResults.loadTests.filter(t => t.success).length / this.testResults.loadTests.length * 100).toFixed(1)}%`);

    return this.testResults;
  }

  /**
   * Clean up test files
   */
  async cleanup() {
    try {
      const testDir = path.join(__dirname, '../__tests__/performance');
      const files = await fs.readdir(testDir);
      await Promise.all(files.map(file => fs.unlink(path.join(testDir, file))));
      await fs.rmdir(testDir);
    } catch (error) {
      // Directory might not exist
    }
  }

  /**
   * Run all performance tests
   */
  async runAllTests(authToken) {
    console.log('🎯 Starting Logo System Performance Tests\n');
    
    this.recordMemoryUsage('start');

    try {
      // Create test images
      const images = await this.createTestImages();
      this.recordMemoryUsage('after-image-creation');

      // Test upload performance
      await this.testUploadPerformance(images, authToken);
      this.recordMemoryUsage('after-upload-tests');

      // Test concurrent uploads
      await this.testConcurrentUploads(images.medium, authToken, 3);
      this.recordMemoryUsage('after-concurrency-tests');

      // Test load performance
      await this.testLoadPerformance();
      this.recordMemoryUsage('after-load-tests');

      // Generate report
      const results = this.generateReport();

      // Cleanup
      await this.cleanup();

      return results;
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      await this.cleanup();
      throw error;
    }
  }
}

// Export for use in tests or run directly
module.exports = LogoPerformanceTest;

// Run if called directly
if (require.main === module) {
  const authToken = process.env.TEST_AUTH_TOKEN || 'test-token';
  
  const test = new LogoPerformanceTest();
  test.runAllTests(authToken)
    .then(() => {
      console.log('\n✅ Performance tests completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Performance tests failed:', error.message);
      process.exit(1);
    });
}