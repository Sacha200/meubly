<template>
  <div>
   <Header />  
   <div class="container d-flex justify-content-center m-auto">

   <ListeFavoris />
   </div>
   <Footer />
  </div>
</template>

<script>
import Header from '../components/Header.vue';
import ListeFavoris from '../components/Favoris/ListeFavoris.vue';
import Footer from '../components/Footer.vue';  

export default {
  components: {
    Header,
    ListeFavoris,
    Footer
  },
 
}
</script>

