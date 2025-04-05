import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ResultatRechercheView from "../views/ResultatRechercheView.vue";
import ProductDetailView from "../views/ProductDetailView.vue";
import LoginView from "../views/LoginView.vue";
import FavorisView from "../views/FavorisView.vue";


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: 'Home', component: HomeView },
    {
      path: '/resultat-recherche',
      name: 'ResultatRecherche', component: ResultatRechercheView
    },
    {
      path: '/product-detail',
      name: 'ProductDetail', component: ProductDetailView
    },
    {
      path: '/login',
      name: 'Login', component: LoginView
    },
    {
      path: '/favoris',
      name: 'Favoris', component: FavorisView
    }
  ]
});

export default router;
