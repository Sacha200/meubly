<template>
    <div class="comparison-container mb-10">
        <h3 class="comparison-title">Comparaison des prix</h3>
        <div v-if="loading" class="loading-message">
            <div class="loading-spinner"></div>
            <p>Recherche des meilleures offres...</p>
            <p class="loading-subtitle">Comparaison en cours</p>
        </div>
        <div v-else-if="error" class="error-message">
            <p>{{ error }}</p>
        </div>
        
        <!-- Tableau de comparaison -->
        <div v-else class="comparison-table">
            <div v-for="offer in paginatedOffers" :key="offer.id" class="offer-card">
                <div class="offer-details">
                    <div>
                        <div class="company-header">
                            <p class="company-name">{{ offer.company }}</p>
                            <img 
                                :src="getCompanyLogo(offer.company)" 
                                :alt="`Logo de ${offer.company }`" 
                                :class="['company-logo', { 'manomano-logo': isManomano(offer.company) }]"
                                @error="handleImageError"
                                @load="handleImageLoad"
                            />
                        </div>
                        <p class="product-name">{{ offer.description || offer.name }}</p>
                    </div>
                </div>
                <div class="offer-price">
                    <p class="price">{{ offer.price }} €</p>
                    <button class="view-site-button" @click="openProductLink(offer.link)">Voir le site</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { getProviderComparison } from '../../clientapi';

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
            
            // Durée minimale de chargement pour une meilleure UX (2 secondes)
            const minLoadingTime = 2000;
            const startTime = Date.now();
            
            try {
                console.log('Récupération des comparaisons pour la catégorie:', this.product.category_id);
                const data = await getProviderComparison(this.product.category_id);
                
                // Les données sont maintenant directement dans data
                this.allOffers = data || [];
                console.log('Offres récupérées:', this.allOffers);
                
                // Émettre le nombre total d'offres vers le parent
                this.$emit('offers-loaded', this.allOffers.length);
                
                // Déboguer la structure des données
                if (this.allOffers.length > 0) {
                    console.log('Structure du premier élément:', this.allOffers[0]);
                    console.log('Propriétés disponibles:', Object.keys(this.allOffers[0]));
                }
                
                // Calculer le temps restant pour atteindre la durée minimale
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
                
                // Attendre le temps restant si nécessaire
                if (remainingTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, remainingTime));
                }
                
            } catch (error) {
                console.error('Erreur lors du chargement des comparaisons:', error);
                this.error = 'Impossible de charger les comparaisons de prix';
                
                // Même en cas d'erreur, respecter la durée minimale
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
                
                if (remainingTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, remainingTime));
                }
            } finally {
                this.loading = false;
            }
        },
        
        getCompanyLogo(companyName) {
            console.log('Nom de l\'entreprise reçu:', companyName);
            
            // Normaliser le nom de l'entreprise (enlever les espaces, mettre en minuscules)
            const normalizedName = companyName ? companyName.toLowerCase().trim() : '';
            console.log('Nom normalisé:', normalizedName);
            
            // Mapping des logos selon le nom de l'entreprise (avec variations)
            const logoMap = {
                'amazon': '/assets/Amazon_icon.png',
                'ikea': '/assets/ikea-logo.png',
                'manomano': '/assets/manomano.png',
                'but': '/assets/logo_but.png'
            };
            
            const logoPath = logoMap[normalizedName] || '/assets/default-logo.svg';
            console.log('Chemin du logo sélectionné:', logoPath);
            
            return logoPath;
        },
        
        openProductLink(link) {
            if (link) {
                window.open(link, '_blank');
            }
        },
        
        handleImageError(event) {
            console.error('Erreur lors du chargement de l\'image:', event);
        },
        
        handleImageLoad(event) {
            console.log('Image chargée avec succès:', event);
        },
        
        isManomano(companyName) {
            const manomanoNames = ['manomano', 'manomano.fr', 'manomano.com'];
            return manomanoNames.includes(companyName ? companyName.toLowerCase().trim() : '');
        }
    }
};
</script>

<style scoped>
.comparison-title {
    font-family: 'Poppins-Bold';
    color: #3A3A3A;
    margin-bottom: 20px;
}

.comparison-table {
    display: flex;
    flex-direction: column;
    gap: 20px;
    border: 1px solid #D9D9D9;
    border-radius: 10px;
    padding: 30px;
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);
}

.offer-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #fff;
}

.offer-details {
    display: flex;
    align-items: center;
}

.company-header {
    display: flex;
    align-items: center;
    gap: 10px; /* Espace entre le nom et le logo */
    margin-bottom: 5px;
}

.company-logo {
    width: 25px;
    height: auto;
    display: flex;
    align-items: center;
}

.manomano-logo {
    width: 35px; /* Logo ManoMano plus grand */
}

.company-name {
    font-family: 'Poppins-Bold';
    font-size: 16px;
    color: #3A3A3A;
    margin: 0; /* Supprimer les marges par défaut */
}

.product-name {
    font-family: 'Poppins-Medium';
    color: #3A3A3A;
    font-size: 14px;
    margin: 0; /* Supprimer toutes les marges */
}

.offer-price {
    display: flex;
    align-items: center;
}

.price {
    font-family: 'Poppins-SemiBold';
    font-size: 20px;
    color: #3A3A3A;
    margin-right: 20px;
}

.view-site-button {
    padding: 10px 40px;
    background-color: #fff;
    border: 2px solid #B88E2F;
    border-radius: 5px;
    color: #B88E2F;
    cursor: pointer;
    transition: background-color 0.3s;
    font-family: 'Poppins-SemiBold';
    font-size: 16px;
}

.view-site-button:hover {
    background-color: #B88E2F;
    color: #fff;
}

.loading-message, .error-message {
    text-align: center;
    padding: 60px 40px;
    border: 1px solid #D9D9D9;
    border-radius: 10px;
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);
    background-color: #fafafa;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #B88E2F;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-message p {
    font-family: 'Poppins-SemiBold';
    color: #3A3A3A;
    font-size: 18px;
    margin: 10px 0;
}

.loading-subtitle {
    font-family: 'Poppins-Medium' !important;
    color: #666 !important;
    font-size: 14px !important;
    margin-top: 5px !important;
}

.error-message p {
    font-family: 'Poppins-Medium';
    color: #e74c3c;
    font-size: 16px;
}
</style>


