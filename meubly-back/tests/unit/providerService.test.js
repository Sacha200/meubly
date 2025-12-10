import { describe, it, expect, vi, beforeEach } from 'vitest';
import { providerService } from '../../services/providerService.js';
import { providerRepository } from '../../repositories/providerRepository.js';

// Mock repository
vi.mock('../../repositories/providerRepository.js');

// Mock global fetch
global.fetch = vi.fn();

describe('providerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compareCategory', () => {
    it('should return empty array if no providers', async () => {
      providerRepository.findAll.mockResolvedValue([]);
      
      const result = await providerService.compareCategory(1);
      
      expect(result).toEqual([]);
    });

    it('should aggregate data from multiple providers and sort by price', async () => {
      // Mock providers
      providerRepository.findAll.mockResolvedValue([
        { name: 'ProvA', url: '/api/a' },
        { name: 'ProvB', url: '/api/b' }
      ]);

      // Mock fetch responses
      fetch.mockImplementation((url) => {
        if (url.includes('/api/a')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              { name: 'Chair A', price: "50" }
            ])
          });
        }
        if (url.includes('/api/b')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              { name: 'Chair B', price: "40" } // Cheaper
            ])
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      const result = await providerService.compareCategory(1);

      expect(result).toHaveLength(2);
      expect(result[0].company).toBe('ProvB'); // Should be first (cheaper)
      expect(result[1].company).toBe('ProvA');
    });

    it('should handle fetch errors gracefully', async () => {
       providerRepository.findAll.mockResolvedValue([
        { name: 'ProvError', url: '/api/error' }
      ]);

      fetch.mockRejectedValue(new Error("Network Error"));

      // It falls back to test data or empty in current implementation
      // The current implementation uses Fallback data if result is empty
      // So checks for Fallback logic
      const result = await providerService.compareCategory(1);

      // If empty result from API, it returns test data (mocked inside service or hardcoded)
      // Since hardcoded in service, checking length > 0
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
