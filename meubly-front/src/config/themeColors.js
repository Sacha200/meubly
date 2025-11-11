// Configuration des couleurs de thème pour le mode sombre
export const THEME_COLORS = {
  // Thème vert (par défaut)
  green: {
    name: 'Vert',
    background: '#052e16',
    surface: '#14532d',
    text: '#dcfce7',
    accent: '#4ade80',
    accentHover: '#22c55e',
    shadow: '#052e16'
  },

  // Thème rouge
  red: {
    name: 'Rouge',
    background: '#450a0a',
    surface: '#7f1d1d',
    text: '#fee2e2',
    accent: '#f87171',
    accentHover: '#ef4444',
    shadow: '#450a0a'
  },

  // Thème bleu
  blue: {
    name: 'Bleu',
    background: '#172554',
    surface: '#1e3a8a',
    text: '#dbeafe',
    accent: '#60a5fa',
    accentHover: '#3b82f6',
    shadow: '#172554'
  }
};

// Thème actuel (peut être modifié dynamiquement)
export let currentTheme = 'green';

// Fonction pour changer le thème
export function setThemeColor(themeName) {
  if (THEME_COLORS[themeName]) {
    currentTheme = themeName;
    // Appliquer les nouvelles couleurs
    applyThemeColors();
  }
}

// Fonction pour appliquer les couleurs du thème
export function applyThemeColors() {
  const theme = THEME_COLORS[currentTheme];
  const root = document.documentElement;
  
  // Appliquer les variables CSS personnalisées
  root.style.setProperty('--dark-bg', theme.background);
  root.style.setProperty('--dark-surface', theme.surface);
  root.style.setProperty('--dark-text', theme.text);
  root.style.setProperty('--dark-accent', theme.accent);
  root.style.setProperty('--dark-accent-hover', theme.accentHover);
  root.style.setProperty('--dark-shadow', theme.shadow);
}

// Fonction pour obtenir les couleurs du thème actuel
export function getCurrentThemeColors() {
  return THEME_COLORS[currentTheme];
}
