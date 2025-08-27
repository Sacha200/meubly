import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getProducts, 
  getProductById, 
  searchProducts, 
  updateProduct,
  registerUser,
  loginUser,
  logoutUser,
  addFavorite,
  removeFavorite
} from '../../src/clientapi';

// Mock de fetch
global.fetch = vi.fn();

// Mock de Supabase
vi.mock('../../src/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}));

describe('API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [
        { id: 1, name: 'Chaise', price: 100 },
        { id: 2, name: 'Table', price: 200 }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts
      });

      const result = await getProducts();

      expect(fetch).toHaveBeenCalledWith('https://meubly-back.onrender.com/api/v1/furnitures');
      expect(result).toEqual(mockProducts);
    });

    it('should throw error when API call fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(getProducts()).rejects.toThrow('Erreur HTTP: 500');
    });
  });

  describe('getProductById', () => {
    it('should fetch a specific product successfully', async () => {
      const mockProduct = { id: 1, name: 'Chaise', price: 100 };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct
      });

      const result = await getProductById(1);

      expect(fetch).toHaveBeenCalledWith('https://meubly-back.onrender.com/api/v1/furnitures/1');
      expect(result).toEqual(mockProduct);
    });

    it('should throw error when product not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Produit non trouvé' })
      });

      await expect(getProductById(999)).rejects.toThrow('Produit non trouvé');
    });
  });

  describe('searchProducts', () => {
    it('should search products with query', async () => {
      const mockResults = [{ id: 1, name: 'Chaise de bureau' }];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      const result = await searchProducts('bureau');

      expect(fetch).toHaveBeenCalledWith('https://meubly-back.onrender.com/api/v1/furnitures?search=bureau');
      expect(result).toEqual(mockResults);
    });

    it('should search products without query', async () => {
      const mockResults = [{ id: 1, name: 'Chaise' }];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      const result = await searchProducts();

      expect(fetch).toHaveBeenCalledWith('https://meubly-back.onrender.com/api/v1/furnitures');
      expect(result).toEqual(mockResults);
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const mockUpdatedProduct = { id: 1, name: 'Chaise mise à jour', price: 150 };
      const updateData = { name: 'Chaise mise à jour', price: 150 };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedProduct
      });

      const result = await updateProduct(1, updateData);

      expect(fetch).toHaveBeenCalledWith('https://meubly-back.onrender.com/api/v1/furnitures/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      expect(result).toEqual(mockUpdatedProduct);
    });
  });

  describe('Authentication Functions', () => {
    it('should register user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        lastname: 'Test'
      };

      const mockAuthData = {
        user: { 
          id: '123', 
          email: 'test@example.com',
          user_metadata: {
            username: 'testuser',
            lastname: 'Test'
          }
        }
      };

      const { supabase } = await import('../../src/supabase');
      supabase.auth.signUp.mockResolvedValueOnce({
        data: mockAuthData,
        error: null
      });

      supabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => [mockAuthData.user])
        }))
      });

      const result = await registerUser(userData);

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        options: expect.any(Object)
      });
      expect(result.user).toEqual(mockAuthData.user);
    });

    it('should login user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = { id: '123', email: 'test@example.com' };
      const mockProfile = { id: 1, role: 'user' };

      const { supabase } = await import('../../src/supabase');
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => mockProfile)
          }))
        }))
      });

      const result = await loginUser(credentials);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith(credentials);
      expect(result.user).toEqual(mockUser);
      expect(result.profile).toEqual(mockProfile);
    });

    it('should logout user successfully', async () => {
      const { supabase } = await import('../../src/supabase');
      supabase.auth.signOut.mockResolvedValueOnce({
        error: null
      });

      await logoutUser();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('Favorites Functions', () => {
    it('should add favorite successfully', async () => {
      const mockUser = { id: '123' };
      const mockFavorite = { id: 1, user_id: '123', furniture_id: 1 };

      const { supabase } = await import('../../src/supabase');
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => mockFavorite)
        }))
      }));

      supabase.from.mockReturnValue({
        insert: mockInsert
      });

      const result = await addFavorite(1);

      expect(mockInsert).toHaveBeenCalledWith([{
        user_id: '123',
        furniture_id: 1
      }]);
      expect(result).toEqual(mockFavorite);
    });

    it('should remove favorite successfully', async () => {
      const mockUser = { id: '123' };

      const { supabase } = await import('../../src/supabase');
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null }))
          }))
        }))
      });

      await removeFavorite(1);

      expect(supabase.from).toHaveBeenCalledWith('Favoris');
    });
  });
});
