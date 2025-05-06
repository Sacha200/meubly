<template>
    <div>
        <Header />
        <div class="container d-flex justify-content-center m-auto">
            <div v-if="loading" class="loading">
                Chargement...
            </div>
            <div v-else-if="error" class="error">
                {{ error }}
            </div>
            <div v-else-if="product" class="product-detail">
                <ProductDetail :product="product" />
                <TableComparison :product="product" />
            </div>
        </div>
        <Footer />
    </div>
</template>

<script>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import ProductDetail from '../components/Detail/ProductDetail.vue';
import TableComparison from '../components/Detail/TableComparison.vue';
import { getProductById } from '../clientapi';

export default {
    components: {
        Header,
        Footer,
        ProductDetail,
        TableComparison,
    },
    data() {
        return {
            product: null,
            loading: true,
            error: null
        };
    },
    async created() {
        try {
            this.loading = true;
            this.error = null;
            const id = this.$route.params.id;
            console.log("ID recherché:", id); // Pour le débogage
            
            this.product = await getProductById(id);
            console.log("Produit récupéré:", this.product); // Pour le débogage
        } catch (error) {
            console.error("Erreur complète:", error);
            this.error = `Impossible de charger le produit: ${error.message}`;
        } finally {
            this.loading = false;
        }
    },
};
</script>

<style scoped>
.loading {
    text-align: center;
    padding: 20px;
}

.error {
    color: red;
    text-align: center;
    padding: 20px;
}
</style>
