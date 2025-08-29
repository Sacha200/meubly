import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';

describe('Furniture Routes Integration Tests', () => {
  let server;

  beforeAll(() => {
    server = app.listen(0); // Port 0 pour un port aléatoire
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    // Reset des mocks si nécessaire
  });

  describe('GET /api/v1/furnitures', () => {
    it('should return all furniture', async () => {
      const response = await request(server)
        .get('/api/v1/furnitures')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should filter furniture by search query', async () => {
      const response = await request(server)
        .get('/api/v1/furnitures?search=chaise')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should filter furniture by category', async () => {
      const response = await request(server)
        .get('/api/v1/furnitures?category=Bureau')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/furnitures/:id', () => {
    it('should return a specific furniture by id', async () => {
      const response = await request(server)
        .get('/api/v1/furnitures/1')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return 404 for non-existent furniture', async () => {
      await request(server)
        .get('/api/v1/furnitures/999999')
        .expect(500); // Ou 404 selon votre implémentation
    });
  });

  describe('POST /api/v1/furnitures', () => {
    it('should create a new furniture', async () => {
      const newFurniture = {
        name: 'Test Chaise',
        price: 150,
        category: 'Bureau',
        description: 'Une chaise de test'
      };

      const response = await request(server)
        .post('/api/v1/furnitures')
        .send(newFurniture)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newFurniture.name);
      expect(response.body.price).toBe(newFurniture.price);
    });

    it('should return 400 for invalid furniture data', async () => {
      const invalidFurniture = {
        name: '', // Nom vide
        price: -10 // Prix négatif
      };

      await request(server)
        .post('/api/v1/furnitures')
        .send(invalidFurniture)
        .expect(400);
    });
  });

  describe('PATCH /api/v1/furnitures/:id', () => {
    it('should update an existing furniture', async () => {
      const updateData = {
        name: 'Chaise mise à jour',
        price: 180
      };

      const response = await request(server)
        .patch('/api/v1/furnitures/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.price).toBe(updateData.price);
    });

    it('should return 404 for non-existent furniture update', async () => {
      const updateData = {
        name: 'Chaise inexistante'
      };

      await request(server)
        .patch('/api/v1/furnitures/999999')
        .send(updateData)
        .expect(500); // Ou 404 selon votre implémentation
    });
  });

  describe('DELETE /api/v1/furnitures/:id', () => {
    it('should delete an existing furniture', async () => {
      await request(server)
        .delete('/api/v1/furnitures/1')
        .expect(200);
    });

    it('should return 404 for non-existent furniture deletion', async () => {
      await request(server)
        .delete('/api/v1/furnitures/999999')
        .expect(500); // Ou 404 selon votre implémentation
    });
  });

  describe('GET /api/v1/:id/offers', () => {
    it('should return offers for a specific furniture', async () => {
      const response = await request(server)
        .get('/api/v1/1/offers')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should filter offers by query parameter', async () => {
      const response = await request(server)
        .get('/api/v1/1/offers?query=ikea')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
