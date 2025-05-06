<template>

<Header />  
  
  <div class="container mx-auto py-8">
    <h2 class="text-2xl font-bold mb-6">Mes Favoris</h2>
    <div v-if="favorites.length === 0" class="text-gray-500">Aucun favori pour le moment.</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <ProductCard
        v-for="product in favorites"
        :key="product.furniture_id"
        :product="product"
        @favorite-updated="refreshFavorites"
      />
    </div>
  </div>
  <Footer />

</template>

<script>
import ProductCard from '../components/Home/ProductCard.vue';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';


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
    refreshFavorites() {
      this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    }
  }
};
</script> 