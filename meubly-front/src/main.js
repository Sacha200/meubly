import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createAuth0 } from '@auth0/auth0-vue'
import PrimeVue from 'primevue/config'
import Paginator from 'primevue/paginator';
import ToastService from 'primevue/toastservice'
import './style.css'



import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(pinia)
app.use(ToastService)
app.use(PrimeVue, {
   
});
app.component('Paginator', Paginator);
app.use(createAuth0, {
    domain: 'dev-qiffixd22t30g6oo.us.auth0.com',
    clientId: '97DBKAZ9oNsVyrWNxMThWjzlko8u7EZh',
    authorizationParams: {
        redirect_uri: window.location.origin
    }
})
app.mount('#app')