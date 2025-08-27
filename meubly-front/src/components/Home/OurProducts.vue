<template>
  <section class="py-4" data-testid="products-section">
    <div class="container mx-auto text-center">
      <h2 class="text-[32px] text-[#3A3A3A] dark:text-white mb-4">Découvrez nos produits </h2>
      
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
          v-for="product in paginatedProducts"
          :key="product.furniture_id"
          :product="product"
          class="mx-auto w-full mt-2"
        />
      </div>

      <!-- Pagination -->
      <div v-if="!loading && !error && totalPages > 1" class="mt-8 flex justify-center items-center space-x-2">
        <!-- Bouton précédent -->
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1"
          class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>

        <!-- Numéros de pages -->
        <div class="flex space-x-1">
          <!-- Première page -->
          <button 
            v-if="currentPage > 3"
            @click="goToPage(1)"
            class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            1
          </button>
          
          <!-- Ellipsis après la première page -->
          <span v-if="currentPage > 4" class="px-2 py-2 text-gray-500 dark:text-gray-400">...</span>

          <!-- Pages autour de la page courante -->
          <button 
            v-for="page in visiblePages" 
            :key="page"
            @click="goToPage(page)"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-md transition-colors',
              page === currentPage 
                ? 'text-white bg-[#B88E2F] dark:bg-primary-400 border border-[#B88E2F] dark:border-primary-400' 
                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
          >
            {{ page }}
          </button>

          <!-- Ellipsis avant la dernière page -->
          <span v-if="currentPage < totalPages - 3" class="px-2 py-2 text-gray-500 dark:text-gray-400">...</span>

          <!-- Dernière page -->
          <button 
            v-if="currentPage < totalPages - 2"
            @click="goToPage(totalPages)"
            class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {{ totalPages }}
          </button>
        </div>

        <!-- Bouton suivant -->
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>

      <!-- Informations sur la pagination -->
      <div v-if="!loading && !error && products.length > 0" class="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Affichage de {{ startIndex + 1 }} à {{ endIndex }} sur {{ products.length }} produits
      </div>
    </div>
  </section>
</template>

<script>
import ProductCard from './ProductCard.vue';
import { getProducts } from '../../clientapi';

export default {
  components: {
    ProductCard,
  },
  data() {
    return {
      products: [],
      loading: true,
      error: null,
      currentPage: 1,
      productsPerPage: 12
    };
  },
  computed: {
    // Produits de la page courante
    paginatedProducts() {
      const start = (this.currentPage - 1) * this.productsPerPage;
      const end = start + this.productsPerPage;
      return this.products.slice(start, end);
    },
    
    // Nombre total de pages
    totalPages() {
      return Math.ceil(this.products.length / this.productsPerPage);
    },
    
    // Index de début et fin pour l'affichage
    startIndex() {
      return (this.currentPage - 1) * this.productsPerPage;
    },
    
    endIndex() {
      const end = this.startIndex + this.productsPerPage;
      return Math.min(end, this.products.length);
    },
    
    // Pages visibles autour de la page courante
    visiblePages() {
      const pages = [];
      const start = Math.max(1, this.currentPage - 1);
      const end = Math.min(this.totalPages, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    }
  },
  methods: {
    // Aller à la page précédente
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.scrollToTop();
      }
    },
    
    // Aller à la page suivante
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.scrollToTop();
      }
    },
    
    // Aller à une page spécifique
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.scrollToTop();
      }
    },
    
    // Faire défiler vers le haut de la section
    scrollToTop() {
      this.$nextTick(() => {
        const element = this.$el;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  },
  async created() {
    try {
      this.loading = true;
      this.error = null;
      
      // Récupérer les produits via l'API
      const products = await getProducts();
      console.log('Produits récupérés:', products);
      
      this.products = products;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      this.error = "Impossible de charger les produits";
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
h2{
  font-family: 'Poppins-Bold';
}

.products-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  padding: 2rem;
}

/* Tablettes */
@media screen and (max-width: 1024px) {
  .products-container {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

/* Petites tablettes */
@media screen and (max-width: 768px) {
  .products-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    padding: 1rem;
  }
  
  .section-title {
    font-size: 1.8rem;
  }
}

/* Mobile */
@media screen and (max-width: 480px) {
  .products-container {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0.8rem;
  }
  
  .section-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .product-card {
    width: 100%;
  }
}
</style>
