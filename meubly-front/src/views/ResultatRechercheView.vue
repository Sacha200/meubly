<template>
    <div>
        <Header />
        <div class="flex mt-10">
            <div class="ml-10">
                <Sidebar />
            </div>
            <div class=" p-4 grid grid-cols-3 " style="gap: 20px;margin: auto;margin-top: 30px;">
                <div v-if="loading" class="col-span-3 text-center">
                    Chargement des produits...
                </div>
                <div v-else-if="error" class="col-span-3 text-center text-red-500">
                    {{ error }}
                </div>
                <template v-else>
                    <ProductCard v-for="product in products" :key="product.id" :product="product" />
                    <div v-if="products.length === 0" class="col-span-3 text-center">
                        Aucun produit ne correspond à votre recherche.
                    </div>
                </template>
            </div>
        </div>
        <Footer />
    </div>
</template>

<script>
import Header from '../components/Header.vue';
import Sidebar from '@/components/Sidebar.vue';
import ProductCard from '../components/Home/ProductCard.vue';
import Footer from '../components/Footer.vue';
import { searchProducts } from '../clientapi';

export default {
    components: {
        Header,
        Sidebar,
        ProductCard,
        Footer,
    },

    data() {
        return {
            products: [],
            loading: true,
            error: null
        };
    },

    async created() {
        await this.fetchProducts();
    },

    watch: {
        '$route.query.q': {
            handler: 'fetchProducts',
            immediate: true
        }
    },

    methods: {
        async fetchProducts() {
            this.loading = true;
            this.error = null;
            
            try {
                const searchQuery = this.$route.query.q || '';
                console.log('Terme de recherche:', searchQuery);
                
                const data = await searchProducts(searchQuery);
                console.log('Données récupérées:', data);
                console.log('Nombre de produits trouvés:', data?.length || 0);
                
                this.products = data;
            } catch (error) {
                console.error('Erreur lors de la récupération des produits:', error);
                this.error = 'Erreur lors de la récupération des produits';
            } finally {
                this.loading = false;
            }
        }
    }
};
</script>

<style scoped>
/* Ajoute des styles globaux si nécessaire */
</style>