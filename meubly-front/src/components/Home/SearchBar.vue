<template>
  <div class="w-full mb-8" data-testid="search-bar">
    <!-- Search Input + Dropdown -->
    <div class="relative">
      <div
        class="flex items-center bg-white dark:bg-surface border border-gray-100 dark:border-gray-700 rounded-xl w-full h-[72px] shadow-sm hover:shadow-md transition-shadow duration-300 focus-within:ring-2 focus-within:ring-primary-500/20">
        <!-- Input -->
        <div class="flex-1 px-6">
          <div class="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
            Rechercher
          </div>
          <input
            ref="searchInput"
            type="text"
            v-model="searchQuery"
            placeholder="Quel meuble cherchez-vous ?"
            class="w-full text-base sm:text-lg text-gray-800 dark:text-white bg-transparent focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 font-medium"
            autocomplete="off"
            @keyup.enter="performSearch"
            @input="onInput"
            @keydown.down.prevent="moveDown"
            @keydown.up.prevent="moveUp"
            @keydown.escape="closeDropdown"
            @focus="onFocus"
            @blur="onBlur"
          />
        </div>

        <!-- Search Button -->
        <button
          @click="performSearch"
          type="submit"
          class="bg-primary-500 text-white rounded-lg w-12 h-12 flex items-center justify-center mr-3 hover:bg-primary-600 active:scale-95 transition-all duration-200 shadow-sm"
          :disabled="!isSearchValid"
          :class="{ 'opacity-50 cursor-not-allowed': !isSearchValid }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" />
          </svg>
        </button>
      </div>

      <!-- Autocomplete dropdown -->
      <transition name="dropdown">
        <div
          v-if="showDropdown && suggestions.length"
          class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <ul>
            <li
              v-for="(item, i) in suggestions"
              :key="item.furniture_id"
              class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              :class="{ 'bg-gray-50 dark:bg-neutral-800': i === activeIndex }"
              @mousedown.prevent="selectSuggestion(item)"
            >
              <img
                v-if="item.cover_url"
                :src="item.cover_url"
                :alt="item.title"
                class="w-10 h-10 object-cover rounded-lg flex-shrink-0 bg-gray-100 dark:bg-neutral-800"
              />
              <div class="flex-1 min-w-0">
                <span class="text-sm text-gray-800 dark:text-gray-100 font-medium truncate block">{{ item.title }}</span>
                <span v-if="item.cached_min_price" class="text-xs text-primary-500 font-medium">
                  dès {{ item.cached_min_price }}€
                </span>
              </div>
              <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </li>
          </ul>
          <!-- Voir tous les résultats -->
          <div class="border-t border-gray-100 dark:border-gray-700 px-4 py-2">
            <button
              class="text-sm text-primary-500 hover:text-primary-600 font-medium w-full text-left"
              @mousedown.prevent="performSearch"
            >
              Voir tous les résultats pour "{{ searchQuery }}"
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Category chips -->
    <div v-if="categories.length" class="flex flex-wrap gap-2 mt-3">
      <button
        v-for="cat in categories"
        :key="cat.category_id"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200"
        :class="activeCategoryId === cat.category_id
          ? 'border-primary-500 bg-primary-500 text-white'
          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-surface text-gray-600 dark:text-gray-300 hover:border-primary-500 hover:text-primary-500 dark:hover:text-primary-400'"
        @click="searchByCategory(cat)"
      >
        {{ cat.label }}
      </button>
      <button
        v-if="activeCategoryId"
        class="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 transition-all duration-200"
        @click="clearCategory"
      >
        ✕ Effacer
      </button>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia';
import { useFurnitureStore } from '@/stores/furnitureStore';
import { useCategoryStore } from '@/stores/categoryStore';

let debounceTimer = null;

export default {
  name: 'SearchBar',

  data() {
    return {
      searchQuery: '',
      suggestions: [],
      showDropdown: false,
      activeIndex: -1,
      activeCategoryId: null,
    };
  },

  computed: {
    ...mapStores(useFurnitureStore, useCategoryStore),
    isSearchValid() {
      return this.searchQuery.trim().length > 0;
    },
    categories() {
      return this.categoryStore.categories || [];
    },
  },

  methods: {
    onInput() {
      this.activeIndex = -1;
      clearTimeout(debounceTimer);
      if (this.searchQuery.trim().length < 2) {
        this.suggestions = [];
        this.showDropdown = false;
        return;
      }
      debounceTimer = setTimeout(async () => {
        this.suggestions = await this.furnitureStore.suggest(this.searchQuery);
        this.showDropdown = this.suggestions.length > 0;
      }, 280);
    },

    onFocus() {
      if (this.suggestions.length) this.showDropdown = true;
    },

    onBlur() {
      setTimeout(() => { this.showDropdown = false; }, 200);
    },

    closeDropdown() {
      this.showDropdown = false;
      this.activeIndex = -1;
    },

    moveDown() {
      if (!this.showDropdown) return;
      this.activeIndex = Math.min(this.activeIndex + 1, this.suggestions.length - 1);
    },

    moveUp() {
      if (!this.showDropdown) return;
      this.activeIndex = Math.max(this.activeIndex - 1, -1);
    },

    selectSuggestion(item) {
      this.closeDropdown();
      this.$router.push({ name: 'ProductDetail', params: { id: item.furniture_id } });
    },

    async performSearch() {
      if (!this.isSearchValid) return;
      this.closeDropdown();
      this.activeCategoryId = null;
      this.furnitureStore.q = this.searchQuery.trim();
      this.furnitureStore.categoryId = null;
      this.furnitureStore.page = 1;
      this.$router.push({ name: 'ResultatRecherche', query: { q: this.furnitureStore.q } });
    },

    async searchByCategory(cat) {
      this.closeDropdown();
      this.searchQuery = '';
      this.activeCategoryId = cat.category_id;
      this.furnitureStore.q = '';
      this.furnitureStore.categoryId = cat.category_id;
      this.furnitureStore.page = 1;
      this.$router.push({
        name: 'ResultatRecherche',
        query: { categoryId: cat.category_id, categoryLabel: cat.label }
      });
    },

    clearCategory() {
      this.activeCategoryId = null;
      this.furnitureStore.resetFilters();
      this.furnitureStore.fetch();
    },
  },

  async mounted() {
    this.$nextTick(() => this.$refs.searchInput?.focus());

    const existingQ = this.$route?.query?.q;
    if (existingQ && typeof existingQ === 'string') {
      this.searchQuery = existingQ;
    }

    if (!this.categoryStore.categories.length) {
      await this.categoryStore.fetchCategories();
    }
  },
};
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
