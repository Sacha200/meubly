<template>
  <section class="w-full mb-8">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-white">Parcourir par catégorie</h2>
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
    <div v-if="loading" class="flex gap-3 overflow-hidden">
      <div
        v-for="n in 8"
        :key="n"
        class="flex-shrink-0 w-[120px] animate-pulse"
      >
        <div class="w-[120px] h-[120px] rounded-2xl bg-gray-200 dark:bg-neutral-700 mb-2" />
        <div class="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-4/5 mx-auto" />
        <div class="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-3/5 mx-auto mt-1" />
      </div>
    </div>

    <!-- Carousel -->
    <div
      v-else
      ref="track"
      class="flex gap-3 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
      @scroll="onScroll"
    >
      <button
        v-for="cat in categories"
        :key="cat.category_id"
        @click="navigateToCategory(cat)"
        class="flex-shrink-0 w-[120px] flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
      >
        <!-- Image container -->
        <div
          class="w-[120px] h-[120px] rounded-2xl overflow-hidden bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-gray-700 group-hover:border-primary-400 group-hover:shadow-md transition-all duration-200 flex items-center justify-center"
        >
          <img
            :src="getImage(cat)"
            :alt="cat.label"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            @error="onImgError($event, cat)"
          />
        </div>

        <!-- Label -->
        <span
          class="text-xs font-medium text-center text-gray-700 dark:text-gray-300 group-hover:text-primary-500 transition-colors duration-200 leading-tight line-clamp-2 w-full px-1"
        >
          {{ cat.label }}
        </span>
      </button>
    </div>
  </section>
</template>

<script>
import { mapStores } from 'pinia';
import { useCategoryStore } from '@/stores/categoryStore';

// Mapping images par mots-clés (couvre IDs IKEA, labels FR et EN)
const IMAGE_BY_ID = {
  'fu003': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=240&h=240&fit=crop&q=75',
  'fu002': 'https://images.unsplash.com/photo-1551298370-9d3d53740c72?w=240&h=240&fit=crop&q=75',
  'fu004': 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=240&h=240&fit=crop&q=75',
  'st002': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=240&fit=crop&q=75',
  'bm003': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=240&h=240&fit=crop&q=75',
  'bm001': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=240&h=240&fit=crop&q=75',
  'od003': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=240&h=240&fit=crop&q=75',
  'od001': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=240&h=240&fit=crop&q=75',
  'st004': 'https://images.unsplash.com/photo-1595428773197-20a73fdbb195?w=240&h=240&fit=crop&q=75',
  'st003': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=240&h=240&fit=crop&q=75',
  'st001': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=240&h=240&fit=crop&q=75',
  'ba001': 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=240&h=240&fit=crop&q=75',
  'li001': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=240&h=240&fit=crop&q=75',
  'de001': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=240&h=240&fit=crop&q=75',
  'tl001': 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=240&h=240&fit=crop&q=75',
  'tl004': 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=240&h=240&fit=crop&q=75',
  'tl002': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=240&h=240&fit=crop&q=75',
  'ka001': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=240&h=240&fit=crop&q=75',
  'kt001': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=240&h=240&fit=crop&q=75',
  'bc001': 'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=240&h=240&fit=crop&q=75',
  'pp001': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=240&h=240&fit=crop&q=75',
  'he001': 'https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?w=240&h=240&fit=crop&q=75',
};

// Mapping images par mots-clés du label (FR + EN) — couvre les anciennes catégories
const IMAGE_BY_KEYWORD = [
  [['canapé', 'sofa', 'fauteuil', 'living-room', 'salon'], 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=240&h=240&fit=crop&q=75'],
  [['table', 'chaise', 'dining', 'salle à manger'], 'https://images.unsplash.com/photo-1551298370-9d3d53740c72?w=240&h=240&fit=crop&q=75'],
  [['bureau', 'office', 'desk'], 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=240&h=240&fit=crop&q=75'],
  [['bibliothèque', 'étagère', 'rangement', 'storage'], 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=240&h=240&fit=crop&q=75'],
  [['lit', 'bed', 'bedroom', 'chambre', 'matelas'], 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=240&h=240&fit=crop&q=75'],
  [['jardin', 'outdoor', 'extérieur', 'terrasse', 'garden'], 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=240&h=240&fit=crop&q=75'],
  [['cuisine', 'kitchen', 'electroménager', 'vaisselle'], 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=240&h=240&fit=crop&q=75'],
  [['salle de bain', 'bathroom', 'bath'], 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=240&h=240&fit=crop&q=75'],
  [['lumière', 'luminaire', 'lighting', 'lamp', 'éclairage'], 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=240&h=240&fit=crop&q=75'],
  [['décor', 'decoration', 'déco'], 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=240&h=240&fit=crop&q=75'],
  [['textile', 'linge', 'rideau', 'curtain'], 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=240&h=240&fit=crop&q=75'],
  [['bébé', 'enfant', 'baby', 'child', 'kids'], 'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=240&h=240&fit=crop&q=75'],
  [['plante', 'plant', 'pot'], 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=240&h=240&fit=crop&q=75'],
  [['commode', 'tiroir', 'armoire', 'wardrobe', 'dressing'], 'https://images.unsplash.com/photo-1595428773197-20a73fdbb195?w=240&h=240&fit=crop&q=75'],
  [['électronique', 'electronic', 'tech'], 'https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?w=240&h=240&fit=crop&q=75'],
];

export default {
  name: 'CategoryCarousel',

  data() {
    return {
      canScrollLeft: false,
      canScrollRight: true,
      imgErrors: {},
    };
  },

  computed: {
    ...mapStores(useCategoryStore),
    categories() {
      return this.categoryStore.categories || [];
    },
    loading() {
      return this.categoryStore.loading;
    },
  },

  methods: {
    getImage(cat) {
      if (this.imgErrors[cat.category_id]) return this.getImageByKeyword(cat.label);
      if (cat.cover_url) return cat.cover_url;
      if (IMAGE_BY_ID[cat.category_id]) return IMAGE_BY_ID[cat.category_id];
      return this.getImageByKeyword(cat.label);
    },

    getImageByKeyword(label = '') {
      const lower = label.toLowerCase();
      for (const [keywords, url] of IMAGE_BY_KEYWORD) {
        if (keywords.some(kw => lower.includes(kw))) return url;
      }
      // Fallback générique : intérieur maison
      return 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=240&h=240&fit=crop&q=75';
    },

    onImgError(event, cat) {
      // Tente l'image par mot-clé comme fallback
      const fallback = this.getImageByKeyword(cat.label);
      if (event.target.src !== fallback) {
        event.target.src = fallback;
      } else {
        this.imgErrors = { ...this.imgErrors, [cat.category_id]: true };
      }
    },

    navigateToCategory(cat) {
      this.$router.push({
        name: 'ResultatRecherche',
        query: { categoryId: cat.category_id, categoryLabel: cat.label },
      });
    },

    scrollLeft() {
      this.$refs.track?.scrollBy({ left: -360, behavior: 'smooth' });
    },

    scrollRight() {
      this.$refs.track?.scrollBy({ left: 360, behavior: 'smooth' });
    },

    onScroll() {
      const el = this.$refs.track;
      if (!el) return;
      this.canScrollLeft = el.scrollLeft > 0;
      this.canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    },

    updateScrollButtons() {
      this.$nextTick(() => this.onScroll());
    },
  },

  watch: {
    categories() {
      this.updateScrollButtons();
    },
  },

  async mounted() {
    if (!this.categoryStore.categories.length) {
      await this.categoryStore.fetchCategories();
    }
    this.updateScrollButtons();
  },
};
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
