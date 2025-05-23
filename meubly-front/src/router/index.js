import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ResultatRechercheView from "../views/ResultatRechercheView.vue";
import ProductDetailView from "../views/ProductDetailView.vue";
import RegisterPage  from "../views/RegisterPage.vue";
import LogoutView from "../views/LogoutView.vue";
import FavoritesView from "../views/FavoritesView.vue";
import LoginPage from '../views/LoginPage.vue';


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
    } 
  ]
});

export default router;
