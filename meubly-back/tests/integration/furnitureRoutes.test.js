import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { furnitureRepository } from '../../repositories/furnitureRepository.js';

// Mock Auth Middleware to bypass real JWT checks for integration tests
vi.mock('../../middlewares/authMiddleware.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  }
}));

// Mock Role Middleware
vi.mock('../../middlewares/roleMiddleware.js', () => ({
  requireAdmin: (req, res, next) => {
    // Simulate admin role
    next();
  }
}));

// Mock Repository
vi.mock('../../repositories/furnitureRepository.js');

describe('Integration: Furniture Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/furnitures', () => {
    it('should return list of furnitures', async () => {
      furnitureRepository.search.mockResolvedValue({ 
          data: [{ furniture_id: 1, name: 'Chair' }], 
          count: 1 
      });

      const res = await request(app).get('/api/v1/furnitures');
      
      expect(res.status).toBe(200);
      // Service returns { items: [...], ... }
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].name).toBe('Chair');
    });
  });

  describe('POST /api/v1/furnitures', () => {
    it('should create furniture (Authorized & Admin)', async () => {
      const newItem = { name: 'New Table' };
      furnitureRepository.create.mockResolvedValue({ furniture_id: 1, ...newItem });

      const res = await request(app)
        .post('/api/v1/furnitures')
        .send(newItem);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Table');
    });

    // Note: Since we mocked requireAdmin to always pass, we can't test 403 here easily without more complex mocking.
    // In a real scenario, we would use different mocks per test or a test DB.
    // For this scope, confirming 200/201 flow is good.
  });

  describe('GET /api/v1/furnitures/:id', () => {
      it('should return 404 if not found', async () => {
          furnitureRepository.findById.mockResolvedValue(null);
          
          const res = await request(app).get('/api/v1/furnitures/999');
          
          expect(res.status).toBe(404);
      });
  });
});
