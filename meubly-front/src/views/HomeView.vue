<template>
  <div>
    <Header />
    <SearchBar />
    <!--  <BrowseRange /> -->
    <OurProducts />
    <Footer />
  </div>
</template>

<script>
import Header from '../components/Header.vue';
import SearchBar from '../components/Home/SearchBar.vue';
import OurProducts from '../components/Home/OurProducts.vue';
import Footer from '../components/Footer.vue';

export default {
  components: {
    Header,
    SearchBar,
    OurProducts,
    Footer,
  },
};
</script>

<style scoped>
/* Ajoute des styles globaux si nécessaire */
</style>
