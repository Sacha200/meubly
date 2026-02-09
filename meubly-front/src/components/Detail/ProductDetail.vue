<template>
    <div class="flex flex-col md:flex-row my-5 md:my-10 gap-4 md:gap-8 lg:gap-20 px-4 md:px-8">
        <!-- Image container -->
        <div class="w-full md:w-1/2 lg:w-1/3">
            <img :src="product.cover_url" :alt="product.title" 
                class="w-full h-[250px] md:h-[358px] object-cover rounded-lg"
            />
        </div>

        <!-- Détails du produit -->
        <div class="w-full md:w-1/2 space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="text-[#3A3A3A] dark:text-white font-bold text-xl md:text-2xl font-['Poppins-Bold']">{{ product.title }}</h2>
                <svg 
                    class="favoris cursor-pointer transition-all duration-300 hover:scale-110" 
                    width="25" 
                    height="22" 
                    viewBox="0 0 25 22" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    @click="toggleFavorite"
                >
                    <path
                        d="M6.875 1.75C3.76888 1.75 1.25 4.07988 1.25 6.95438C1.25 9.2748 2.23437 14.782 11.924 20.3491C12.0976 20.4478 12.2968 20.5 12.5 20.5C12.7032 20.5 12.9024 20.4478 13.076 20.3491C22.7656 14.782 23.75 9.2748 23.75 6.95438C23.75 4.07988 21.2311 1.75 18.125 1.75C15.0189 1.75 12.5 4.90417 12.5 4.90417C12.5 4.90417 9.98112 1.75 6.875 1.75Z"
                        :fill="isFavorite ? '#B88E2F' : 'none'"
                        stroke="#B88E2F" 
                        stroke-width="2" 
                        stroke-linecap="round" 
                        stroke-linejoin="round" 
                    />
                </svg>
            </div>
            <p class="text-[#3A3A3A] dark:text-white font-semibold text-lg md:text-xl font-['Poppins-SemiBold']">{{ product.cached_min_price }} €</p>
            <p class="text-[#767676] dark:text-gray-300 text-sm md:text-base font-medium font-['Poppins-Medium']">{{ product.description }}</p>

            <!-- Dimensions (si disponibles) -->
            <div v-if="hasAnyDimension" class="pt-2">
                <p class="text-[#3A3A3A] dark:text-white font-semibold text-sm md:text-base">Dimensions</p>
                <p class="text-[#767676] dark:text-gray-300 text-sm md:text-base font-medium">
                    <span v-if="product.size_width != null">L {{ formatDim(product.size_width) }} cm</span>
                    <span v-if="product.size_height != null"> · H {{ formatDim(product.size_height) }} cm</span>
                    <span v-if="product.size_depth != null"> · P {{ formatDim(product.size_depth) }} cm</span>
                </p>
            </div>
            <div v-else class="pt-2">
                <p class="text-[#3A3A3A] dark:text-white font-semibold text-sm md:text-base">Dimensions</p>
                <p class="text-[#767676] dark:text-gray-300 text-sm md:text-base font-medium">
                    Non renseignées
                </p>
            </div>
        </div>
    </div>
</template>

<script>
import { addFavorite, removeFavorite } from '../../api/favoritesApi';

export default {
    name: 'ProductDetail',
    props: {
        product: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            isFavorite: false
        }
    },
    computed: {
        hasAnyDimension() {
            return this.product?.size_width != null || this.product?.size_height != null || this.product?.size_depth != null
        }
    },
    mounted() {
        this.checkIfFavorite();
    },
    methods: {
        formatDim(v) {
            const n = Number(v)
            if (Number.isNaN(n)) return v
            // affiche sans décimales si entier
            return Number.isInteger(n) ? String(n) : n.toFixed(1)
        },
        async toggleFavorite() {
            let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            
            if (this.isFavorite) {
                favorites = favorites.filter(fav => fav.furniture_id !== this.product.furniture_id);
                this.isFavorite = false;
            } else {
                if (!favorites.some(fav => fav.furniture_id === this.product.furniture_id)) {
                    favorites.push(this.product);
                }
                this.isFavorite = true;
            }
            
            localStorage.setItem('favorites', JSON.stringify(favorites));
            this.$emit('favorite-updated');

            try {
                if (this.isFavorite) {
                    await addFavorite(this.product.furniture_id);
                } else {
                    await removeFavorite(this.product.furniture_id);
                }
            } catch (e) {
                console.error("Erreur sync favoris:", e?.message ?? e);
            }
        },
        checkIfFavorite() {
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            this.isFavorite = favorites.some(fav => fav.furniture_id === this.product.furniture_id);
        }
    }
};
</script>

<style scoped>
</style>
