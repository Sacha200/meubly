<template>
    <div>
        <Header />
        <div class="flex mt-10">
            <div class="ml-10">
                <Sidebar />
            </div>
            <div class=" p-4 grid grid-cols-3 " style="gap: 20px;margin: auto;margin-top: 30px;">
                <ProductCard v-for="product in products" :key="product.id" :product="product" />
            </div>
        </div>
        <Footer />
    </div>
</template>

<script>
import Header from '../components/Header.vue';
import Sidebar from '@/components/Sidebar.vue';
import ProductCard from '../components/Home/ProductCard.vue';
import data from '@/data.json'

import Footer from '../components/Footer.vue';

export default {
    components: {
        Header,
        Sidebar,
        ProductCard,
        Footer,
    },

    data() {
    return {
      products: data,
    };
  },
};
</script>

<style scoped>
/* Ajoute des styles globaux si nécessaire */
</style>