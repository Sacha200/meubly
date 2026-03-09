<template>
  <div class="w-full mb-8" data-testid="search-bar">
    <div class="relative">

      <!-- Pill container -->
      <div
        class="flex items-center bg-white dark:bg-surface rounded-full border transition-all duration-200"
        :class="anyFocused
          ? 'border-gray-300 dark:border-gray-500 shadow-xl'
          : 'border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg'"
      >

        <!-- Section 1 : Quel meuble ? -->
        <div
          class="flex-1 min-w-0 h-[60px] sm:h-[66px] flex flex-col justify-center px-5 sm:px-7 cursor-text rounded-full transition-colors duration-150"
          :class="searchFocused
            ? 'bg-white dark:bg-surface shadow-sm z-10'
            : (anyFocused ? 'opacity-60 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-neutral-800/60' : 'hover:bg-gray-50 dark:hover:bg-neutral-800/60')"
          @click="$refs.searchInput.focus()"
        >
          <span class="text-[11px] font-bold text-gray-900 dark:text-white leading-none mb-0.5">Quel meuble ?</span>
          <div class="flex items-center gap-1">
            <input
              ref="searchInput"
              type="text"
              v-model="searchQuery"
              placeholder="Canapé, table, lit…"
              class="w-full text-sm text-gray-500 dark:text-gray-400 bg-transparent focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 truncate"
              autocomplete="off"
              @keyup.enter="performSearch"
              @input="onInput"
              @keydown.down.prevent="moveDown"
              @keydown.up.prevent="moveUp"
              @keydown.escape="closeAll"
              @focus="searchFocused = true; onFocus()"
              @blur="searchFocused = false; onBlur()"
            />
            <button
              v-if="searchQuery"
              class="flex-shrink-0 w-4 h-4 rounded-full bg-gray-400 hover:bg-gray-600 dark:bg-gray-500 dark:hover:bg-gray-300 flex items-center justify-center transition-colors"
              @mousedown.prevent="searchQuery = ''; suggestions = []; showSuggestions = false"
              tabindex="-1"
            >
              <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Divider -->
        <div class="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-600 flex-shrink-0"></div>

        <!-- Section 2 : Catégorie (masqué sur mobile) -->
        <div
          class="hidden sm:flex flex-1 min-w-0 h-[66px] flex-col justify-center px-7 cursor-pointer rounded-full transition-colors duration-150 relative"
          :class="categoryFocused
            ? 'bg-white dark:bg-surface shadow-sm z-10'
            : (anyFocused ? 'opacity-60 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-neutral-800/60' : 'hover:bg-gray-50 dark:hover:bg-neutral-800/60')"
          @click="toggleCategoryDropdown"
        >
          <span class="text-[11px] font-bold text-gray-900 dark:text-white leading-none mb-0.5">Catégorie</span>
          <div class="flex items-center gap-1">
            <span
              class="text-sm truncate"
              :class="selectedCategory ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'"
            >{{ selectedCategory ? selectedCategory.label : 'Toutes les catégories' }}</span>
            <button
              v-if="selectedCategory"
              class="flex-shrink-0 w-4 h-4 rounded-full bg-gray-400 hover:bg-gray-600 dark:bg-gray-500 dark:hover:bg-gray-300 flex items-center justify-center transition-colors"
              @click.stop="selectCategory(null)"
              tabindex="-1"
            >
              <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Bouton recherche -->
        <div class="pr-1.5 pl-1 flex-shrink-0">
          <button
            @click="performSearch"
            type="submit"
            class="bg-primary-500 hover:bg-primary-600 active:scale-95 text-white rounded-full flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
            :class="isSearchValid || selectedCategory ? 'opacity-100' : 'opacity-90'"
          >
            <!-- Mobile : icône seule -->
            <span class="flex sm:hidden items-center justify-center w-11 h-11">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" />
              </svg>
            </span>
            <!-- Desktop : icône + texte -->
            <span class="hidden sm:flex items-center gap-2 px-5 h-12">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" />
              </svg>
              <span class="text-sm font-semibold whitespace-nowrap">Rechercher</span>
            </span>
          </button>
        </div>
      </div>

      <!-- Dropdown suggestions autocomplete -->
      <transition name="dropdown">
        <div
          v-if="showSuggestions && suggestions.length"
          class="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-surface border border-gray-100 dark:border-gray-700 rounded-3xl shadow-xl z-50 overflow-hidden"
        >
          <ul>
            <li
              v-for="(item, i) in suggestions"
              :key="item.furniture_id"
              class="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              :class="{ 'bg-gray-50 dark:bg-neutral-800': i === activeIndex }"
              @mousedown.prevent="selectSuggestion(item)"
            >
              <img
                v-if="item.cover_url"
                :src="item.cover_url"
                :alt="item.title"
                class="w-10 h-10 object-cover rounded-xl flex-shrink-0 bg-gray-100 dark:bg-neutral-800"
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
          <div class="border-t border-gray-100 dark:border-gray-700 px-5 py-3">
            <button
              class="text-sm text-primary-500 hover:text-primary-600 font-medium w-full text-left"
              @mousedown.prevent="performSearch"
            >
              Voir tous les résultats pour "{{ searchQuery }}"
            </button>
          </div>
        </div>
      </transition>

      <!-- Dropdown catégories -->
      <transition name="dropdown">
        <div
          v-if="showCategoryDropdown && categories.length"
          class="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-surface border border-gray-100 dark:border-gray-700 rounded-3xl shadow-xl z-50 overflow-hidden"
        >
          <div class="p-2 max-h-72 overflow-y-auto">
            <button
              class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              :class="!selectedCategory
                ? 'bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'"
              @click="selectCategory(null)"
            >
              Toutes les catégories
            </button>
            <button
              v-for="cat in categories"
              :key="cat.category_id"
              class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              :class="selectedCategory?.category_id === cat.category_id
                ? 'bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'"
              @click="selectCategory(cat)"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>
      </transition>
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
      showSuggestions: false,
      showCategoryDropdown: false,
      activeIndex: -1,
      searchFocused: false,
      categoryFocused: false,
      selectedCategory: null,
    };
  },

  computed: {
    ...mapStores(useFurnitureStore, useCategoryStore),
    isSearchValid() {
      return this.searchQuery.trim().length > 0;
    },
    anyFocused() {
      return this.searchFocused || this.categoryFocused;
    },
    categories() {
      return this.categoryStore.categories || [];
    },
  },

  methods: {
    onInput() {
      this.activeIndex = -1;
      this.showCategoryDropdown = false;
      clearTimeout(debounceTimer);
      if (this.searchQuery.trim().length < 2) {
        this.suggestions = [];
        this.showSuggestions = false;
        return;
      }
      debounceTimer = setTimeout(async () => {
        this.suggestions = await this.furnitureStore.suggest(this.searchQuery);
        this.showSuggestions = this.suggestions.length > 0;
      }, 280);
    },

    onFocus() {
      if (this.suggestions.length) this.showSuggestions = true;
    },

    onBlur() {
      setTimeout(() => { this.showSuggestions = false; }, 200);
    },

    closeAll() {
      this.showSuggestions = false;
      this.showCategoryDropdown = false;
      this.categoryFocused = false;
      this.activeIndex = -1;
    },

    moveDown() {
      if (!this.showSuggestions) return;
      this.activeIndex = Math.min(this.activeIndex + 1, this.suggestions.length - 1);
    },

    moveUp() {
      if (!this.showSuggestions) return;
      this.activeIndex = Math.max(this.activeIndex - 1, -1);
    },

    selectSuggestion(item) {
      this.closeAll();
      this.$router.push({ name: 'ProductDetail', params: { id: item.furniture_id } });
    },

    toggleCategoryDropdown() {
      this.showCategoryDropdown = !this.showCategoryDropdown;
      this.categoryFocused = this.showCategoryDropdown;
      this.showSuggestions = false;
    },

    selectCategory(cat) {
      this.selectedCategory = cat;
      this.showCategoryDropdown = false;
      this.categoryFocused = false;
    },

    async performSearch() {
      if (!this.isSearchValid && !this.selectedCategory) return;
      this.closeAll();
      this.furnitureStore.q = this.searchQuery.trim();
      this.furnitureStore.categoryId = this.selectedCategory?.category_id || null;
      this.furnitureStore.page = 1;
      const query = {};
      if (this.furnitureStore.q) query.q = this.furnitureStore.q;
      if (this.selectedCategory) {
        query.categoryId = this.selectedCategory.category_id;
        query.categoryLabel = this.selectedCategory.label;
      }
      this.$router.push({ name: 'ResultatRecherche', query });
    },

    handleOutsideClick(e) {
      if (!this.$el.contains(e.target)) {
        this.closeAll();
        this.searchFocused = false;
      }
    },
  },

  mounted() {
    this.$nextTick(() => this.$refs.searchInput?.focus());

    const existingQ = this.$route?.query?.q;
    if (existingQ && typeof existingQ === 'string') {
      this.searchQuery = existingQ;
    }

    if (!this.categoryStore.categories.length) {
      this.categoryStore.fetchCategories();
    }

    document.addEventListener('click', this.handleOutsideClick);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick);
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
  transform: translateY(-6px);
}
</style>
