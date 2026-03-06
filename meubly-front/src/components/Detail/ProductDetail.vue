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
            <!-- Description : enrichie IA si disponible, sinon brute -->
            <p class="text-[#767676] dark:text-gray-300 text-sm md:text-base font-medium font-['Poppins-Medium']">
                {{ product.ai_description || product.description }}
            </p>

            <!-- Tags IA -->
            <div v-if="product.ai_tags && product.ai_tags.length" class="flex flex-wrap gap-2 pt-1">
                <span
                    v-for="tag in product.ai_tags"
                    :key="tag"
                    class="ai-tag"
                >{{ tag }}</span>
                <span v-if="product.ai_style" class="ai-tag ai-tag--style">{{ product.ai_style }}</span>
                <span v-if="product.ai_material" class="ai-tag ai-tag--material">{{ product.ai_material }}</span>
            </div>

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

            <!-- AI Scene Generation -->
            <div class="ai-scene-section">
                <div class="ai-scene-header">
                    <span class="ai-scene-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#B88E2F" stroke="#B88E2F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Mise en scène IA
                    </span>
                    <span class="ai-badge">Bêta</span>
                </div>

                <!-- Formulaire de génération -->
                <div v-if="!generatedImage">
                    <div class="ai-input-group">
                        <label class="ai-label">
                            Description de la scène
                            <span v-if="product.ai_scene_prompt" class="ai-label-auto" title="Pré-rempli automatiquement par l'IA">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                                Suggéré par l'IA
                            </span>
                        </label>
                        <input
                            v-model="aiPrompt"
                            type="text"
                            class="ai-input"
                            placeholder="Ex: salon scandinave lumineux, parquet chêne..."
                            :disabled="aiLoading"
                        />
                    </div>

                    <button
                        @click="handleGenerateScene"
                        :disabled="aiLoading || !aiPrompt"
                        class="ai-btn"
                    >
                        <span v-if="aiLoading" class="ai-spinner"></span>
                        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" stroke="white" stroke-width="1.5"/>
                        </svg>
                        {{ aiLoading ? 'Génération en cours...' : 'Générer la mise en scène' }}
                    </button>
                    <p class="ai-hint">Environ 20 secondes · Alimenté par l'IA</p>
                </div>

                <!-- Résultat -->
                <div v-else class="ai-result">
                    <div class="ai-result-image-wrapper">
                        <img :src="generatedImage" alt="Mise en scène générée" class="ai-result-image" />
                        <div class="ai-result-overlay">
                            <a :href="generatedImage" target="_blank" class="ai-overlay-btn" title="Voir en grand">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                                    <polyline points="15,3 21,3 21,9"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                    <div class="ai-result-footer">
                        <span class="ai-success-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B88E2F" stroke-width="2.5">
                                <polyline points="20,6 9,17 4,12"/>
                            </svg>
                            Scène générée avec succès
                        </span>
                        <button @click="generatedImage = null" class="ai-retry-btn">
                            Générer une autre version
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { addFavorite, removeFavorite } from '../../api/favoritesApi';
import { useFurnitureStore } from '../../stores/furnitureStore';
import { mapActions } from 'pinia';

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
            isFavorite: false,
            aiPrompt: '',
            aiLoading: false,
            generatedImage: null
        }
    },
    computed: {
        hasAnyDimension() {
            return this.product?.size_width != null || this.product?.size_height != null || this.product?.size_depth != null
        }
    },
    mounted() {
        this.checkIfFavorite();
        this.initAiPrompt();
    },
    watch: {
        'product.furniture_id'() {
            this.initAiPrompt();
            this.generatedImage = null;
        }
    },
    methods: {
        ...mapActions(useFurnitureStore, ['generateLifestyleImage']),

        initAiPrompt() {
            this.aiPrompt = this.product?.ai_scene_prompt || 'salon moderne et lumineux, parquet bois clair, plantes vertes';
        },
        
        async handleGenerateScene() {
            if (!this.aiPrompt) return;
            
            this.aiLoading = true;
            try {
                const result = await this.generateLifestyleImage(this.product.cover_url, this.aiPrompt);
                this.generatedImage = result.url;
            } catch (error) {
                alert("Erreur lors de la génération : " + error.message);
            } finally {
                this.aiLoading = false;
            }
        },

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
/* Tags IA */
.ai-tag {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    font-family: 'Poppins-Medium', sans-serif;
    font-size: 0.72rem;
    background: rgba(184, 142, 47, 0.08);
    color: #B88E2F;
    border: 1px solid rgba(184, 142, 47, 0.25);
    white-space: nowrap;
}

.ai-tag--style {
    background: rgba(99, 102, 241, 0.08);
    color: #6366f1;
    border-color: rgba(99, 102, 241, 0.25);
}

.ai-tag--material {
    background: rgba(16, 185, 129, 0.08);
    color: #059669;
    border-color: rgba(16, 185, 129, 0.25);
}

:global(.dark) .ai-tag {
    background: rgba(184, 142, 47, 0.15);
    border-color: rgba(184, 142, 47, 0.35);
}

:global(.dark) .ai-tag--style {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.35);
    color: #818cf8;
}

