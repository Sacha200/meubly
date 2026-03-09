<template>
  <div class="py-4">
    <h2 class="text-[32px] text-[#3A3A3A] dark:text-white mb-2 text-center" style="font-family: 'Poppins-Bold'">
      Découvrez nos meubles
    </h2>
    <p class="text-lg text-gray-600 dark:text-white text-center mb-8">
      Trouvez le meuble parfait pour votre intérieur
    </p>

    <!-- Erreur globale -->
    <div v-if="globalError" class="text-center text-red-500 dark:text-red-400 py-4">
      {{ globalError }}
    </div>

    <!-- Skeleton initial (avant que les catégories soient chargées) -->
    <div v-else-if="categoriesLoading">
      <div v-for="n in 3" :key="n" class="py-6 border-b border-gray-100 dark:border-gray-800">
        <div class="h-6 w-48 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse mb-4" />
        <div class="flex gap-4 overflow-hidden">
          <div
            v-for="m in 4"
            :key="m"
            class="flex-shrink-0 w-[220px] animate-pulse"
          >
            <div class="w-full h-[160px] rounded-xl bg-gray-200 dark:bg-neutral-700 mb-3" />
            <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-4/5 mb-2" />
            <div class="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-3/5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Sections par catégorie -->
    <template v-else>
      <CategorySection
        v-for="cat in visibleCategories"
        :key="cat.category_id"
        :category="cat"
        :products="productsByCategory[cat.category_id]?.items || []"
        :loading="productsByCategory[cat.category_id]?.loading ?? true"
      />

      <!-- Message si aucun résultat -->
      <div v-if="visibleCategories.length === 0 && !categoriesLoading" class="text-center text-gray-500 dark:text-gray-400 py-12">
        Aucun produit disponible pour le moment.
      </div>
    </template>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import CategorySection from './CategorySection.vue'
import { useCategoryStore } from '@/stores/categoryStore'
import { getFurnitures } from '@/api/furnituresApi'

export default {
  name: 'CategorySections',
  components: { CategorySection },
  setup() {
    const categoryStore = useCategoryStore()
    const categoriesLoading = ref(false)
    const globalError = ref(null)

    // { [categoryId]: { items: [], loading: true } }
    const productsByCategory = reactive({})

    const visibleCategories = computed(() => {
      return (categoryStore.categories || []).filter(cat => {
        const data = productsByCategory[cat.category_id]
        // Affiche si : en cours de chargement OU a au moins 1 produit
        return data?.loading || (data?.items?.length > 0)
      })
    })

    const loadProductsForCategory = async (categoryId) => {
      productsByCategory[categoryId] = { items: [], loading: true }
      try {
        const result = await getFurnitures({ categoryId, limit: 8, sort: 'created_at:desc' })
        productsByCategory[categoryId] = { items: result.items || [], loading: false }
      } catch {
        productsByCategory[categoryId] = { items: [], loading: false }
      }
    }

    onMounted(async () => {
      try {
        categoriesLoading.value = true

        if (!categoryStore.categories.length) {
          await categoryStore.fetchCategories()
        }

        categoriesLoading.value = false

        // Initialise toutes les catégories comme "en chargement"
        for (const cat of categoryStore.categories) {
          productsByCategory[cat.category_id] = { items: [], loading: true }
        }

        // Chargement en parallèle de toutes les catégories
        await Promise.all(
          categoryStore.categories.map(cat => loadProductsForCategory(cat.category_id))
        )
      } catch (err) {
        globalError.value = 'Erreur lors du chargement des produits.'
        categoriesLoading.value = false
      }
    })

    return { categoriesLoading, globalError, productsByCategory, visibleCategories }
  },
}
</script>
