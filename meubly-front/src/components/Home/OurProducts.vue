<template>
  <section class="py-4">
    <div class="container mx-auto text-center">
      <h2 class="text-[32px] text-[#3A3A3A]">Nos Produits</h2>
      <div class="grid grid-cols-4 gap-4 mt-4">
        <ProductCard
          v-for="product in products"
          :key="product.id"
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
import ProductCard from '../Home/ProductCard.vue';
import { getProducts } from '../../clientapi';


export default {
  components: {
    ProductCard,
  },
  data() {
    return {
      products: [],
    };
  },
  mounted() {
    getProducts().then(products => {
      this.products = products;
      console.log(this.products);
    });
    
  },
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
