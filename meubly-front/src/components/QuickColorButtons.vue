<template>
  <div class="flex items-center space-x-2">
    <button
      v-for="themeKey in themeKeys"
      :key="themeKey"
      class="quick-button"
      :class="{ active: themeStore.colorTheme === themeKey }"
      :style="{
        '--quick-button-color': THEME_COLORS[themeKey].accent,
        '--quick-button-hover': THEME_COLORS[themeKey].accentHover
      }"
      :title="`Appliquer le thème ${THEME_COLORS[themeKey].name}`"
      @click="applyTheme(themeKey)"
    >
      <span class="sr-only">Thème {{ THEME_COLORS[themeKey].name }}</span>
    </button>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useThemeStore } from '../stores/themeStore';
import { THEME_COLORS } from '../config/themeColors';

export default {
  name: 'QuickColorButtons',
  setup() {
    const themeStore = useThemeStore();

    const themeKeys = computed(() => themeStore.availableColorThemes);

    const applyTheme = (themeKey) => {
      if (themeStore.colorTheme !== themeKey) {
        themeStore.setColorTheme(themeKey);
      }
    };

    return {
      THEME_COLORS,
      themeStore,
      themeKeys,
      applyTheme
    };
  }
};
</script>

<style scoped>
.quick-button {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, var(--quick-button-color), var(--quick-button-hover));
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  position: relative;
}

.quick-button::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.15);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.quick-button:hover {
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.quick-button:hover::after {
  opacity: 1;
}

.quick-button.active {
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25);
  transform: translateY(-1px) scale(1.05);
}

.dark .quick-button.active {
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.4);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>

