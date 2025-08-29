import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeStore } from '../../src/stores/themeStore';

// Mock de Supabase
vi.mock('../../src/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn((callback) => {
        // Stocker le callback pour les tests
        global.authStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      })
    }
  }
}));

describe('Stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('AuthStore', () => {
    it('should initialize with default state', () => {
      const authStore = useAuthStore();
      
      expect(authStore.user).toBeNull();
      expect(authStore.session).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
      expect(authStore.userEmail).toBeUndefined();
      expect(authStore.userName).toBeUndefined();
    });

    it('should update state when user is authenticated', async () => {
      const authStore = useAuthStore();
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {
          username: 'testuser'
        }
      };
      const mockSession = { user: mockUser };

      const { supabase } = await import('../../src/supabase');
      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession }
      });

      await authStore.init();

      expect(authStore.user).toEqual(mockUser);
      expect(authStore.session).toEqual(mockSession);
      expect(authStore.isAuthenticated).toBe(true);
      expect(authStore.userEmail).toBe('test@example.com');
      expect(authStore.userName).toBe('testuser');
    });

    it('should handle auth state changes', async () => {
      const authStore = useAuthStore();
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { user: mockUser };

      const { supabase } = await import('../../src/supabase');
      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null }
      });

      await authStore.init();

      // Simuler un changement d'état d'authentification
      if (global.authStateChangeCallback) {
        global.authStateChangeCallback('SIGNED_IN', mockSession);
      }

      // Attendre que l'état soit mis à jour
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(authStore.user).toEqual(mockUser);
      expect(authStore.session).toEqual(mockSession);
      expect(authStore.isAuthenticated).toBe(true);
    });

    it('should handle sign out', async () => {
      const authStore = useAuthStore();
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { user: mockUser };

      const { supabase } = await import('../../src/supabase');
      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession }
      });

      await authStore.init();

      // Simuler une déconnexion
      if (global.authStateChangeCallback) {
        global.authStateChangeCallback('SIGNED_OUT', null);
      }

      // Attendre que l'état soit mis à jour
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(authStore.user).toBeNull();
      expect(authStore.session).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
    });
  });

  describe('ThemeStore', () => {
    it('should initialize with default theme', () => {
      const themeStore = useThemeStore();
      
      expect(themeStore.isDarkMode).toBe(false);
      expect(themeStore.currentTheme).toBe('light');
    });

    it('should toggle theme', () => {
      const themeStore = useThemeStore();
      
      expect(themeStore.isDarkMode).toBe(false);
      expect(themeStore.currentTheme).toBe('light');
      
      themeStore.toggleTheme();
      expect(themeStore.isDarkMode).toBe(true);
      expect(themeStore.currentTheme).toBe('dark');
      
      themeStore.toggleTheme();
      expect(themeStore.isDarkMode).toBe(false);
      expect(themeStore.currentTheme).toBe('light');
    });

    it('should set theme directly', () => {
      const themeStore = useThemeStore();
      
      themeStore.setTheme(true);
      expect(themeStore.isDarkMode).toBe(true);
      expect(themeStore.currentTheme).toBe('dark');
      
      themeStore.setTheme(false);
      expect(themeStore.isDarkMode).toBe(false);
      expect(themeStore.currentTheme).toBe('light');
    });

    it('should initialize theme from localStorage', () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(() => 'dark'),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });

      const themeStore = useThemeStore();
      themeStore.init();

      expect(themeStore.isDarkMode).toBe(true);
      expect(themeStore.currentTheme).toBe('dark');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('meubly-theme');
    });

    it('should save theme to localStorage when changed', () => {
      const localStorageMock = {
        getItem: vi.fn(() => 'light'),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });

      const themeStore = useThemeStore();
      themeStore.init();
      
      themeStore.setTheme(true);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('meubly-theme', 'dark');
    });
  });
});
