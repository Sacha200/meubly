<template>

  <Header />

  <div class="container mx-auto py-8">
    <h2 class="text-2xl font-bold mb-6">Mes Favoris</h2>
    <div v-if="favorites.length === 0" class="text-gray-500">Aucun favori pour le moment.</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <ProductCard v-for="product in favorites" :key="product.furniture_id" :product="product"
        @favorite-updated="handleFavoriteUpdate" />
    </div>
  </div>
  <Footer />

</template>

<script>
import ProductCard from '../components/Home/ProductCard.vue';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import { getUserFavorites } from '../api/favoritesApi';
import { isUserLoggedIn } from '../api/authApi';

export default {
  components: { ProductCard, Header, Footer },
  data() {
    return {
      favorites: [],
    };
  },
  mounted() {
    this.refreshFavorites();
  },
  methods: {
    handleFavoriteUpdate({ id, isFavorite }) {
      // Optimistic Remove from List (if un-favorited)
      if (!isFavorite) {
        this.favorites = this.favorites.filter(f => f.furniture_id !== id);
        // Also update local storage to match
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
      } else {
        // If added (unlikely on favorites page, but possible if undo?), refresh
        this.refreshFavorites();
      }
    },
    async refreshFavorites() {
      // 1. Try to fetch from Backend first if logged in
      const loggedIn = await isUserLoggedIn();
      if (loggedIn) {
        try {
          const serverFavs = await getUserFavorites();
          // Sync Server -> Local (Source of Truth)
          this.favorites = serverFavs;
          localStorage.setItem('favorites', JSON.stringify(serverFavs));
        } catch (e) {
          console.error("Failed to fetch favorites from server", e);
          // Fallback to local
          this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        }
      } else {
        // Offline / Guest mode
        this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      }
    }
  }
};
</script>