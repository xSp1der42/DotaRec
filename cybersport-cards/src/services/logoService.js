import api from './api';

/**
 * LogoService - Manages team logo loading, caching, and preloading with WebP support
 * Implements requirements 4.5, 5.1, 5.2, 5.3, and 5.5 for logo caching and optimization
 */
class LogoService {
  constructor() {
    // In-memory cache for loaded logos
    this.cache = new Map();
    
    // Cache for failed logo loads to avoid repeated requests
    this.failedCache = new Set();
    
    // Preloading queue and status
    this.preloadQueue = new Set();
    this.isPreloading = false;
    
    // Cache expiration time (1 hour for better performance)
    this.cacheExpiration = 60 * 60 * 1000;
    
    // WebP support detection
    this.supportsWebP = this.detectWebPSupport();
  }

  /**
   * Detect WebP support in the browser
   * @returns {boolean} True if browser supports WebP
   * @private
   */
  detectWebPSupport() {
    try {
      // Check if we're in a test environment
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
        return true; // Assume WebP support in tests
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get team logo URL with WebP support and enhanced caching
   * @param {string} teamId - Team ID
   * @param {string} size - Logo size (small, medium, large)
   * @param {boolean} preferWebP - Force WebP format if available
   * @returns {Promise<Object|null>} Logo object with URL and metadata or null if not available
   */
  async getTeamLogo(teamId, size = 'medium', preferWebP = true) {
    if (!teamId) {
      return null;
    }

    const cacheKey = `${teamId}-${size}-${preferWebP && this.supportsWebP ? 'webp' : 'png'}`;
    
    // Check if logo failed to load recently
    if (this.failedCache.has(cacheKey)) {
      return null;
    }

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      // Fetch logo from API with WebP preference
      const params = { size };
      if (preferWebP && this.supportsWebP) {
        params.format = 'webp';
      }

      const response = await api.get(`/api/teams/${teamId}/logo`, {
        params,
        timeout: 5000,
        headers: {
          'Accept': this.supportsWebP ? 'image/webp,image/*,*/*;q=0.8' : 'image/*,*/*;q=0.8'
        }
      });

      const logoData = response.data?.team?.logo;
      
      if (logoData && logoData.url) {
        const logoObject = {
          url: logoData.url,
          fallbackUrl: logoData.fallbackUrl,
          supportsWebP: logoData.supportsWebP,
          teamName: response.data.team.name,
          uploadedAt: logoData.uploadedAt
        };

        // Cache the successful result with longer expiration for performance
        this.cache.set(cacheKey, {
          data: logoObject,
          timestamp: Date.now()
        });
        
        return logoObject;
      } else {
        // Cache the failure to avoid repeated requests
        this.failedCache.add(cacheKey);
        // Remove from failed cache after 2 minutes
        setTimeout(() => this.failedCache.delete(cacheKey), 120000);
        return null;
      }
    } catch (error) {
      console.warn(`Failed to load logo for team ${teamId}:`, error.errorMessage || error.message);
      
      // Cache the failure for network/server errors
      if (error.isNetworkError || error.isServerError) {
        this.failedCache.add(cacheKey);
        setTimeout(() => this.failedCache.delete(cacheKey), 120000);
      }
      
      return null;
    }
  }

  /**
   * Get team logo URL (backward compatibility method)
   * @param {string} teamId - Team ID
   * @param {string} size - Logo size
   * @returns {Promise<string|null>} Logo URL or null
   */
  async getTeamLogoUrl(teamId, size = 'medium') {
    const logoData = await this.getTeamLogo(teamId, size);
    return logoData ? logoData.url : null;
  }

  /**
   * Preload logos for multiple teams with WebP optimization
   * @param {string[]} teamIds - Array of team IDs to preload
   * @param {string} size - Logo size to preload
   * @param {boolean} preferWebP - Prefer WebP format for preloading
   * @returns {Promise<void>}
   */
  async preloadLogos(teamIds, size = 'medium', preferWebP = true) {
    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return;
    }

    // Add to preload queue with format preference
    teamIds.forEach(teamId => {
      if (teamId) {
        const format = preferWebP && this.supportsWebP ? 'webp' : 'png';
        this.preloadQueue.add(`${teamId}-${size}-${format}`);
      }
    });

    // Start preloading if not already in progress
    if (!this.isPreloading) {
      this.processPreloadQueue();
    }
  }

  /**
   * Process the preload queue with controlled concurrency and WebP support
   * @private
   */
  async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.size === 0) {
      return;
    }

    this.isPreloading = true;
    const maxConcurrent = 4; // Slightly increased for better performance
    const promises = [];

    try {
      for (const cacheKey of this.preloadQueue) {
        const [teamId, size, format] = cacheKey.split('-');
        const preferWebP = format === 'webp';
        
        // Skip if already cached or failed
        if (this.cache.has(cacheKey) || this.failedCache.has(cacheKey)) {
          this.preloadQueue.delete(cacheKey);
          continue;
        }

        // Add to promises array
        promises.push(
          this.getTeamLogo(teamId, size, preferWebP).then(() => {
            this.preloadQueue.delete(cacheKey);
          }).catch(() => {
            this.preloadQueue.delete(cacheKey);
          })
        );

        // Process in batches to avoid overwhelming the server
        if (promises.length >= maxConcurrent) {
          await Promise.allSettled(promises);
          promises.length = 0; // Clear the array
        }
      }

      // Process remaining promises
      if (promises.length > 0) {
        await Promise.allSettled(promises);
      }
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Check if cached data is still valid
   * @param {number} timestamp - Cache timestamp
   * @returns {boolean}
   * @private
   */
  isCacheValid(timestamp) {
    return Date.now() - timestamp < this.cacheExpiration;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheExpiration) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    this.failedCache.clear();
    this.preloadQueue.clear();
  }

  /**
   * Get cache statistics for debugging
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      failedCacheSize: this.failedCache.size,
      preloadQueueSize: this.preloadQueue.size,
      isPreloading: this.isPreloading
    };
  }
}

// Create and export singleton instance
const logoService = new LogoService();

// Set up periodic cache cleanup
setInterval(() => {
  logoService.clearExpiredCache();
}, 60000); // Clean up every minute

export default logoService;