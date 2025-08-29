import { describe, it, expect, vi, beforeEach } from 'vitest';
import { furnitureService } from '../../services/furnitureService.js';

// Mock de Supabase
vi.mock('../../supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn()
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn()
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}));

describe('FurnitureService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFurnitureById', () => {
    it('should return furniture when found', async () => {
      const mockFurniture = {
        id: 1,
        name: 'Chaise de bureau',
        price: 150,
        category: 'Bureau'
      };

      const { supabase } = await import('../../supabase.js');
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => mockFurniture)
          }))
        }))
      });

      const result = await furnitureService.getFurnitureById(1);

      expect(supabase.from).toHaveBeenCalledWith('Furniture');
      expect(result).toEqual(mockFurniture);
    });

    it('should throw error when furniture not found', async () => {
      const { supabase } = await import('../../supabase.js');
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => null)
          }))
        }))
      });

      await expect(furnitureService.getFurnitureById(999)).rejects.toThrow('Meuble non trouvé');
    });
  });

  describe('createFurniture', () => {
    it('should create furniture successfully', async () => {
      const furnitureData = {
        name: 'Nouvelle chaise',
        price: 200,
        category: 'Bureau',
        description: 'Une chaise confortable'
      };

      const createdFurniture = {
        id: 2,
        ...furnitureData,
        created_at: '2024-01-01'
      };

      const { supabase } = await import('../../supabase.js');
      supabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => [createdFurniture])
        }))
      });

      const result = await furnitureService.createFurniture(furnitureData);

      expect(supabase.from).toHaveBeenCalledWith('Furniture');
      expect(result).toEqual(createdFurniture);
    });

    it('should throw error when creation fails', async () => {
      const furnitureData = {
        name: 'Nouvelle chaise',
        price: 200
      };

      const { supabase } = await import('../../supabase.js');
      supabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => {
            throw new Error('Erreur de base de données');
          })
        }))
      });

      await expect(furnitureService.createFurniture(furnitureData)).rejects.toThrow('Erreur de base de données');
    });
  });

  describe('updateFurniture', () => {
    it('should update furniture successfully', async () => {
      const furnitureId = 1;
      const updateData = {
        name: 'Chaise mise à jour',
        price: 180
      };

      const updatedFurniture = {
        id: furnitureId,
        ...updateData,
        category: 'Bureau',
        updated_at: '2024-01-01'
      };

      const { supabase } = await import('../../supabase.js');
      supabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => [updatedFurniture])
          }))
        }))
      });

      const result = await furnitureService.updateFurniture(furnitureId, updateData);

      expect(supabase.from).toHaveBeenCalledWith('Furniture');
      expect(result).toEqual(updatedFurniture);
    });

    it('should throw error when update fails', async () => {
      const furnitureId = 1;
      const updateData = { name: 'Chaise mise à jour' };

      const { supabase } = await import('../../supabase.js');
      supabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => {
              throw new Error('Erreur de mise à jour');
            })
          }))
        }))
      });

      await expect(furnitureService.updateFurniture(furnitureId, updateData)).rejects.toThrow('Erreur de mise à jour');
    });
  });

  describe('deleteFurniture', () => {
    it('should delete furniture successfully', async () => {
      const furnitureId = 1;

      const { supabase } = await import('../../supabase.js');
      supabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      await furnitureService.deleteFurniture(furnitureId);

      expect(supabase.from).toHaveBeenCalledWith('Furniture');
    });

    it('should throw error when deletion fails', async () => {
      const furnitureId = 1;

      const { supabase } = await import('../../supabase.js');
      supabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({ error: new Error('Erreur de suppression') }))
        }))
      });

      await expect(furnitureService.deleteFurniture(furnitureId)).rejects.toThrow('Erreur de suppression');
    });
  });

  describe('getAllFurniture', () => {
    it('should return all furniture', async () => {
      const mockFurnitureList = [
        { id: 1, name: 'Chaise', price: 100 },
        { id: 2, name: 'Table', price: 200 }
      ];

      const { supabase } = await import('../../supabase.js');
      supabase.from.mockReturnValue({
        select: vi.fn(() => mockFurnitureList)
      });

      const result = await furnitureService.getAllFurniture();

      expect(supabase.from).toHaveBeenCalledWith('Furniture');
      expect(result).toEqual(mockFurnitureList);
    });

    it('should return empty array when no furniture', async () => {
      const { supabase } = await import('../../supabase.js');
      supabase.from.mockReturnValue({
        select: vi.fn(() => [])
      });

      const result = await furnitureService.getAllFurniture();

      expect(result).toEqual([]);
    });
  });
});
