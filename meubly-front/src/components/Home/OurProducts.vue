<template>
  <section class="py-4" data-testid="products-section">
    <div class="container mx-auto text-center">
      <h2 class="text-[32px] text-[#3A3A3A] dark:text-white mb-4">Découvrez nos meubles </h2>
      <p class="text-lg text-gray-600 dark:text-white ">Trouvez le meuble parfait pour votre intérieur</p>

      
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-4 text-gray-600 dark:text-gray-300">
        Chargement des produits...
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center text-red-500 dark:text-red-400 py-4">
        {{ error }}
      </div>

      <!-- Products grid -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center"
      >
        <ProductCard
          v-for="product in items"
          :key="product.furniture_id"
          :product="product"
          class="mx-auto w-full mt-2"
        />
      </div>

      <!-- Pagination (serveur) -->
      <div v-if="!loading && !error && totalPages > 1" class="mt-8">
        <Paginator
          :rows="limit"
          :totalRecords="total"
          @page="onPageChange"
          :first="(currentPage - 1) * limit"
        />
      </div>
    </div>
  </section>
</template>

<script>
import { computed, nextTick, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import ProductCard from './ProductCard.vue'
import Paginator from 'primevue/paginator'
import { useFurnitureStore } from '@/stores/furnitureStore'

export default {
  name: 'OurProducts',
  components: { ProductCard, Paginator },
  setup() {
    const furn = useFurnitureStore()
    const { items, loading, error, page, limit, total } = storeToRefs(furn)

    // pagination serveur
    const totalPages = computed(() => Math.max(1, Math.ceil((total.value || 0) / (limit.value || 1))))
    const currentPage = computed(() => page.value)

    const visiblePages = computed(() => {
      const pages = []
      const start = Math.max(1, currentPage.value - 1)
      const end = Math.min(totalPages.value, currentPage.value + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      return pages
    })

    const startIndex = computed(() => (page.value - 1) * limit.value)
    const endIndex   = computed(() => Math.min(startIndex.value + (items.value?.length || 0), total.value || 0))

    const scrollToTop = () => {
      nextTick(() => {
        const el = document.querySelector('[data-testid="products-section"]')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }

    const onPageChange = async (event) => {
      const newPage = event.page + 1 // Convertir de 0-based à 1-based
      if (newPage >= 1 && newPage <= totalPages.value && newPage !== page.value) {
        page.value = newPage
        await furn.fetch()
        scrollToTop()
      }
    }

    onMounted(async () => {
      // Si HomeView ne l’a pas déjà fait
      if (!items.value?.length) await furn.fetch()
    })

    return {
      items, loading, error,
      total, limit, currentPage, totalPages,
      visiblePages, startIndex, endIndex,
      onPageChange
    }
  }
}
</script>

<style scoped>
h2 { font-family: 'Poppins-Bold'; }

/* (tes styles responsives existants) */
.products-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; padding: 2rem; }

@media screen and (max-width: 1024px) {
  .products-container { grid-template-columns: repeat(3, 1fr); gap: 1.5rem; padding: 1.5rem; }
}
@media screen and (max-width: 768px) {
  .products-container { grid-template-columns: repeat(2, 1fr); gap: 1rem; padding: 1rem; }
  .section-title { font-size: 1.8rem; }
}
@media screen and (max-width: 480px) {
  .products-container { grid-template-columns: 1fr; gap: 1rem; padding: 0.8rem; }
  .section-title { font-size: 1.5rem; margin-bottom: 1rem; }
  .product-card { width: 100%; }
}

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
