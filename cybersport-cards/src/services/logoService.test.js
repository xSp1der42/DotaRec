import logoService from './logoService';
import api from './api';

// Mock the API
jest.mock('./api');

describe('LogoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    logoService.clearCache();
  });

  afterEach(() => {
    logoService.clearCache();
  });

  describe('getTeamLogo', () => {
    test('returns null for invalid teamId', async () => {
      const result = await logoService.getTeamLogo(null);
      expect(result).toBeNull();

      const result2 = await logoService.getTeamLogo('');
      expect(result2).toBeNull();
    });

    test('fetches logo from API and caches result', async () => {
      const mockResponse = {
        data: {
          logoUrl: '/uploads/logos/team-123-64.png',
          sizes: {
            small: '/uploads/logos/team-123-32.png',
            medium: '/uploads/logos/team-123-64.png',
            large: '/uploads/logos/team-123-128.png'
          }
        }
      };

      api.get.mockResolvedValueOnce(mockResponse);

      const result = await logoService.getTeamLogo('team123', 'medium');
      
      expect(api.get).toHaveBeenCalledWith('/api/teams/team123/logo', {
        params: { size: 'medium' },
        timeout: 5000
      });
      expect(result).toBe('/uploads/logos/team-123-64.png');

      // Second call should use cache
      const result2 = await logoService.getTeamLogo('team123', 'medium');
      expect(result2).toBe('/uploads/logos/team-123-64.png');
      expect(api.get).toHaveBeenCalledTimes(1); // Should not call API again
    });

    test('returns logo URL from sizes when logoUrl not available', async () => {
      const mockResponse = {
        data: {
          sizes: {
            medium: '/uploads/logos/team-123-64.png'
          }
        }
      };

      api.get.mockResolvedValueOnce(mockResponse);

      const result = await logoService.getTeamLogo('team123', 'medium');
      expect(result).toBe('/uploads/logos/team-123-64.png');
    });

    test('handles API errors and caches failures', async () => {
      const mockError = {
        isNetworkError: true,
        message: 'Network error'
      };

      api.get.mockRejectedValueOnce(mockError);

      const result = await logoService.getTeamLogo('team123', 'medium');
      expect(result).toBeNull();

      // Second call should return null immediately (cached failure)
      const result2 = await logoService.getTeamLogo('team123', 'medium');
      expect(result2).toBeNull();
      expect(api.get).toHaveBeenCalledTimes(1); // Should not retry immediately
    });

    test('handles empty response data', async () => {
      const mockResponse = { data: {} };
      api.get.mockResolvedValueOnce(mockResponse);

      const result = await logoService.getTeamLogo('team123', 'medium');
      expect(result).toBeNull();
    });

    test('uses default size when not specified', async () => {
      const mockResponse = {
        data: {
          sizes: {
            medium: '/uploads/logos/team-123-64.png'
          }
        }
      };

      api.get.mockResolvedValueOnce(mockResponse);

      await logoService.getTeamLogo('team123');
      
      expect(api.get).toHaveBeenCalledWith('/api/teams/team123/logo', {
        params: { size: 'medium' },
        timeout: 5000
      });
    });
  });

  describe('preloadLogos', () => {
    test('handles empty or invalid input', async () => {
      await logoService.preloadLogos([]);
      await logoService.preloadLogos(null);
      await logoService.preloadLogos(['', null, undefined]);
      
      expect(api.get).not.toHaveBeenCalled();
    });

    test('preloads multiple team logos', async () => {
      const mockResponse = {
        data: {
          sizes: {
            medium: '/uploads/logos/team-64.png'
          }
        }
      };

      api.get.mockResolvedValue(mockResponse);

      await logoService.preloadLogos(['team1', 'team2', 'team3']);
      
      // Wait for preloading to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(api.get).toHaveBeenCalledTimes(3);
    });

    test('skips already cached logos during preload', async () => {
      const mockResponse = {
        data: {
          sizes: {
            medium: '/uploads/logos/team-64.png'
          }
        }
      };

      api.get.mockResolvedValue(mockResponse);

      // First load team1 normally
      await logoService.getTeamLogo('team1', 'medium');
      expect(api.get).toHaveBeenCalledTimes(1);

      // Preload team1 and team2 - should only load team2
      await logoService.preloadLogos(['team1', 'team2']);
      
      // Wait for preloading to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(api.get).toHaveBeenCalledTimes(2); // Only one additional call for team2
    });
  });

  describe('cache management', () => {
    test('clearCache removes all cached data', async () => {
      const mockResponse = {
        data: {
          sizes: {
            medium: '/uploads/logos/team-64.png'
          }
        }
      };

      api.get.mockResolvedValue(mockResponse);

      await logoService.getTeamLogo('team123', 'medium');
      expect(api.get).toHaveBeenCalledTimes(1);

      logoService.clearCache();

      await logoService.getTeamLogo('team123', 'medium');
      expect(api.get).toHaveBeenCalledTimes(2); // Should call API again after cache clear
    });

    test('getCacheStats returns correct statistics', () => {
      const stats = logoService.getCacheStats();
      
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('failedCacheSize');
      expect(stats).toHaveProperty('preloadQueueSize');
      expect(stats).toHaveProperty('isPreloading');
      expect(typeof stats.cacheSize).toBe('number');
    });

    test('clearExpiredCache removes old entries', async () => {
      const mockResponse = {
        data: {
          sizes: {
            medium: '/uploads/logos/team-64.png'
          }
        }
      };

      api.get.mockResolvedValue(mockResponse);

      // Load a logo
      await logoService.getTeamLogo('team123', 'medium');
      
      // Manually expire the cache by setting old timestamp
      const cacheKey = 'team123-medium';
      const cachedEntry = logoService.cache.get(cacheKey);
      if (cachedEntry) {
        cachedEntry.timestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      }

      logoService.clearExpiredCache();

      // Should call API again since cache was cleared
      await logoService.getTeamLogo('team123', 'medium');
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    test('handles different error types correctly', async () => {
      const networkError = {
        isNetworkError: true,
        message: 'Network error'
      };

      const serverError = {
        isServerError: true,
        statusCode: 500,
        message: 'Server error'
      };

      const clientError = {
        isClientError: true,
        statusCode: 404,
        message: 'Not found'
      };

      // Network error should be cached
      api.get.mockRejectedValueOnce(networkError);
      const result1 = await logoService.getTeamLogo('team1', 'medium');
      expect(result1).toBeNull();

      // Server error should be cached
      api.get.mockRejectedValueOnce(serverError);
      const result2 = await logoService.getTeamLogo('team2', 'medium');
      expect(result2).toBeNull();

      // Client error should not prevent retry
      api.get.mockRejectedValueOnce(clientError);
      const result3 = await logoService.getTeamLogo('team3', 'medium');
      expect(result3).toBeNull();

      expect(api.get).toHaveBeenCalledTimes(3);
    });
  });
});