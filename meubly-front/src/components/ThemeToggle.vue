<template>
  <button
    @click="themeStore.toggleTheme()"
    data-testid="theme-toggle"
    class="relative inline-flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 ease-in-out group"
    :class="[
      themeStore.isDarkMode 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg shadow-gray-900/30' 
        : 'bg-gradient-to-br from-gray-100 to-white shadow-lg shadow-gray-200/50'
    ]"
    :title="themeStore.isDarkMode ? 'Passer au mode clair' : 'Passer au mode sombre'"
  >
    <!-- Cercle de fond animé -->
    <div
      class="absolute inset-0 rounded-full transition-all duration-500 ease-in-out"
      :class="[
        themeStore.isDarkMode 
          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 opacity-0 scale-0' 
          : 'bg-gradient-to-br from-blue-400 to-purple-500 opacity-0 scale-0'
      ]"
    ></div>

    <!-- Icône Soleil (mode clair) -->
    <svg
      v-if="themeStore.isDarkMode"
      class="relative w-7 h-7 transition-all duration-500 ease-in-out text-yellow-400 group-hover:scale-110 group-hover:rotate-12"
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
      :class="[
        themeStore.isDarkMode 
          ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20' 
          : 'bg-gradient-to-br from-blue-400/20 to-purple-500/20'
      ]"
    ></div>

    <!-- Particules animées (optionnel) -->
    <div
      v-if="themeStore.isDarkMode"
      class="absolute inset-0 rounded-full"
    >
      <div class="absolute top-1 left-1 w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
      <div class="absolute top-2 right-2 w-0.5 h-0.5 bg-orange-400 rounded-full animate-pulse delay-100"></div>
      <div class="absolute bottom-2 left-3 w-0.5 h-0.5 bg-yellow-300 rounded-full animate-pulse delay-200"></div>
    </div>
  </button>
</template>

<script>
import { useThemeStore } from '../stores/themeStore';

export default {
  name: 'ThemeToggle',
  setup() {
    const themeStore = useThemeStore();
    return { themeStore };
  }
};
</script>

<style scoped>
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
