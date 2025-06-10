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

        <!-- Menu Admin (visible seulement si connecté) -->
        <div v-if="isConnected" class="relative mr-6">
          <button 
            @click="toggleAdminMenu" 
            class="admin-menu-button flex items-center"
            :class="{ 'active': isAdminMenuOpen }"
          >
            <svg class="mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Administration
            <svg class="ml-1 transition-transform" :class="{ 'rotate-180': isAdminMenuOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <div v-if="isAdminMenuOpen" class="admin-dropdown">
            <div class="admin-dropdown-content">
              <h3 class="admin-dropdown-title">Gestion</h3>
              
              <router-link to="/admin/users" class="admin-dropdown-item" @click="closeAdminMenu">
                <svg class="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Utilisateurs
              </router-link>

              <router-link to="/admin/furnitures" class="admin-dropdown-item" @click="closeAdminMenu">
                <svg class="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21L19 16H5L3 6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M3 6L2 2H1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Meubles
              </router-link>

              <router-link to="/admin/providers" class="admin-dropdown-item" @click="closeAdminMenu">
                <svg class="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Fournisseurs
              </router-link>

              <div class="admin-dropdown-divider"></div>
              
              <router-link to="/admin/dashboard" class="admin-dropdown-item" @click="closeAdminMenu">
                <svg class="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Tableau de bord
              </router-link>
            </div>
          </div>
        </div>

        <div v-if="isConnected" class=" flex items-center">
          <span class="mr-2 connected-status">Connecté</span>
          <button @click="logout" class="logout-button">
            Se déconnecter
          </button>
        </div>
        <router-link 
          v-else
          to="/login" 
          class="login-button"
        >
          Se connecter
        </router-link>
      </div>
    </div>
  </header>
</template>     

<script>
import { supabase } from '../supabase';

export default {
  data() {
    return {
      isFavorisOpen: false,
      isConnected: false,
      isAdminMenuOpen: false
    };
  },
  methods: {  
    goToLogin() {
      this.$router.push('/login');
    },
    goToFavoris() {
      this.$router.push('/favoris');
    },
    async logout() {
      try {
        await supabase.auth.signOut();
        this.$router.push('/');
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    },
    toggleAdminMenu() {
      this.isAdminMenuOpen = !this.isAdminMenuOpen;
    },
    closeAdminMenu() {
      this.isAdminMenuOpen = false;
    },
    handleClickOutside(event) {
      // Fermer le menu admin si on clique à l'extérieur
      const adminMenu = this.$el.querySelector('.admin-dropdown');
      const adminButton = this.$el.querySelector('.admin-menu-button');
      
      if (this.isAdminMenuOpen && 
          adminMenu && 
          !adminMenu.contains(event.target) && 
          !adminButton.contains(event.target)) {
        this.closeAdminMenu();
      }
    }
  },
  async mounted() {
    // Vérifie à l'initialisation
    const { data: { user } } = await supabase.auth.getUser();
    this.isConnected = !!user;

    // Écoute les changements d'authentification
    supabase.auth.onAuthStateChange((event, session) => {
      this.isConnected = !!session?.user;
    });

    // Ajouter l'écouteur pour fermer le menu admin
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    // Nettoyer l'écouteur d'événement
    document.removeEventListener('click', this.handleClickOutside);
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

.logout-button {
  padding: 4px 8px;
  margin-left: 8px;
  border: 1px solid white;
  border-radius: 5px;
  color: red;
  font-weight: 600;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}



.connected-status {
  padding: 8px 16px;
  background-color: #B88E2F;
  color: white;
  border-radius: 10px;
  font-family: 'Poppins-Medium';
  font-size: 14px;
}

.admin-menu-button {
  padding: 8px 16px;
  border: solid 1px #B88E2F;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Poppins-Medium';
  font-size: 14px;
  color: #B88E2F;
  background-color: transparent;
}

.admin-menu-button:hover,
.admin-menu-button.active {
  background-color: #B88E2F;
  color: #fff;
}

.admin-menu-button svg {
  transition: transform 0.3s ease;
}

.admin-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  padding: 0;
  z-index: 1000;
  min-width: 220px;
  border: 1px solid #e5e7eb;
  animation: fadeInDown 0.2s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.admin-dropdown-content {
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.admin-dropdown-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #374151;
  font-family: 'Poppins-Medium';
  padding: 0 8px;
}

.admin-dropdown-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  text-decoration: none;
  color: #374151;
  font-family: 'Poppins-Regular';
  font-size: 14px;
  margin-bottom: 4px;
}

.admin-dropdown-item:hover {
  background-color: #B88E2F;
  color: white;
  transform: translateX(4px);
}

.admin-dropdown-item svg {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  transition: color 0.2s ease;
}

.admin-dropdown-divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 8px 0;
}

.rotate-180 {
  transform: rotate(180deg);
}

</style>
