<template>
  <div>
    <Header />
    <div class="max-w-7xl mx-auto px-4 lg:px-0 py-6">
      <SearchBar />

      <!-- Grille produits -->
      <OurProducts />
    </div>

    <Footer />
  </div>
</template>

<script>
import { onMounted } from 'vue'
import Header from '../components/Header.vue'
import SearchBar from '../components/Home/SearchBar.vue'
import OurProducts from '../components/Home/OurProducts.vue'
import Footer from '../components/Footer.vue'

import { useFurnitureStore } from '@/stores/furnitureStore'

export default {
  name: 'HomeView',
  components: { Header, SearchBar, OurProducts, Footer },
  setup() {
    const furn = useFurnitureStore()

    onMounted(async () => {
      furn.resetFilters()
      await furn.fetch()
    })
  }
}
</script>
