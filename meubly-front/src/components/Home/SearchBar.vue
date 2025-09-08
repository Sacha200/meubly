<!-- SearchBar.vue -->
<template>
  <!-- Search Bar Container -->
  <div class="flex justify-center py-14" data-testid="search-bar">
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
        <input ref="searchInput" type="text" v-model="searchQuery" placeholder="Rechercher un type de produit"
          class="w-full text-[14px] text-[#6A6A6A] dark:text-gray-300 bg-transparent focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
          @keyup.enter="performSearch" />
      </div>

      <!-- Search Button -->
      <button @click="performSearch" type="submit"
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

      // 1) alimente le store pour la recherche serveur
      this.furnitureStore.q = this.searchQuery.trim();
      this.furnitureStore.page = 1;

      // (optionnel) tu peux fetch ici pour précharger avant d'arriver sur la page résultats
      try {
        await this.furnitureStore.fetch();
      } catch (e) {
        // en cas d'erreur, tu peux afficher un toast ici
      }

      // 2) navigue vers la page résultats (si tu veux rester sur Home, commente ce bloc)
      this.$router.push({
        name: 'ResultatRecherche',
        query: { q: this.furnitureStore.q }
      });
    },

    clearSearch() {
      this.searchQuery = '';
    },
  },

  mounted() {
    // focus auto
    this.$nextTick(() => {
      if (this.$refs.searchInput) {
        this.$refs.searchInput.focus();
      }
    });

    // si l'URL contient déjà ?q=..., on initialise le champ
    const existingQ = this.$route?.query?.q;
    if (existingQ && typeof existingQ === 'string') {
      this.searchQuery = existingQ;
    }
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
