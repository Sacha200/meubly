<!-- SearchBar.vue -->
<template>
  <!-- Search Bar Container -->
  <div class="flex justify-center py-14">
    <!-- Search Input Container -->
    <div
      class="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full w-[676px] h-[71px] shadow-sm dark:shadow-gray-900/30">
      <!-- Input Section -->
      <div class="flex-1 px-8">
        <!-- Label -->
        <div class="text-[12px] search_bar_title text text-[#222222] dark:text-white">
          Produits
        </div>

        <!-- Search Input Field -->
        <input type="text" v-model="searchQuery" placeholder="Rechercher un type de produit"
          class="w-full text-[14px] text-[#6A6A6A] dark:text-gray-300 bg-transparent focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
          @keyup.enter="performSearch" />
      </div>

      <!-- Search Button -->
      <button @click="performSearch"
        class="bg-[#B88E2F] text-white rounded-full w-12 h-12 flex items-center justify-center mr-4 button_search hover:bg-[#A67B1F] transition-colors duration-200"
        :disabled="!isSearchValid" :class="{ 'opacity-50 cursor-not-allowed': !isSearchValid }">
        <!-- Search Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
/**
 * SearchBar Component
 * 
 * A search component that allows users to search for products.
 * Features:
 * - Real-time search input
 * - Enter key support
 * - Responsive design with dark mode support
 * - Navigation to search results page
 */
export default {
  name: 'SearchBar',

  data() {
    return {
      // Current search query entered by the user
      searchQuery: '',
    };
  },

  computed: {
    /**
     * Check if the search query is valid (not empty after trimming)
     * @returns {boolean} True if search query is valid
     */
    isSearchValid() {
      return this.searchQuery.trim().length > 0;
    },
  },

  methods: {
    /**
     * Perform the search operation
     * Navigates to the search results page with the current query
     */
    performSearch() {
      // Only proceed if search query is valid
      if (this.isSearchValid) {
        // Navigate to search results page with query parameter
        this.$router.push({
          name: 'ResultatRecherche',
          query: {
            q: this.searchQuery.trim()
          },
        });
      }
    },

    /**
     * Clear the search input
     */
    clearSearch() {
      this.searchQuery = '';
    },
  },

  // Component lifecycle hooks
  mounted() {
    // Focus the search input when component is mounted
    this.$nextTick(() => {
      const searchInput = this.$el.querySelector('input');
      if (searchInput) {
        searchInput.focus();
      }
    });
  },
};
</script>

<style scoped>
/* Search button styling */
.button_search {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.button_search:hover:not(:disabled) {
  transform: scale(1.05);
}

.button_search:active:not(:disabled) {
  transform: scale(0.95);
}

/* Search bar title styling */
.search_bar_title {
  font-family: "Poppins-SemiBold";
}

/* Input field focus styling */
input:focus {
  outline: none;
  border-color: #B88E2F;
}

/* Responsive design adjustments */
@media (max-width: 768px) {
  .search-container {
    width: 90%;
    max-width: 500px;
  }
}

@media (max-width: 480px) {
  .search-container {
    width: 95%;
    height: 60px;
  }

  .button_search {
    width: 40px;
    height: 40px;
  }
}
</style>
