<template>
  <div>
    <Header />
    <div class="max-w-7xl mx-auto px-4 lg:px-0 py-6">
      <SearchBar />

      <!-- Carousel de catégories -->
      <CategoryCarousel />

      <!-- Sections par catégorie style Airbnb -->
      <CategorySections />
    </div>

    <Footer />
  </div>
</template>

<script>
import Header from '../components/Header.vue'
import SearchBar from '../components/Home/SearchBar.vue'
import CategoryCarousel from '../components/Home/CategoryCarousel.vue'
import CategorySections from '../components/Home/CategorySections.vue'
import Footer from '../components/Footer.vue'

export default {
  name: 'HomeView',
  components: { Header, SearchBar, CategoryCarousel, CategorySections, Footer },
}
</script>
