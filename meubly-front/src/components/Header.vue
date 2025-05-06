<template>
  <header class="bg-white shadow">
    <div class="container mx-auto flex justify-between items-center p-4">
      <div class="text-lg title-font">
        <router-link to="/" class="text-lg title-font">Meubly</router-link>
      </div>
  
      <div class="flex items-center">
        <a href="#" class="flex items-center link-favoris mr-8">
          <svg class="mr-2 icon-favoris" @click="goToFavoris" width="25" height="22" viewBox="0 0 25 22" fill="none" xmlns="http://www.w3.org/2000/svg" >
            <path
              d="M6.875 1.75C3.76888 1.75 1.25 4.07988 1.25 6.95438C1.25 9.2748 2.23437 14.782 11.924 20.3491C12.0976 20.4478 12.2968 20.5 12.5 20.5C12.7032 20.5 12.9024 20.4478 13.076 20.3491C22.7656 14.782 23.75 9.2748 23.75 6.95438C23.75 4.07988 21.2311 1.75 18.125 1.75C15.0189 1.75 12.5 4.90417 12.5 4.90417C12.5 4.90417 9.98112 1.75 6.875 1.75Z"
              stroke="#3A3A3A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Favoris
        </a>
        <router-link 
          to="/login" 
          class="login-button"
        >
          Connexion
        </router-link>
      </div>
    </div>
  </header>
</template>     

<script>
export default {
  data() {
    return {
      isFavorisOpen: false
    };
  },
  methods: {  
    goToLogin() {
      this.$router.push('/login');
    },
    goToFavoris() {
      this.$router.push('/favoris');
    }
  }
}
</script>
<style scoped>
.title-font {
  font-size: 32px;
  font-family: 'Poppins-Bold';
  color: #B88E2F;
}

.login-button {
  padding: 8px 16px;
  border: solid 1px #B88E2F;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-family: 'Poppins-Medium';
  font-size: 14px;
  color: #B88E2F;
}

.login-button:hover {
  background-color: #B88E2F;
  color: #fff;
}

.link-favoris {
  color: #3A3A3A;
}




</style>
