<template>
    <div class="mb-10">
        <h3 :class="['text-2xl font-bold mb-5', isDarkMode ? 'text-gray-100' : 'text-gray-800']">Comparaison des prix</h3>
        
        <!-- État de chargement -->
        <div v-if="loading" :class="['text-center py-16 px-10 border rounded-lg shadow-lg min-h-[200px] flex flex-col justify-center items-center', isDarkMode ? 'border-gray-700 shadow-gray-900/30 bg-gray-800' : 'border-gray-200 bg-gray-50']">
            <div :class="['w-10 h-10 border-4 rounded-full animate-spin mb-5', isDarkMode ? 'border-gray-600 border-t-primary-500' : 'border-gray-200 border-t-primary-500']"></div>
            <p :class="['font-semibold text-lg mb-2', isDarkMode ? 'text-gray-200' : 'text-gray-800']">Recherche des meilleures offres...</p>
            <p :class="['font-medium text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">Comparaison en cours</p>
        </div>
        
        <!-- État d'erreur -->
        <div v-else-if="error" :class="['text-center py-16 px-10 border rounded-lg shadow-lg min-h-[200px] flex flex-col justify-center items-center', isDarkMode ? 'border-gray-700 shadow-gray-900/30 bg-gray-800' : 'border-gray-200 bg-gray-50']">
            <p :class="['font-medium text-base', isDarkMode ? 'text-red-400' : 'text-red-600']">{{ error }}</p>
        </div>
        
        <!-- Tableau de comparaison -->
        <div v-else :class="['flex flex-col gap-5 border rounded-lg p-8 shadow-lg', isDarkMode ? 'border-gray-700 shadow-gray-900/30 bg-gray-800' : 'border-gray-200 bg-white']">
            <div v-for="offer in paginatedOffers" :key="offer.id" :class="['flex justify-between items-center p-6 border rounded-lg hover:shadow-md transition-shadow', isDarkMode ? 'border-gray-600 bg-gray-700 hover:shadow-gray-900/50' : 'border-gray-200 bg-white']">
                <div class="flex items-center">
                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <p :class="['font-bold text-base', isDarkMode ? 'text-gray-100' : 'text-gray-800']">{{ offer.company }}</p>
                            <img 
                                :src="getCompanyLogo(offer.company)" 
                                :alt="`Logo de ${offer.company}`" 
                                :class="['h-auto flex items-center', isManomano(offer.company) ? 'w-9' : 'w-6']"
                                @error="handleImageError"
                            />
                        </div>
                        <p :class="['font-medium text-sm', isDarkMode ? 'text-gray-200' : 'text-gray-800']">{{ offer.description || offer.name }}</p>
                    </div>
                </div>
                <div class="flex items-center">
                    <p :class="['font-semibold text-xl mr-5', isDarkMode ? 'text-gray-100' : 'text-gray-800']">{{ offer.price }} €</p>
                    <button :class="['px-10 py-2.5 border-2 border-primary-500 rounded cursor-pointer transition-colors font-semibold text-base hover:bg-primary-500 hover:text-white', isDarkMode ? 'bg-gray-600 text-primary-400' : 'bg-white text-primary-500']" @click="openProductLink(offer.link)">Voir le site</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { getProviderComparison } from '../../clientapi';
import { useThemeStore } from '../../stores/themeStore';
import { computed } from 'vue';

export default {
    name: 'TableComparison',
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
                const data = await getProviderComparison(this.product.category_id);
                this.allOffers = data || [];
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
        
        getCompanyLogo(companyName) {
            const normalizedName = companyName ? companyName.toLowerCase().trim() : '';
            
            const logoMap = {
                'amazon': '/assets/Amazon_icon.png',
                'ikea': '/assets/ikea-logo.png',
                'manomano': '/assets/manomano.png',
                'but': '/assets/logo_but.png'
            };
            
            return logoMap[normalizedName] || '/assets/default-logo.svg';
        },
        
        openProductLink(link) {
            if (link) {
                window.open(link, '_blank');
            }
        },
        
        handleImageError(event) {
            // Gestion silencieuse des erreurs d'image
            event.target.style.display = 'none';
        },
        
        isManomano(companyName) {
            const manomanoNames = ['manomano', 'manomano.fr', 'manomano.com'];
            return manomanoNames.includes(companyName ? companyName.toLowerCase().trim() : '');
        }
    }
};
</script>


