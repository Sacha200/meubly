<template>
    <div class="container">
        <h1 class="title-favoris my-6">Mes favoris</h1>
        <div class="p-4  flex justify-center gap-4" style="margin-top: 30px;">
            <ProductCard
                v-for="product in products"
                :key="product.id"
                :product="product"
                class="rounded-lg shadow-lg overflow-hidden flex-1"
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
    font-size: 32px;
    font-family: 'Poppins-Bold';
    color: #3A3A3A;
    margin-left: 10px;
}
</style>
