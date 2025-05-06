<template>
  <section class="py-4">
    <div class="container mx-auto text-center">
      <h2 class="text-[32px] text-[#3A3A3A]">Nos Produits</h2>
      
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-4">
        Chargement des produits...
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center text-red-500 py-4">
        {{ error }}
      </div>

      <!-- Products grid -->
      <div v-else class="grid grid-cols-4 gap-4 mt-4">
        <ProductCard
          v-for="product in products"
          :key="product.furniture_id"
          :product="product"
        />
      </div>

      <button class="button_more font-semibold mt-8 px-6 py-2 text-[16px] text-[#B88E2F] border border-[#B88E2F] rounded-full">
        Voir plus
      </button>
    </div>
  </section>
</template>

<script>
import ProductCard from './ProductCard.vue';
import { getProducts } from '../../clientapi';

export default {
  components: {
    ProductCard,
  },
  data() {
    return {
      products: [],
      loading: true,
      error: null
    };
  },
  async created() {
    try {
      this.loading = true;
      this.error = null;
      
      // Récupérer les produits via l'API
      const products = await getProducts();
      console.log('Produits récupérés:', products);
      
      this.products = products;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      this.error = "Impossible de charger les produits";
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.button_more{
  width: 245px;
  border-radius: 10px;
}

.button_more:hover{
 color: white;
 background-color: #B88E2F;
 cursor: pointer;
}

h2{
  font-family: 'Poppins-Bold';
}
</style>
