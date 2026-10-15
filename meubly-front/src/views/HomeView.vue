<template>
  <div>
    <AppHeader />
    <div class="max-w-7xl mx-auto px-4 lg:px-0 py-6">
      <SearchBar />

      <!-- Carousel de catégories -->
      <CategoryCarousel />

      <!-- Sections par catégorie style Airbnb -->
      <CategorySections />
    </div>

    <AppFooter />
  </div>
</template>

<script>
import AppHeader from "../components/AppHeader.vue";
import SearchBar from "../components/Home/SearchBar.vue";
import CategoryCarousel from "../components/Home/CategoryCarousel.vue";
import CategorySections from "../components/Home/CategorySections.vue";
import AppFooter from "../components/AppFooter.vue";

export default {
  name: "HomeView",
  components: { AppHeader, SearchBar, CategoryCarousel, CategorySections, AppFooter },
};
</script>
