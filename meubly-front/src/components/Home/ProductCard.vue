<template>
  <div
    class="group relative flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full">
    <!-- Image Section -->
    <div class="relative h-48 sm:h-64 overflow-hidden bg-gray-100 dark:bg-gray-700">
      <img :src="product.cover_url" :alt="product.title"
        class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" />

      <!-- Favorite Button -->
      <button
        class="absolute top-3 right-3 p-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md hover:scale-110 transition-all duration-300 group/btn"
        :class="{ 'ring-2 ring-primary-500': isFavorite }" @click.stop="toggleFavorite">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
          class="transition-colors duration-300">
          <path
            d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69001C2 5.60001 4.49 3.10001 7.56 3.10001C9.38 3.10001 10.99 3.98001 12 5.34001C13.01 3.98001 14.63 3.10001 16.44 3.10001C19.51 3.10001 22 5.60001 22 8.69001C22 15.69 15.52 19.82 12.62 20.81Z"
            :stroke="isFavorite ? '#b88e2f' : '#6b7280'" :fill="isFavorite ? '#b88e2f' : 'none'" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" class="group-hover/btn:stroke-primary-500" />
        </svg>
      </button>
    </div>

    <!-- Content Section -->
    <div class="flex flex-col flex-grow p-4 bg-white dark:bg-gray-800 pointer-events-none">
      <!-- Title -->
      <h3
        class="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 mb-2 leading-tight min-h-[3rem] pointer-events-auto">
        {{ product.title }}
      </h3>

      <!-- Price & Offers -->
      <div class="mt-auto pointer-events-auto">
        <div class="flex items-center justify-center gap-3 mb-4">
          <span
            class="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {{ product.cached_nb_offers || product.nb_offers || 'Plusieurs' }} offres
          </span>
          <div class="flex items-baseline gap-1.5 text-gray-900 dark:text-white">
            <span class="text-xs text-gray-500 dark:text-gray-400">dès</span>
            <span class="text-lg font-semibold font-sans">
              {{ product.cached_min_price }}€
            </span>
          </div>
        </div>

        <!-- Action Button -->
        <button @click="goToProductDetail()"
          class="w-full py-2.5 px-4 rounded-lg bg-white dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium text-sm sm:text-base hover:border-primary-500 hover:text-primary-500 dark:hover:border-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-300 flex items-center justify-center group-hover:shadow-md active:scale-95">
          Comparer les prix
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { addFavorite, removeFavorite } from '../../api/favoritesApi';

export default {
  props: {
    product: Object,
  },
  data() {
    return {
      isFavorite: false,
    };
  },
  mounted() {
    this.isFavorite = this.checkIfFavorite();
  },
  methods: {
    goToProductDetail() {
      try {
        this.$router.push({ name: 'ProductDetail', params: { id: this.product.furniture_id } });
      } catch (error) {
        console.error('Erreur navigation:', error);
      }
    },
    async toggleFavorite() {
      // Optimistic UI update (Local Storage + Visual)
      let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const index = favorites.findIndex(item => item.furniture_id === this.product.furniture_id);

      const wasFavorite = this.isFavorite;
      // Toggle local state
      this.isFavorite = !wasFavorite;

      if (index === -1) {
        favorites.push(this.product);
      } else {
        favorites.splice(index, 1);
      }
      localStorage.setItem('favorites', JSON.stringify(favorites));
      // Emit with payload for parent handling
      this.$emit('favorite-updated', { id: this.product.furniture_id, isFavorite: this.isFavorite });

      // Backend Sync
      try {
        if (!wasFavorite) {
          await addFavorite(this.product.furniture_id);
        } else {
          await removeFavorite(this.product.furniture_id);
        }
      } catch (e) {
        console.error("Erreur sync favoris:", e);
        // Rollback UI if failed? For now, just log.
        // In real app, we might revert isFavorite and toast error.
      }
    },
    checkIfFavorite() {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      return favorites.some(item => item.furniture_id === this.product.furniture_id);
    }
  },
  watch: {
    product: {
      handler() {
        this.isFavorite = this.checkIfFavorite();
      },
      immediate: true,
    }
  }
};
</script>

<style scoped>
/* Ligne clamp pour le titre pour s'assurer qu'il ne dépasse pas */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
