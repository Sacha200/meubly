import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ResultatRechercheView from "../views/ResultatRechercheView.vue";
import ProductDetailView from "../views/ProductDetailView.vue";
import RegisterPage  from "../views/RegisterPage.vue";
import LogoutView from "../views/LogoutView.vue";
import FavoritesView from "../views/FavoritesView.vue";
import LoginPage from '../views/LoginPage.vue';
import AdminFurnituresView from '../views/Admin/furnitures/listView.vue';
import AdminUpdateFurnitureView from '../views/Admin/furnitures/updateView.vue';
import SupabaseAuthCallbackView from "../views/SupabaseAuthCallbackView.vue";


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: 'Home', component: HomeView },
    { path: '/resultat-recherche', name: 'ResultatRecherche', component: ResultatRechercheView },
    { path: '/product-detail/:id', name: 'ProductDetail', component: ProductDetailView },
    { path: '/login', name: 'Login', component: LoginPage },
    { path: '/logout', name: 'Logout', component: LogoutView },
    { path: '/favoris', name: 'Favorites', component: FavoritesView },
    { path: '/register', name: 'Register', component: RegisterPage },    
    { path: '/auth/callback', name: 'AuthCallback', component: SupabaseAuthCallbackView },
    
    // Routes d'administration - Utilisateurs
    { path: '/admin/users', name: 'AdminUsers', meta: { roles: ['ADMIN']}, component: () => import('../views/Admin/user/listView.vue')},
    { path: '/admin/users/create', name: 'AdminUserCreate', meta: { roles: ['ADMIN']}, component: () => import('../views/Admin/user/createView.vue')},
    { path: '/admin/users/:id/edit', name: 'AdminUserUpdate', meta: { roles: ['ADMIN']}, component: () => import('../views/Admin/user/updateView.vue')},
    
    // Routes d'administration - Fournisseurs
    { path: '/admin/providers', name: 'AdminProviders', meta: { roles: ['ADMIN']}, component: () => import('../views/Admin/provider/listView.vue')},
    { path: '/admin/providers/create', name: 'AdminProviderCreate', meta: { roles: ['ADMIN']}, component: () => import('../views/Admin/provider/createView.vue')},
    { path: '/admin/providers/:id/edit', name: 'AdminProviderUpdate', meta: { roles: ['ADMIN']}, component: () => import('../views/Admin/provider/updateView.vue')},
    
    // Routes d'administration - Meubles (existantes)
    { path: '/admin/furnitures', name: 'AdminFurnitures', meta: { roles: ['ADMIN']}, component: AdminFurnituresView },    
    { path: '/admin/furnitures/:id', name: 'AdminUpdateFurniture', meta: { roles: ['ADMIN']}, component: AdminUpdateFurnitureView },
  ]
});

router.beforeEach((to, _from, next) => {
  let role = sessionStorage.getItem('role')
  if (!role) {
    try {
      role = JSON.parse(localStorage.getItem('userProfile') || '{}')?.role || null
      if (role) sessionStorage.setItem('role', role)
    } catch {
      role = null
    }
  }
  if (to.meta.roles) {
    if (role && Array.isArray(to.meta.roles) && to.meta.roles.includes(role)) {
      next()
    } else {
      next('/')     
    }
  } else {
    next()
  }
})

export default router;
