<template>
  <section class="py-6 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <!-- En-tête de section -->
    <div class="flex items-center justify-between mb-4">
      <router-link
        :to="{ name: 'ResultatRecherche', query: { categoryId: category.category_id, categoryLabel: category.label } }"
        class="group flex items-center gap-2 hover:text-primary-500 transition-colors duration-200"
      >
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 group-hover:text-primary-500 transition-colors duration-200">
          {{ category.label }}
        </h2>
        <svg
          class="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </router-link>

      <!-- Boutons navigation -->
      <div class="flex gap-1">
        <button
          @click="scrollLeft"
          :disabled="!canScrollLeft"
          class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-600 bg-white dark:bg-surface text-gray-600 dark:text-gray-300 hover:border-primary-500 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Défiler à gauche"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          @click="scrollRight"
          :disabled="!canScrollRight"
          class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-600 bg-white dark:bg-surface text-gray-600 dark:text-gray-300 hover:border-primary-500 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Défiler à droite"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading" class="flex gap-4 overflow-hidden">
      <div
        v-for="n in 4"
        :key="n"
        class="flex-shrink-0 w-[220px] animate-pulse"
      >
        <div class="w-full h-[160px] rounded-xl bg-gray-200 dark:bg-neutral-700 mb-3" />
        <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-4/5 mb-2" />
        <div class="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-3/5" />
      </div>
    </div>

    <!-- Carousel horizontal de produits -->
    <div
      v-else
      ref="track"
      class="flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
      @scroll="onScroll"
    >
      <div
        v-for="product in products"
        :key="product.furniture_id"
        class="flex-shrink-0 w-[220px]"
      >
        <ProductCard :product="product" />
      </div>
    </div>
  </section>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'
import ProductCard from './ProductCard.vue'

export default {
  name: 'CategorySection',
  components: { ProductCard },
  props: {
    category: {
      type: Object,
      required: true,
    },
    products: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const track = ref(null)
    const canScrollLeft = ref(false)
    const canScrollRight = ref(true)

    const onScroll = () => {
      const el = track.value
      if (!el) return
      canScrollLeft.value = el.scrollLeft > 0
      canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    }

    const scrollLeft = () => {
      track.value?.scrollBy({ left: -700, behavior: 'smooth' })
    }

    const scrollRight = () => {
      track.value?.scrollBy({ left: 700, behavior: 'smooth' })
    }

    onMounted(() => {
      nextTick(() => onScroll())
    })

    return { track, canScrollLeft, canScrollRight, onScroll, scrollLeft, scrollRight }
  },
}
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
