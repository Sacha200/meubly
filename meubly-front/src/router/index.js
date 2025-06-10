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


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: 'Home', component: HomeView },
    {
      path: '/resultat-recherche',
      name: 'ResultatRecherche', component: ResultatRechercheView
    },
    {
      path: '/product-detail/:id',
      name: 'ProductDetail', component: ProductDetailView
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginPage
    },
    {
      path: '/logout',
      name: 'Logout', component: LogoutView
    },
    {
      path: '/favoris',
      name: 'Favorites',
      component: FavoritesView
    },
    {
      path: '/register',
      name: 'Register',
      component: RegisterPage
    },
    
    // Routes d'administration
    
    {
      path: '/admin/users',
      name: 'AdminUsers',
      meta: { roles: 'ADMIN'},
      component: () => import('../views/Admin/user/listView.vue')
    },
    {
      path: '/admin/furnitures',
      name: 'AdminFurnitures',
      // meta: { roles: 'ADMIN'},
      component: AdminFurnituresView
    },
    
    {
      path: '/admin/furnitures/:id',
      name: 'AdminUpdateFurniture',
      meta: { roles: 'ADMIN'},
      component: AdminUpdateFurnitureView
    },
    {
      path: '/admin/providers',
      name: 'AdminProviders',
      meta: { roles: 'ADMIN'},
      component: () => import('../views/Admin/provider/listView.vue')
    },
   
   

  ]
});

router.beforeEach((to, _from, next) => {
  const role = sessionStorage.getItem('role') 
  console.log(role)
  // <-- lecture directe

  if (to.meta.roles) {
    if (role && to.meta.roles.includes(role)) {
      next()
    } else {
      next('/')     
    }
  } else {
    next()
  }
})

export default router;
