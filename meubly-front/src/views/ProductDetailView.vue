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
                <TableComparison :product="product" :currentPage="currentPage" :rowsPerPage="rowsPerPage"
                    @offers-loaded="handleOffersLoaded" />
                <div class="" v-if="totalOffers > 0">
                    
                </div>
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
            error: null,
            currentPage: 0,
            rowsPerPage: 5,
            totalOffers: 0
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
    methods: {
        handleOffersLoaded(totalCount) {
            this.totalOffers = totalCount;
            console.log("Nombre total d'offres:", totalCount);
        },
     
    },
    watch: {
        currentPage: {
            handler(newVal) {
                console.log("Page changée:", newVal);
            },
        }
    }
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

:deep(.p-paginator) {
    background: transparent;
    border: none;
    padding: 1rem 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

:deep(.p-paginator-page) {
    transition: background-color 0.2s ease, color 0.2s ease;
}


:deep(.p-paginator .p-paginator-pages .p-paginator-page) {
    width: 40px;
    height: 40px;
    margin: 0 4px;
    border-radius: 50%;
    border: none;
    color: #3A3A3A;
    font-family: 'Poppins-Medium';
    transition: all 0.3s ease;
    cursor: pointer;
}

:deep(.p-paginator-page.p-highlight) {
    background-color: #B88E2F !important;
    color: #FFFFFF !important;
    border: 5px solid red;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page:not(.p-highlight):hover) {
    background: rgba(184, 142, 47, 0.1);
    color: #B88E2F;
}

:deep(.p-paginator .p-paginator-first),
:deep(.p-paginator .p-paginator-prev),
:deep(.p-paginator .p-paginator-next),
:deep(.p-paginator .p-paginator-last) {
    width: 40px;
    height: 40px;
    margin: 0 4px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: #3A3A3A;
    padding: revert;
    padding-inline: 12px;
    cursor: pointer;

}

:deep(.p-paginator .p-paginator-first .p-icon),
:deep(.p-paginator .p-paginator-prev .p-icon),
:deep(.p-paginator .p-paginator-next .p-icon),
:deep(.p-paginator .p-paginator-last .p-icon) {
    width: 1rem;
    height: 1rem;
}

:deep(.p-paginator .p-paginator-first:hover),
:deep(.p-paginator .p-paginator-prev:hover),
:deep(.p-paginator .p-paginator-next:hover),
:deep(.p-paginator .p-paginator-last:hover) {
    background: rgba(184, 142, 47, 0.1);
    color: #B88E2F;
    border-radius: 50%;
    cursor: pointer;

}

:deep(.p-paginator .p-paginator-current) {
    margin: 0 8px;
    color: #767676;
    font-family: 'Poppins-Regular';
}
</style>
