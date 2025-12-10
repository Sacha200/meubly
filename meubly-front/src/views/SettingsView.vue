<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        Paramètres
      </h1>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Section Thème -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Apparence
          </h2>
          
          <!-- Basculement Mode Sombre/Clair -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">
                Mode sombre
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Activer ou désactiver le mode sombre
              </p>
            </div>
            <ThemeToggle />
          </div>
          
          <!-- Sélecteur de couleurs -->
          <ColorThemeSelector />
        </div>
        
        <!-- Section Informations -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Informations
          </h2>
          
          <div class="space-y-4">
            <div>
              <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">
                Thème actuel
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Mode: {{ themeStore.currentTheme }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Couleur: {{ themeStore.currentColorTheme.name }}
              </p>
            </div>
            
            <div>
              <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">
                Thèmes disponibles
              </h3>
              <div class="flex flex-wrap gap-2 mt-2">
                <span
                  v-for="theme in themeStore.availableColorThemes"
                  :key="theme"
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :class="[
                    themeStore.colorTheme === theme
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ THEME_COLORS[theme].name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Aperçu en temps réel -->
      <div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
          Aperçu en temps réel
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-2">
              Carte exemple
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Ceci est un exemple de contenu pour voir l'effet du thème.
            </p>
            <button class="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
              Bouton exemple
            </button>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
            <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-2">
              Autre carte
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Différentes nuances pour tester la cohérence.
            </p>
          </div>
          
          <div class="bg-white dark:bg-gray-500 rounded-lg p-4 border border-gray-200 dark:border-gray-400">
            <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-2">
              Carte avec bordure
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Test des bordures et contrastes.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useThemeStore } from '../stores/themeStore';
import { THEME_COLORS } from '../config/themeColors';
import ThemeToggle from '../components/ThemeToggle.vue';
import ColorThemeSelector from '../components/ColorThemeSelector.vue';

export default {
  name: 'SettingsView',
  components: {
    ThemeToggle,
    ColorThemeSelector
  },
  setup() {
    const themeStore = useThemeStore();
    return { themeStore, THEME_COLORS };
  }
};
</script>

<style scoped>
/* Styles spécifiques à cette vue */
.container {
  max-width: 1200px;
}

/* Animation pour les cartes */
.bg-white, .bg-gray-50, .bg-gray-100 {
  transition: all 0.3s ease;
}

/* Effet hover pour les cartes */
.bg-white:hover, .bg-gray-50:hover, .bg-gray-100:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.dark .bg-gray-800:hover, .dark .bg-gray-700:hover, .dark .bg-gray-600:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}
</style>
