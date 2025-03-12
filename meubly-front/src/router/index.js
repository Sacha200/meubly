import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ResultatRechercheView from "../views/ResultatRechercheView.vue";



const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: 'Home', component: HomeView },
    {
      path: '/resultat-recherche',
      name: 'ResultatRecherche', component: ResultatRechercheView
    },
  ]
});

export default router;
