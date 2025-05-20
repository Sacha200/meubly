<template>
    <div class="container mx-auto px-4">
        <h1 class="title-favoris my-4 md:my-6">Mes favoris</h1>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 justify-center max-w-6xl mx-auto"
        >
            <ProductCard
                v-for="product in products"
                :key="product.id"
                :product="product"
                class="rounded-lg shadow-lg overflow-hidden mx-auto w-full max-w-xs sm:max-w-sm"
            />
        </div>
    </div>
</template>

<script>
import ProductCard from '../Home/ProductCard.vue';
import data from '@/data.json'
export default {
    props: {
        product: Object,    
    },
    name: 'ListeFavoris',
    components: {
        ProductCard
    },
    data() {
        return {
            products: data,
        }
    }
   
}
</script>

<style scoped>
.title-favoris {
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-family: 'Poppins-Bold';
    color: #3A3A3A;
    margin-left: 10px;
}
</style>
