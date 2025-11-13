const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageProcessingService {
  /**
   * Generate multiple sizes of team logo with WebP optimization
   * @param {String} inputPath - Path to original uploaded file
   * @param {String} teamId - Team ID for naming
   * @returns {Promise<Object>} Object containing paths to different sizes and formats
   */
  async generateLogoSizes(inputPath, teamId) {
    try {
      const inputBuffer = await fs.readFile(inputPath);
      const ext = path.extname(inputPath);
      const baseName = `team-${teamId}`;
      const outputDir = path.dirname(inputPath);

      // Define sizes as per requirement 5.2
      const sizes = {
        small: { width: 32, height: 32, suffix: '-32' },
        medium: { width: 64, height: 64, suffix: '-64' },
        large: { width: 128, height: 128, suffix: '-128' }
      };

      const generatedFiles = {
        original: inputPath,
        webp: {} // Store WebP versions for modern browsers
      };

      // Generate each size in both PNG and WebP formats
      for (const [sizeName, config] of Object.entries(sizes)) {
        const pngPath = path.join(outputDir, `${baseName}${config.suffix}${ext}`);
        const webpPath = path.join(outputDir, `${baseName}${config.suffix}.webp`);
        
        // Generate PNG version with optimized settings
        const sharpInstance = sharp(inputBuffer);
        
        await sharpInstance
          .clone()
          .resize(config.width, config.height, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
          })
          .png({ 
            quality: 85, // Slightly reduced for better compression
            compressionLevel: 9, // Maximum compression
            progressive: true,
            adaptiveFiltering: true
          })
          .toFile(pngPath);

        // Generate WebP version for modern browsers (requirement 5.1, 5.3)
        await sharpInstance
          .clone()
          .resize(config.width, config.height, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .webp({ 
            quality: 80, // WebP can achieve better quality at lower settings
            effort: 6, // Higher effort for better compression
            lossless: false
          })
          .toFile(webpPath);

        generatedFiles[sizeName] = pngPath;
        generatedFiles.webp[sizeName] = webpPath;
      }

      return generatedFiles;
    } catch (error) {
      console.error('Error generating logo sizes:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  /**
   * Validate image file using Sharp (additional validation beyond multer)
   * @param {String} filePath - Path to uploaded file
   * @returns {Promise<Object>} Image metadata
   */
  async validateImage(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      
      // Basic validation
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image: Unable to read dimensions');
      }

      // Check minimum dimensions (logos should be at least 32x32)
      if (metadata.width < 32 || metadata.height < 32) {
        throw new Error('Image too small: Minimum size is 32x32 pixels');
      }

      // Check maximum dimensions (reasonable limit for logos)
      if (metadata.width > 2048 || metadata.height > 2048) {
        throw new Error('Image too large: Maximum size is 2048x2048 pixels');
      }

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        hasAlpha: metadata.hasAlpha
      };
    } catch (error) {
      console.error('Error validating image:', error);
      throw new Error(`Invalid image file: ${error.message}`);
    }
  }

  /**
   * Clean up generated logo files including WebP versions
   * @param {Array<String>} filePaths - Array of file paths to delete
   * @returns {Promise<void>}
   */
  async cleanupFiles(filePaths) {
    try {
      const deletePromises = filePaths.map(async (filePath) => {
        try {
          await fs.unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (error) {
          console.error(`Failed to delete file ${filePath}:`, error.message);
        }
      });

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error during file cleanup:', error);
    }
  }

  /**
   * Get all file paths from logo object for cleanup (including WebP)
   * @param {Object} logoObject - Logo object from team document
   * @returns {Array<String>} Array of file paths to clean up
   */
  getCleanupPaths(logoObject) {
    const paths = [];
    
    if (logoObject.originalUrl) {
      paths.push(path.join(__dirname, '../uploads/team-logos', path.basename(logoObject.originalUrl)));
    }
    
    if (logoObject.sizes) {
      Object.values(logoObject.sizes).forEach(url => {
        if (url) {
          paths.push(path.join(__dirname, '../uploads/team-logos', path.basename(url)));
        }
      });
    }
    
    if (logoObject.webp) {
      Object.values(logoObject.webp).forEach(url => {
        if (url) {
          paths.push(path.join(__dirname, '../uploads/team-logos', path.basename(url)));
        }
      });
    }
    
    return paths;
  }

  /**
   * Get relative URL paths for generated logo files including WebP versions
   * @param {Object} filePaths - Object containing file paths
   * @returns {Object} Object containing relative URLs for both PNG and WebP
   */
  getLogoUrls(filePaths) {
    const baseUrl = '/uploads/team-logos/';
    const urls = {
      webp: {} // Store WebP URLs separately
    };

    // Process regular PNG files
    for (const [sizeName, filePath] of Object.entries(filePaths)) {
      if (filePath && sizeName !== 'webp') {
        const fileName = path.basename(filePath);
        urls[sizeName] = `${baseUrl}${fileName}`;
      }
    }

    // Process WebP files
    if (filePaths.webp) {
      for (const [sizeName, webpPath] of Object.entries(filePaths.webp)) {
        if (webpPath) {
          const fileName = path.basename(webpPath);
          urls.webp[sizeName] = `${baseUrl}${fileName}`;
        }
      }
    }

    return urls;
  }

  /**
   * Optimize existing image for web display
   * @param {String} inputPath - Path to input image
   * @param {String} outputPath - Path for optimized output
   * @returns {Promise<void>}
   */
  async optimizeForWeb(inputPath, outputPath) {
    try {
      await sharp(inputPath)
        .png({ 
          quality: 90, 
          compressionLevel: 6,
          progressive: true 
        })
        .toFile(outputPath);
    } catch (error) {
      console.error('Error optimizing image:', error);
      throw new Error(`Failed to optimize image: ${error.message}`);
    }
  }
}

module.exports = new ImageProcessingService();