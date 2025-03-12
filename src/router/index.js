import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import ResultatRecherche from "../pages/ResultatRecherche.vue";

const routes = [
  { path: "/", name: 'Home', component: Home },
  {path: '/resultat-recherche',
    name: 'ResultatRecherche', component: ResultatRecherche },
  
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
