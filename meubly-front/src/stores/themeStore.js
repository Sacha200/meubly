import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkMode: false
  }),

  getters: {
    currentTheme: (state) => state.isDarkMode ? 'dark' : 'light'
  },

  actions: {
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode;
      this.applyTheme();
      this.saveToStorage();
    },

    setTheme(isDark) {
      this.isDarkMode = isDark;
      this.applyTheme();
      this.saveToStorage();
    },

    applyTheme() {
      // Utiliser la classe 'dark' de Tailwind CSS
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },

    loadFromStorage() {
      const savedTheme = localStorage.getItem('meubly-theme');
      if (savedTheme !== null) {
        this.isDarkMode = savedTheme === 'dark';
        this.applyTheme();
      } else {
        // Détecter la préférence système par défaut
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark);
      }
    },

    saveToStorage() {
      localStorage.setItem('meubly-theme', this.isDarkMode ? 'dark' : 'light');
    },

    init() {
      this.loadFromStorage();
      
      // Écouter les changements de préférence système
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('meubly-theme') === null) {
          this.setTheme(e.matches);
        }
      });
    }
  }
});
