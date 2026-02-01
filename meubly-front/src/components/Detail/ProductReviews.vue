<template>
    <section class="mt-10 space-y-6">
        <header class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
                <h3 class="text-2xl font-bold text-[#3A3A3A] dark:text-white font-['Poppins-Bold']">
                    Avis des clients
                </h3>
                <p class="text-sm text-[#767676] dark:text-gray-300">
                    Partagez votre expérience avec ce produit.
                </p>
            </div>
            <div v-if="summary.total > 0" class="text-right">
                <p class="text-3xl font-semibold text-[#B88E2F]">{{ averageRating }}</p>
                <p class="text-sm text-[#767676] dark:text-gray-300">
                    Basé sur {{ summary.total }} avis
                </p>
            </div>
        </header>

        <div v-if="errorMessage" class="rounded-md bg-red-100 border border-red-200 text-red-700 px-4 py-3">
            {{ errorMessage }}
        </div>

        <div v-if="loading" class="text-center text-[#767676] dark:text-gray-300">
            Chargement des avis...
        </div>

        <template v-else>
            <div v-if="summary.total === 0" class="text-center text-[#767676] dark:text-gray-300">
                Soyez le premier à laisser un avis sur ce produit.
            </div>

            <ul v-else class="space-y-4">
                <li v-for="review in reviews" :key="review.review_id" class="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-3">
                            <span class="text-lg font-semibold text-[#3A3A3A] dark:text-white">{{ review.author_name || 'Utilisateur' }}</span>
                            <span class="text-sm text-[#B88E2F] font-medium">
                                {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
                            </span>
                        </div>
                        <time class="text-xs text-[#767676] dark:text-gray-400">
                            {{ formatDate(review.created_at || review.updated_at) }}
                        </time>
                    </div>
                    <p v-if="review.comment" class="mt-2 text-sm text-[#3A3A3A] dark:text-gray-200 whitespace-pre-line">
                        {{ review.comment }}
                    </p>
                </li>
            </ul>

            <div v-if="showPagination" class="flex items-center justify-center gap-4 pt-4">
                <button
                    type="button"
                    class="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-[#3A3A3A] dark:text-white disabled:opacity-50"
                    :disabled="currentPage === 1"
                    @click="changePage(currentPage - 1)"
                >
                    Précédent
                </button>
                <span class="text-sm text-[#767676] dark:text-gray-300">
                    Page {{ currentPage }} / {{ totalPages }}
                </span>
                <button
                    type="button"
                    class="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-[#3A3A3A] dark:text-white disabled:opacity-50"
                    :disabled="currentPage === totalPages"
                    @click="changePage(currentPage + 1)"
                >
                    Suivant
                </button>
            </div>
        </template>

        <section class="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 class="text-xl font-semibold text-[#3A3A3A] dark:text-white font-['Poppins-SemiBold']">
                Laisser un avis
            </h4>

            <p v-if="!isAuthenticated" class="mt-2 text-sm text-[#767676] dark:text-gray-300">
                Vous devez être connecté pour laisser un avis.
            </p>

            <form v-else class="mt-4 space-y-4" @submit.prevent="handleSubmit">
                <div class="flex flex-col md:flex-row md:items-center md:gap-4">
                    <label for="rating" class="text-sm font-medium text-[#3A3A3A] dark:text-white">Votre note</label>
                    <select
                        id="rating"
                        v-model.number="form.rating"
                        class="mt-2 md:mt-0 w-full md:w-auto border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-[#3A3A3A] dark:text-white"
                    >
                        <option v-for="n in [5,4,3,2,1]" :key="n" :value="n">{{ n }} étoile{{ n > 1 ? 's' : '' }}</option>
                    </select>
                </div>

                <div>
                    <label for="comment" class="block text-sm font-medium text-[#3A3A3A] dark:text-white">Votre commentaire</label>
                    <textarea
                        id="comment"
                        v-model="form.comment"
                        rows="4"
                        maxlength="1000"
                        class="mt-2 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-[#3A3A3A] dark:text-white"
                        placeholder="Partagez votre expérience..."
                    ></textarea>
                </div>

                <div class="flex flex-col gap-2">
                    <button
                        type="submit"
                        :disabled="submitting"
                        class="self-start px-4 py-2 rounded-md bg-[#B88E2F] text-white font-semibold hover:bg-[#a77f29] transition disabled:opacity-50"
                    >
                        {{ submitting ? 'Envoi en cours...' : 'Publier mon avis' }}
                    </button>
                    <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
                    <p v-if="successMessage" class="text-sm text-green-600">{{ successMessage }}</p>
                </div>
            </form>
        </section>
    </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import { listFurnitureReviews, submitFurnitureReview } from '../../api/furnituresApi';

const props = defineProps({
    productId: {
        type: [String, Number],
        required: true
    }
});

const authStore = useAuthStore();
const reviews = ref([]);
const summary = ref({ average: null, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
const loading = ref(false);
const errorMessage = ref('');
const submitError = ref('');
const successMessage = ref('');
const submitting = ref(false);
const currentPage = ref(1);
const limit = ref(5);
const totalItems = ref(0);

const form = reactive({
    rating: 5,
    comment: ''
});

const isAuthenticated = computed(() => authStore.isAuthenticated);
const totalPages = computed(() => {
    if (!totalItems.value) return 1;
    return Math.max(1, Math.ceil(totalItems.value / limit.value));
});
const showPagination = computed(() => totalItems.value > limit.value);
const averageRating = computed(() => {
    if (!summary.value || !summary.value.average) {
        return '-';
    }
    return summary.value.average.toFixed(1);
});

function formatDate(value) {
    if (!value) return '';
    try {
        return new Date(value).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        return value;
    }
}

async function loadReviews(page = currentPage.value) {
    loading.value = true;
    errorMessage.value = '';
    try {
        const data = await listFurnitureReviews(props.productId, { page, limit: limit.value });
        reviews.value = data.items || [];
        summary.value = data.summary || { average: null, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
        totalItems.value = data.total || 0;
        currentPage.value = data.page || page;
    } catch (error) {
        console.error('Erreur lors du chargement des avis:', error);
        errorMessage.value = error.message || "Impossible de charger les avis.";
        reviews.value = [];
        summary.value = { average: null, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
        totalItems.value = 0;
    } finally {
        loading.value = false;
    }
}

function changePage(page) {
    if (page < 1 || page > totalPages.value || page === currentPage.value) return;
    loadReviews(page);
}

async function handleSubmit() {
    submitError.value = '';
    successMessage.value = '';

    if (!form.rating || form.rating < 1 || form.rating > 5) {
        submitError.value = 'Merci de sélectionner une note valide.';
        return;
    }

    if (!form.comment.trim()) {
        submitError.value = 'Merci de partager un commentaire sur le produit.';
        return;
    }

    if (!authStore.user?.id) {
        submitError.value = 'Vous devez être connecté pour publier un avis.';
        return;
    }

    submitting.value = true;

    try {
        const payload = {
            rating: form.rating,
            comment: form.comment.trim(),
            userId: authStore.user.id,
            authorName: authStore.user.user_metadata?.username || authStore.user.email?.split('@')[0]
        };

        const { action } = await submitFurnitureReview(props.productId, payload);
        successMessage.value = action === 'updated'
            ? 'Votre avis a été mis à jour avec succès.'
            : 'Merci pour votre avis !';

        form.comment = '';
        await loadReviews(1);
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'avis:", error);
        submitError.value = error.message || "Impossible d'enregistrer votre avis pour le moment.";
    } finally {
        submitting.value = false;
    }
}

watch(
    () => props.productId,
    () => {
        currentPage.value = 1;
        loadReviews(1);
    }
);

onMounted(() => {
    if (!authStore.session) {
        authStore.init();
    }
    loadReviews();
});
</script>
