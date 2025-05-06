<template>
  <div class="bg-white rounded-lg overflow-hidden border border-[#DBDBDB] w-72" style="border-radius: 10px;">
    <div class="relative">
      <img :src="product.cover_url" :alt="product.name" class="w-full h-64 object-cover" />
      <div class="absolute top-2 right-2 flex flex-col space-y-2">
        <button
          class="bg-white p-2 rounded-full shadow icon_favorite"
          :class="{ 'favorite-active': isFavorite }"
          @click.stop="toggleFavorite"
        >
          <svg class="add_favorite" width="25" height="22" viewBox="0 0 25 22" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.875 1.75C3.76888 1.75 1.25 4.07988 1.25 6.95438C1.25 9.2748 2.23437 14.782 11.924 20.3491C12.0976 20.4478 12.2968 20.5 12.5 20.5C12.7032 20.5 12.9024 20.4478 13.076 20.3491C22.7656 14.782 23.75 9.2748 23.75 6.95438C23.75 4.07988 21.2311 1.75 18.125 1.75C15.0189 1.75 12.5 4.90417 12.5 4.90417C12.5 4.90417 9.98112 1.75 6.875 1.75Z"
              :stroke="isFavorite ? '#B88E2F' : '#898989'"
              :fill="isFavorite ? '#B88E2F' : 'none'"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
    <div class="p-3 text-left">
      <h3 class="text-[16px] name_product text-[#333333]">{{ product.name }}</h3>
      <p class="offers text-gray-500"> {{ product.nb_offers }} offres</p>
      <p class="price"><span class="text_price">à partir de</span> {{ product.price }}€</p>
    </div>
    <button @click="goToProductDetail()"
      class="text-[#B88E2F] text-white w-full py-2 text-[16px] border border-[#DBDBDB] button_compare"
      style="border-radius: 10px;">Comparer</button>
  </div>
</template>

<script>
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
        console.error('Erreur lors de la navigation vers la page de détails du produit:', error);
      }
    },
    toggleFavorite() {
      let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const index = favorites.findIndex(item => item.furniture_id === this.product.furniture_id);
      if (index === -1) {
        favorites.push(this.product);
        this.isFavorite = true;
      } else {
        favorites.splice(index, 1);
        this.isFavorite = false;
      }
      localStorage.setItem('favorites', JSON.stringify(favorites));
      this.$emit('favorite-updated');
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
  font-size: 14px;
}

.button_compare:hover {
  background-color: #B88E2F;
  border: 1px solid #B88E2F;
  color: white;
  cursor: pointer;
}

.text_price {
  color: #767676;
  font-family: 'Poppins-Medium';
  font-size: 14px;
}

.price {
  font-family: 'Poppins-Medium';
  font-size: 16px;
}

.offers {
  font-family: 'Poppins-Regular';
  font-size: 12px;
  margin-top: 10px;
}

.name_product {
  font-family: 'Poppins-SemiBold';
  font-size: 16px;
}

.button:hover {
  background-color: #898989;
  border-radius: 50%;
  cursor: pointer;
}

button:hover .add_favorite {
 fill:#898989;
 cursor: pointer;
}

.icon_favorite{
  border-radius: 40px;
}

.icon_favorite:hover{
  transition: transform 0.5s ease-in-out;
  transform: scale(1.1);
  cursor: pointer;
}

.favorite-active {
  border: 2px solid #B88E2F;
}
</style>
