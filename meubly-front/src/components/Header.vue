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
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 12L13.09 18.26L20 19L13.09 19.74L12 26L10.91 19.74L4 19L10.91 18.26L12 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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

        <div v-if="isConnected" class="connected-status flex items-center">
          <span class="mr-2">Connecté</span>
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
  background-color: transparent;
  border: 1px solid white;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background-color: white;
  color: #B88E2F;
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
