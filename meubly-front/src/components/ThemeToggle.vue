<template>
  <button
    @click="themeStore.toggleTheme()"
    data-testid="theme-toggle"
    class="relative inline-flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 ease-in-out group overflow-hidden"
    :class="themeStore.isDarkMode ? 'toggle--dark' : 'toggle--light'"
    :title="themeStore.isDarkMode ? 'Passer au mode clair' : 'Passer au mode sombre'"
    :style="themeStore.isDarkMode ? themeVariables : null"
  >
    <!-- Cercle de fond animé -->
    <div
      class="absolute inset-0 rounded-full opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-105"
      :class="themeStore.isDarkMode ? 'toggle__glow toggle__glow--dark' : 'toggle__glow toggle__glow--light'"
    ></div>

    <!-- Icône Soleil (mode clair) -->
    <svg
      v-if="themeStore.isDarkMode"
      class="relative w-7 h-7 transition-all duration-500 ease-in-out group-hover:scale-110 group-hover:rotate-12 toggle__icon--sun"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
    </svg>

    <!-- Icône Lune (mode sombre) -->
    <svg
      v-else
      class="relative w-7 h-7 transition-all duration-500 ease-in-out text-gray-600 group-hover:scale-110 group-hover:-rotate-12"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"/>
    </svg>

    <!-- Effet de brillance au hover -->
    <div
      class="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      :class="themeStore.isDarkMode ? 'toggle__highlight--dark' : 'toggle__highlight--light'"
    ></div>

    <!-- Particules animées (optionnel) -->
    <div
      v-if="themeStore.isDarkMode"
      class="absolute inset-0 rounded-full"
    >
      <div class="absolute top-1 left-1 w-1 h-1 rounded-full animate-pulse toggle__particle--primary"></div>
      <div class="absolute top-2 right-2 w-0.5 h-0.5 rounded-full animate-pulse delay-100 toggle__particle--secondary"></div>
      <div class="absolute bottom-2 left-3 w-0.5 h-0.5 rounded-full animate-pulse delay-200 toggle__particle--primary"></div>
    </div>
  </button>
</template>

<script>
import { useThemeStore } from '../stores/themeStore';
import { computed } from 'vue';

export default {
  name: 'ThemeToggle',
  setup() {
    const themeStore = useThemeStore();

    const fallbackTheme = {
      background: '#052e16',
      surface: '#14532d',
      text: '#dcfce7',
      accent: '#4ade80',
      accentHover: '#22c55e',
      shadow: '#052e16'
    };

    const currentColors = computed(() => themeStore.currentColorTheme || fallbackTheme);

    const themeVariables = computed(() => {
      if (!themeStore.isDarkMode) {
        return null;
      }
      const colors = currentColors.value;
      return {
        '--toggle-surface': colors.surface,
        '--toggle-background': colors.background,
        '--toggle-text': colors.text,
        '--toggle-accent': colors.accent,
        '--toggle-accent-hover': colors.accentHover,
        '--toggle-accent-transparent': hexToRgba(colors.accent, 0.2),
        '--toggle-accent-hover-transparent': hexToRgba(colors.accentHover, 0.2),
        '--toggle-shadow': hexToRgba(colors.shadow || colors.background, 0.35)
      };
    });

    function hexToRgba(hex, alpha = 1) {
      if (!hex) {
        return `rgba(0, 0, 0, ${alpha})`;
      }

      let normalized = hex.replace('#', '');
      if (normalized.length === 3) {
        normalized = normalized.split('').map((c) => c + c).join('');
      }

      const parsed = parseInt(normalized, 16);
      if (Number.isNaN(parsed)) {
        return `rgba(0, 0, 0, ${alpha})`;
      }

      const r = (parsed >> 16) & 255;
      const g = (parsed >> 8) & 255;
      const b = parsed & 255;

      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    return { 
      themeStore,
      themeVariables
    };
  }
};
</script>

<style scoped>
.toggle--light {
  @apply bg-gradient-to-br from-gray-100 to-white shadow-lg shadow-gray-200/50;
}

.toggle--dark {
  background: linear-gradient(135deg, var(--toggle-surface), var(--toggle-background));
  box-shadow: 0 18px 35px var(--toggle-shadow);
  color: var(--toggle-text);
}

.toggle__glow {
  transition: all 0.5s ease-in-out;
}

.toggle__glow--light {
  @apply bg-gradient-to-br from-blue-400 to-purple-500;
}

.toggle__glow--dark {
  background: linear-gradient(135deg, var(--toggle-accent), var(--toggle-accent-hover));
}

.toggle__highlight--light {
  @apply bg-gradient-to-br from-blue-400/20 to-purple-500/20;
}

.toggle__highlight--dark {
  background: linear-gradient(135deg, var(--toggle-accent-transparent), var(--toggle-accent-hover-transparent));
}

.toggle__icon--sun {
  color: var(--toggle-accent);
}

.toggle__particle--primary {
  background-color: var(--toggle-accent);
}

.toggle__particle--secondary {
  background-color: var(--toggle-accent-hover);
}

/* Animation personnalisée pour les particules */
@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.delay-100 {
  animation-delay: 0.1s;
}

.delay-200 {
  animation-delay: 0.2s;
}
</style>