:global(.dark) .ai-tag--material {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.35);
    color: #34d399;
}

.ai-scene-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(184, 142, 47, 0.2);
}

.ai-scene-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.ai-scene-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: 'Poppins-SemiBold', sans-serif;
    font-size: 1rem;
    color: #3A3A3A;
}

:global(.dark) .ai-scene-title {
    color: #fff;
}

.ai-badge {
    font-size: 0.65rem;
    font-family: 'Poppins-Medium', sans-serif;
    background: rgba(184, 142, 47, 0.12);
    color: #B88E2F;
    border: 1px solid rgba(184, 142, 47, 0.3);
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    letter-spacing: 0.03em;
}

.ai-input-group {
    margin-bottom: 0.75rem;
}

.ai-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: 'Poppins-Medium', sans-serif;
    font-size: 0.8rem;
    color: #767676;
    margin-bottom: 0.35rem;
}

.ai-label-auto {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.68rem;
    color: #B88E2F;
    font-family: 'Poppins-Regular', sans-serif;
}

.ai-input {
    width: 100%;
    padding: 0.6rem 0.85rem;
    border: 1px solid #e0d5c0;
    border-radius: 8px;
    font-family: 'Poppins-Regular', sans-serif;
    font-size: 0.85rem;
    color: #3A3A3A;
    background: #faf8f4;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
}

.ai-input:focus {
    border-color: #B88E2F;
    box-shadow: 0 0 0 3px rgba(184, 142, 47, 0.12);
}

.ai-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

:global(.dark) .ai-input {
    background: #1e1e1e;
    border-color: #3a3530;
    color: #fafafa;
}

:global(.dark) .ai-input:focus {
    border-color: #B88E2F;
}

.ai-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.7rem 1.2rem;
    background: #B88E2F;
    color: white;
    border: none;
    border-radius: 8px;
    font-family: 'Poppins-SemiBold', sans-serif;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(184, 142, 47, 0.3);
}

.ai-btn:hover:not(:disabled) {
    background: #a07828;
    box-shadow: 0 4px 14px rgba(184, 142, 47, 0.45);
    transform: translateY(-1px);
}

.ai-btn:active:not(:disabled) {
    transform: translateY(0);
}

.ai-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.ai-hint {
    margin-top: 0.45rem;
    font-size: 0.72rem;
    color: #9e9e9e;
    font-family: 'Poppins-Regular', sans-serif;
    text-align: center;
}

/* Spinner */
.ai-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: white;
    border-radius: 50%;
    animation: ai-spin 0.7s linear infinite;
    flex-shrink: 0;
}

@keyframes ai-spin {
    to { transform: rotate(360deg); }
}

/* Résultat */
.ai-result {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.ai-result-image-wrapper {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.ai-result-image {
    width: 100%;
    display: block;
    border-radius: 10px;
}

.ai-result-overlay {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.4rem;
    opacity: 0;
    transition: opacity 0.2s;
}

.ai-result-image-wrapper:hover .ai-result-overlay {
    opacity: 1;
}

.ai-overlay-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255,255,255,0.92);
    border-radius: 50%;
    color: #3A3A3A;
    text-decoration: none;
    transition: background 0.15s;
}

.ai-overlay-btn:hover {
    background: white;
}

.ai-result-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.ai-success-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-family: 'Poppins-Medium', sans-serif;
    font-size: 0.8rem;
    color: #B88E2F;
}

.ai-retry-btn {
    font-family: 'Poppins-Medium', sans-serif;
    font-size: 0.78rem;
    color: #767676;
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.2s;
    padding: 0;
}

.ai-retry-btn:hover {
    color: #3A3A3A;
}

:global(.dark) .ai-retry-btn:hover {
    color: #fafafa;
}
</style>
