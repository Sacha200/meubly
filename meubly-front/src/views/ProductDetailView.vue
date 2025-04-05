<template>
    <div>
        <Header />
        <div class="container d-flex justify-content-center m-auto">
            <ProductDetail v-if="product" :product="product" />
            <TableComparison v-if="product" :product="product" />
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
        };
    },
    mounted() {
        // Supposons que l'ID du produit soit passé via une route ou une autre source
        const productId = this.$route.params.id; // Exemple d'obtention de l'ID depuis les paramètres de route
        if (productId) {
            getProductById(productId).then(product => {
                this.product = product;
                console.log(product);
            }).catch(error => {
                console.error("Erreur lors de la récupération du produit:", error);
            });
        } else {
            console.error("Aucun ID de produit disponible.");
        }
    },
};
</script>
