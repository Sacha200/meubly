<template>
  <div class="flex justify-center py-14">
    <div class="flex items-center bg-white border border-gray-300 rounded-full w-[676px] h-[71px] shadow-sm">
      <div class="flex-1 px-8">
        <div class="text-[12px] search_bar_title text text-[#222222]">Produits</div>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Rechercher un type de produit"
          class="w-full text-[14px] text-[#6A6A6A] focus:outline-none"
        />
      </div>
     
      <button @click="performSearch" class="bg-[#B88E2F] text-white rounded-full w-12 h-12 flex items-center justify-center mr-4 button_search">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: ''
    };
  },
  methods: {
    performSearch() {
      if (this.searchQuery.trim()) {
        this.$router.push({ name: 'ResultatRecherche', query: { q: this.searchQuery } });
      }
    }
  }
};
</script>

<style scoped>

.button_search{
  cursor: pointer;
}

.search_bar_title{
  font-family: 'Poppins-SemiBold';
}
</style>
