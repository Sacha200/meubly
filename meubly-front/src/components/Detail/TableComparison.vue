<template>
    <div class="mb-10">
        <h3 :class="['text-2xl font-bold mb-5', isDarkMode ? 'text-gray-100' : 'text-gray-800']">Comparaison des prix
        </h3>

        <!-- État de chargement -->
        <div v-if="loading"
            :class="['text-center py-16 px-10 border rounded-lg shadow-lg min-h-[200px] flex flex-col justify-center items-center', isDarkMode ? 'border-gray-700 shadow-gray-900/30 bg-gray-800' : 'border-gray-200 bg-gray-50']">
            <div
                :class="['w-10 h-10 border-4 rounded-full animate-spin mb-5', isDarkMode ? 'border-gray-600 border-t-primary-500' : 'border-gray-200 border-t-primary-500']">
            </div>
            <p :class="['font-semibold text-lg mb-2', isDarkMode ? 'text-gray-200' : 'text-gray-800']">Recherche des
                meilleures offres...</p>
            <p :class="['font-medium text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">Comparaison en cours</p>
        </div>

        <!-- État d'erreur -->
        <div v-else-if="error"
            :class="['text-center py-16 px-10 border rounded-lg shadow-lg min-h-[200px] flex flex-col justify-center items-center', isDarkMode ? 'border-gray-700 shadow-gray-900/30 bg-gray-800' : 'border-gray-200 bg-gray-50']">
            <p :class="['font-medium text-base', isDarkMode ? 'text-red-400' : 'text-red-600']">{{ error }}</p>
        </div>

        <!-- Tableau de comparaison -->
        <div v-else
            :class="['flex flex-col gap-5 border rounded-lg p-8 shadow-lg', isDarkMode ? 'border-gray-700 shadow-gray-900/30 bg-gray-800' : 'border-gray-200 bg-white']">
            <div v-for="offer in paginatedOffers" :key="offer.id"
                :class="['flex justify-between items-center p-6 border rounded-lg hover:shadow-md transition-shadow', isDarkMode ? 'border-gray-600 bg-gray-700 hover:shadow-gray-900/50' : 'border-gray-200 bg-white']">
                <div class="flex items-center">
                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <p :class="['font-bold text-base', isDarkMode ? 'text-gray-100' : 'text-gray-800']">{{
                                offer.company }}</p>
                            <img :src="offer.logo" :alt="`Logo de ${offer.company}`"
                                :class="['h-auto flex items-center', isManomano(offer.company) ? 'w-9' : 'w-6']"
                                @error="handleImageError" />
                        </div>
                        <p :class="['font-medium text-sm', isDarkMode ? 'text-gray-200' : 'text-gray-800']">
                            {{ offer.external_title || offer.link || 'Offre' }}
                        </p>
                    </div>
                </div>
                <div class="flex items-center">
                    <p :class="['font-semibold text-xl mr-5', isDarkMode ? 'text-gray-100' : 'text-gray-800']">{{
                        offer.price }} €</p>
                    <button
                        :class="['px-10 py-2.5 border-2 border-primary-500 rounded cursor-pointer transition-colors font-semibold text-base hover:bg-primary-500 hover:text-white', isDarkMode ? 'bg-gray-600 text-primary-400' : 'bg-white text-primary-500']"
                        @click="openProductLink(offer.link)">Voir le site</button>
                </div>
            </div>
        </div>

        <!-- Pagination pour le tableau de comparaison -->
        <div v-if="!loading && !error && allOffers.length > rowsPerPage" class="mt-6">
            <Paginator :rows="rowsPerPage" :totalRecords="allOffers.length" @page="onPageChange"
                :first="currentPage * rowsPerPage" />
        </div>
    </div>
</template>

<script>
import { getFurnitureOffers } from '../../api/offersApi';
import { useThemeStore } from '../../stores/themeStore';
import { computed } from 'vue';
import Paginator from 'primevue/paginator';

export default {
    name: 'TableComparison',
    components: {
        Paginator
    },
    props: {
        product: {
            type: Object,
            required: true
        },
        currentPage: {
            type: Number,
            default: 0
        },
        rowsPerPage: {
            type: Number,
            default: 5
        }
    },
    setup() {
        const themeStore = useThemeStore();
        const isDarkMode = computed(() => themeStore.isDarkMode);

        return { isDarkMode };
    },
    data() {
        return {
            allOffers: [],
            loading: false,
            error: null
        };
    },
    computed: {
        paginatedOffers() {
            const start = this.currentPage * this.rowsPerPage;
            const end = start + this.rowsPerPage;
            return this.allOffers.slice(start, end);
        }
    },
    async mounted() {
        await this.loadComparisons();
    },
    methods: {
        async loadComparisons() {
            this.loading = true;
            this.error = null;

            const minLoadingTime = 2000;
            const startTime = Date.now();

            try {
                const data = await getFurnitureOffers(this.product.furniture_id || this.product.id);
                this.allOffers = (data || []).map(offer => ({
                    id: offer.offer_id,
                    company: offer.Partner?.name || 'Inconnu',
                    logo: offer.Partner?.logo_url || '/assets/default-logo.svg',
                    external_title: offer.external_title ?? offer.externalTitle ?? offer.title ?? null,
                    price: offer.price ?? offer.Price ?? null,
                    link: offer.url_website ?? offer.urlWebsite ?? offer.url ?? null
                }));
                this.$emit('offers-loaded', this.allOffers.length);

                // Respecter la durée minimale de chargement
                await this.waitForMinLoadingTime(startTime, minLoadingTime);

            } catch (error) {
                console.error('Erreur lors du chargement des comparaisons:', error);
                this.error = 'Impossible de charger les comparaisons de prix';
                await this.waitForMinLoadingTime(startTime, minLoadingTime);
            } finally {
                this.loading = false;
            }
        },

        async waitForMinLoadingTime(startTime, minLoadingTime) {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }
        },

        openProductLink(link) {
            if (link) {
                window.open(link, '_blank');
            }
        },

        handleImageError(event) {
            event.target.style.display = 'none';
        },

        isManomano(companyName) {
            const manomanoNames = ['manomano', 'manomano.fr', 'manomano.com'];
            return manomanoNames.includes(companyName ? companyName.toLowerCase().trim() : '');
        },

        onPageChange(event) {
            this.$emit('page-change', event.page);
        }
    }
};
</script>

<style scoped>
/* Styles pour Paginator avec support mode sombre */
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

/* Mode sombre */
:deep(.dark .p-paginator .p-paginator-pages .p-paginator-page) {
    color: #E5E7EB;
}

:deep(.dark .p-paginator .p-paginator-pages .p-paginator-page:not(.p-highlight):hover) {
    background: rgba(184, 142, 47, 0.2);
    color: #B88E2F;
}

:deep(.dark .p-paginator .p-paginator-first),
:deep(.dark .p-paginator .p-paginator-prev),
:deep(.dark .p-paginator .p-paginator-next),
:deep(.dark .p-paginator .p-paginator-last) {
    color: #E5E7EB;
}

:deep(.dark .p-paginator .p-paginator-first:hover),
:deep(.dark .p-paginator .p-paginator-prev:hover),
:deep(.dark .p-paginator .p-paginator-next:hover),
:deep(.dark .p-paginator .p-paginator-last:hover) {
    background: rgba(184, 142, 47, 0.2);
    color: #B88E2F;
}

:deep(.dark .p-paginator .p-paginator-current) {
    color: #9CA3AF;
}
</style>
