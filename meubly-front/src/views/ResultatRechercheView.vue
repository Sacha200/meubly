<!-- ResultatRechercheView -->
<template>
  <div>
    <Header />

    <div class="max-w-7xl mx-auto px-4 lg:px-0 py-6">
      <!-- En-tête section + tri -->
      <div class="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-[#3A3A3A] dark:text-white">Résultats de recherche</h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1">
            <span v-if="total > 0">
              {{ total }} résultat{{ total > 1 ? 's' : '' }}
              <template v-if="q">pour <span class="font-semibold">"{{ q }}"</span></template>
              <template v-else-if="categoryLabel">dans <span class="font-semibold">{{ categoryLabel }}</span></template>
            </span>
            <span v-else>
              Aucun résultat
              <template v-if="q">pour <span class="font-semibold">"{{ q }}"</span></template>
              <template v-else-if="categoryLabel">dans <span class="font-semibold">{{ categoryLabel }}</span></template>
            </span>
          </p>
        </div>
        <select
          class="rounded-xl border border-[#DBDBDB] dark:border-gray-600 px-3 py-2 bg-white dark:bg-surface text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B88E2F] dark:focus:ring-[#B88E2F]"
          v-model="furnitureStore.sort"
          @change="applyFilters"
          title="Trier"
        >
          <option value="created_at:desc">Nouveautés</option>
          <option value="price:asc">Prix croissant</option>
          <option value="price:desc">Prix décroissant</option>
        </select>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Sidebar filtres -->
        <aside class="lg:col-span-3">
          <div class="rounded-2xl border border-[#DBDBDB] dark:border-gray-600 p-4 bg-white dark:bg-surface shadow-sm dark:shadow-gray-900/30">
            <h2 class="text-lg font-semibold text-[#3A3A3A] dark:text-white mb-3">Filtres</h2>
            <div class="space-y-4">
              <CategoryFilter v-model="furnitureStore.categoryId" />
              <PriceFilter v-model:min="furnitureStore.minPrice" v-model:max="furnitureStore.maxPrice" />
              <button
                class="w-full mt-2 rounded-2xl py-2 font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                @click="applyFilters"
              >Appliquer</button>
              <button class="w-full rounded-2xl py-2 font-medium border border-[#DBDBDB] dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors" @click="resetFilters">
                Réinitialiser
              </button>
            </div>
          </div>
        </aside>

        <!-- Grille produits + pagination -->
        <section class="lg:col-span-9">
          <!-- Loading -->
          <div v-if="loading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#B88E2F]"></div>
            <p class="mt-2 text-gray-600 dark:text-gray-300">Chargement des produits...</p>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="text-center py-8 text-red-500 dark:text-red-400">
            {{ error }}
          </div>

          <!-- Content -->
          <template v-else>
            <!-- Grille produits -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <ProductCard
                v-for="product in items"
                :key="product.furniture_id"
                :product="product"
              />
            </div>

            <!-- Si aucun produit -->
            <div v-if="!items.length" class="text-center py-12">
              <div class="text-gray-400 dark:text-gray-500 mb-4">
                <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun produit trouvé</h3>
              <p class="text-gray-500 dark:text-gray-400">Essayez de modifier vos critères de recherche ou vos filtres.</p>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="mt-8">
              <Paginator
                :rows="limit"
                :totalRecords="total"
                @page="onPageChange"
                :first="(page - 1) * limit"
              />
            </div>
          </template>
        </section>
      </div>
    </div>

    <Footer />
  </div>
</template>
  
  <script>
  import Header from '../components/Header.vue'
  import ProductCard from '../components/Home/ProductCard.vue'
  import Footer from '../components/Footer.vue'
  import CategoryFilter from '../components/Filters/CategoryFilter.vue'
  import PriceFilter from '../components/Filters/PriceFilter.vue'
  import Paginator from 'primevue/paginator'
  
  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { useFurnitureStore } from '@/stores/furnitureStore'
  
  export default {
    name: 'ResultatRechercheView',
    components: { Header, ProductCard, Footer, CategoryFilter, PriceFilter, Paginator },
  
    computed: {
      ...mapStores(useFurnitureStore),
      ...mapState(useFurnitureStore, ['items', 'loading', 'error', 'total', 'limit']),
      ...mapWritableState(useFurnitureStore, ['page', 'q']),
      totalPages() {
        return Math.max(1, Math.ceil((this.total || 0) / (this.limit || 1)))
      },
      categoryLabel() {
        return this.$route.query.categoryLabel || null;
      },
    },
  
    watch: {
      '$route.query': {
        async handler() {
          await this.fetchProducts()
        },
        immediate: true,
        deep: true,
      }
    },

    methods: {
      async fetchProducts() {
        const qFromRoute = typeof this.$route.query.q === 'string' ? this.$route.query.q : '';
        const catFromRoute = this.$route.query.categoryId || null;
        this.q = qFromRoute.trim();
        this.furnitureStore.categoryId = catFromRoute;
        this.page = 1;
        await this.furnitureStore.fetch();
        this.$nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      },

      async applyFilters() {
        this.furnitureStore.page = 1
        await this.furnitureStore.fetch()
      },

      async resetFilters() {
        this.furnitureStore.resetFilters()
        await this.furnitureStore.fetch()
      },
  
      async onPageChange(event) {
        const newPage = event.page + 1 // Convertir de 0-based à 1-based
        if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.page) {
          this.page = newPage
          await this.furnitureStore.fetch()
          this.$nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
        }
      }
    }
  }
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
  