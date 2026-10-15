import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import Paginator from "primevue/paginator";
import ToastService from "primevue/toastservice";
import "./style.css";
import { useThemeStore } from "./stores/themeStore";
import { useAuthStore } from "./stores/authStore";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.use(ToastService);
app.use(PrimeVue, {});
// Nom impose par PrimeVue, utilise tel quel dans les templates.
// eslint-disable-next-line vue/multi-word-component-names
app.component("Paginator", Paginator);

// Initialiser le thème
const themeStore = useThemeStore(pinia);
themeStore.init();

const authStore = useAuthStore(pinia);
authStore.init();

app.mount("#app");
