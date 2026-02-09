<template>
  <!-- Search Bar Container -->
  <div class="w-full mb-8" data-testid="search-bar">
    <!-- Search Input Container -->
    <div
      class="flex items-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl w-full h-[72px] shadow-sm hover:shadow-md transition-shadow duration-300 focus-within:ring-2 focus-within:ring-primary-500/20">
      <!-- Input Section -->
      <div class="flex-1 px-6">
        <!-- Label -->
        <div class="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
          Rechercher
        </div>

        <!-- Search Input Field -->
        <input ref="searchInput" type="text" v-model="searchQuery" placeholder="Quel meuble cherchez-vous ?"
          class="w-full text-base sm:text-lg text-gray-800 dark:text-white bg-transparent focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 font-medium"
          @keyup.enter="performSearch" />
      </div>

      <!-- Search Button -->
      <button @click="performSearch" type="submit"
        class="bg-[#B88E2F] text-white rounded-lg w-12 h-12 flex items-center justify-center mr-3 button_search hover:bg-[#a47e2a] active:scale-95 transition-all duration-200 shadow-sm"
        :disabled="!isSearchValid" :class="{ 'opacity-50 cursor-not-allowed': !isSearchValid }">
        <!-- Search Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useFurnitureStore } from '@/stores/furnitureStore'

export default {
  name: 'SearchBar',

  data() {
    return {
      searchQuery: '',
    };
  },

  computed: {
    ...mapStores(useFurnitureStore), // -> this.furnitureStore
    isSearchValid() {
      return this.searchQuery.trim().length > 0;
    },
  },

  methods: {
    async performSearch() {
      if (!this.isSearchValid) return;

      this.furnitureStore.q = this.searchQuery.trim();
      this.furnitureStore.page = 1;

      try {
        await this.furnitureStore.fetch();
      } catch (e) {
        console.error('Erreur recherche:', e);
      }

      this.$router.push({
        name: 'ResultatRecherche',
        query: { q: this.furnitureStore.q }
      });
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.$refs.searchInput?.focus();
    });

    const existingQ = this.$route?.query?.q;
    if (existingQ && typeof existingQ === 'string') {
      this.searchQuery = existingQ;
    }
  }
};
</script>

<style scoped>
.button_search {
  cursor: pointer;
}
</style>
