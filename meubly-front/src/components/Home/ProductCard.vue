<!-- ProductCard.vue -->
<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-[#DBDBDB] dark:border-gray-600 w-full max-w-[280px] sm:w-72"
    style="border-radius: 10px;">
    <div class="relative">
      <img :src="product.cover_url" :alt="product.name" class="w-full h-48 sm:h-64 object-cover" />
      <div class="absolute top-2 right-2 flex flex-col space-y-2">
        <button class="bg-white dark:bg-gray-700 p-2 rounded-full shadow dark:shadow-gray-900/50 icon_favorite"
          :class="{ 'favorite-active': isFavorite }" @click.stop="toggleFavorite">
          <svg class="add_favorite" width="20" height="18" viewBox="0 0 25 22" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path d="M6.875 1.75C3.76888 1.75 1.25 4.07988 1.25 6.95438C1.25 9.2748 2.23437 14.782 11.924 
              20.3491C12.0976 20.4478 12.2968 20.5 12.5 20.5C12.7032 20.5 12.9024 20.4478 13.076 20.3491C22.7656 
              14.782 23.75 9.2748 23.75 6.95438C23.75 4.07988 21.2311 1.75 18.125 1.75C15.0189 1.75 12.5 4.90417 12.5 4.90417C12.5 
              4.90417 9.98112 1.75 6.875 1.75Z" :stroke="isFavorite ? '#B88E2F' : '#898989'"
              :fill="isFavorite ? '#B88E2F' : 'none'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
    <div class="p-3 text-left">
      <h3 class="text-[14px] sm:text-[16px] name_product text-[#333333] dark:text-white line-clamp-2">{{ product.name }}
      </h3>
      <p class="offers text-gray-500 dark:text-gray-400 text-[10px] sm:text-[12px]"> {{ product.nb_offers ||
        product.offerCount || 'Plusieurs' }} offres</p>
      <p class="price text-[14px] sm:text-[16px]"><span class="text_price">à partir de</span> {{ product.price }}€</p>
    </div>
    <button @click="goToProductDetail()"
      class="text-[#B88E2F] dark:text-primary-400 text-white w-full py-2 text-[14px] sm:text-[16px] border border-[#DBDBDB] dark:border-gray-600 button_compare"
      style="border-radius: 10px;">Comparer</button>
  </div>
</template>

<script>
import { addFavorite, removeFavorite } from '../../clientapi';

export default {
  props: {
    product: Object,
  },
  data() {
    return {
      isFavorite: false,
    };
  },
  mounted() {
    this.isFavorite = this.checkIfFavorite();
  },
  methods: {
    goToProductDetail() {
      try {
        this.$router.push({ name: 'ProductDetail', params: { id: this.product.furniture_id } });
      } catch (error) {
        console.error('Erreur navigation:', error);
      }
    },
    async toggleFavorite() {
      // Optimistic UI update (Local Storage + Visual)
      let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const index = favorites.findIndex(item => item.furniture_id === this.product.furniture_id);

      const wasFavorite = this.isFavorite;
      // Toggle local state
      this.isFavorite = !wasFavorite;

      if (index === -1) {
        favorites.push(this.product);
      } else {
        favorites.splice(index, 1);
      }
      localStorage.setItem('favorites', JSON.stringify(favorites));
      // Emit with payload for parent handling
      this.$emit('favorite-updated', { id: this.product.furniture_id, isFavorite: this.isFavorite });

      // Backend Sync
      try {
        if (!wasFavorite) {
          await addFavorite(this.product.furniture_id);
        } else {
          await removeFavorite(this.product.furniture_id);
        }
      } catch (e) {
        console.error("Erreur sync favoris:", e);
        // Rollback UI if failed? For now, just log.
        // In real app, we might revert isFavorite and toast error.
      }
    },
    checkIfFavorite() {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      return favorites.some(item => item.furniture_id === this.product.furniture_id);
    }
  },
  watch: {
    product: {
      handler() {
        this.isFavorite = this.checkIfFavorite();
      },
      immediate: true,
    }
  }
};
</script>

<style scoped>
.button_compare {
  color: #B88E2F;
  cursor: pointer;
  font-family: 'Poppins-Medium';
  transition: all 0.3s ease;
}

.button_compare:hover {
  background-color: #B88E2F;
  color: white;
  cursor: pointer;
}

.text_price {
  color: #767676;
  font-family: 'Poppins-Medium';
}

.price {
  font-family: 'Poppins-Medium';
}

.offers {
  font-family: 'Poppins-Regular';
  margin-top: 8px;
}

.name_product {
  font-family: 'Poppins-SemiBold';
  line-height: 1.3;
  margin-bottom: 4px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.button:hover {
  background-color: #898989;
  border-radius: 50%;
  cursor: pointer;
}

button:hover .add_favorite {
  fill: #898989;
  cursor: pointer;
}

.icon_favorite {
  border-radius: 40px;
  transition: all 0.3s ease;
}

.icon_favorite:hover {
  transition: transform 0.3s ease-in-out;
  transform: scale(1.1);
  cursor: pointer;
}

.favorite-active {
  border: 2px solid #B88E2F;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .name_product {
    font-size: 13px;
  }

  .price {
    font-size: 13px;
  }

  .offers {
    font-size: 10px;
  }

  .button_compare {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .name_product {
    font-size: 12px;
  }

  .price {
    font-size: 12px;
  }

  .offers {
    font-size: 9px;
  }

  .button_compare {
    font-size: 12px;
  }
}
</style>
