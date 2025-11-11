import { defineStore } from 'pinia';
import { setThemeColor, getCurrentThemeColors, THEME_COLORS } from '../config/themeColors.js';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkMode: false,
    colorTheme: 'green' // Thème de couleur pour le mode sombre
  }),

  getters: {
    currentTheme: (state) => state.isDarkMode ? 'dark' : 'light',
    currentColorTheme: (state) => THEME_COLORS[state.colorTheme],
    availableColorThemes: () => Object.keys(THEME_COLORS)
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
        // Appliquer les couleurs du thème sélectionné
        setThemeColor(this.colorTheme);
      } else {
        document.documentElement.classList.remove('dark');
      }
    },

    setColorTheme(colorTheme) {
      this.colorTheme = colorTheme;
      if (this.isDarkMode) {
        this.applyTheme();
      }
      this.saveToStorage();
    },

    loadFromStorage() {
      const savedTheme = localStorage.getItem('meubly-theme');
      const savedColorTheme = localStorage.getItem('meubly-color-theme');
      
      if (savedTheme !== null) {
        this.isDarkMode = savedTheme === 'dark';
        this.applyTheme();
      } else {
        // Détecter la préférence système par défaut
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark);
      }
      
      if (savedColorTheme !== null) {
        this.colorTheme = savedColorTheme;
      }
    },

    saveToStorage() {
      localStorage.setItem('meubly-theme', this.isDarkMode ? 'dark' : 'light');
      localStorage.setItem('meubly-color-theme', this.colorTheme);
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
