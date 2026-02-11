<template>
  <div>
    <Toast position="top-right" />

    <Header />
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 class="text-center mb-6">Vérification email</h1>

        <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
          On t’a envoyé un email de confirmation.
          Ouvre Mailpit, copie le <strong>code</strong>, colle-le ici, puis clique sur <strong>Vérifier</strong>.
        </p>

        <div class="flex flex-col gap-4">
          <!-- Email récupéré depuis l'inscription / la page login (query param).
               On ne l'affiche pas en champ pour éviter de demander 2 infos. -->
          <div v-if="email" class="text-xs text-gray-500 dark:text-gray-400">
            Email : <span class="font-medium">{{ email }}</span>
          </div>
          <div v-else>
            <label class="block mb-2 text-gray-700 dark:text-gray-300">Email</label>
            <input type="email" class="input-field w-full" v-model="email" placeholder="ton@email.com" required />
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Si tu arrives ici directement, renseigne ton email.
            </p>
          </div>

          <div>
            <label class="block mb-2 text-gray-700 dark:text-gray-300">Code de vérification</label>
            <input type="text" class="input-field w-full" v-model="token" placeholder="Colle le code depuis l’email"
              required />
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Tu peux aussi cliquer sur le lien de confirmation dans l’email.
            </p>
          </div>

          <div class="flex flex-col items-center gap-3">
            <button class="submit-button" :disabled="loading" @click="verify">
              {{ loading ? 'Vérification...' : 'Vérifier' }}
            </button>
            <a
              :href="mailpitUrl"
              target="_blank"
              rel="noreferrer"
              class="text-[#B88E2F] hover:underline text-sm"
            >
              Ouvrir Mailpit
            </a>
            <router-link to="/login" class="text-sm text-[#B88E2F] hover:underline">
              Retour à la connexion
            </router-link>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script>
import Toast from 'primevue/toast'
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'
import { supabase } from '../supabase'

export default {
  name: 'VerifyEmailCodeView',
  components: { Toast, Header, Footer },
  data() {
    return {
      email: this.$route?.query?.email || '',
      token: '',
      loading: false,
      mailpitUrl: import.meta.env.VITE_MAILPIT_URL || 'http://localhost:8025',
    }
  },
  mounted() {
    // Feedback quand on arrive juste après l'inscription
    if (this.$route?.query?.sent === '1') {
      this.$toast.add({
        severity: 'success',
        summary: 'Email envoyé',
        detail: "Email de confirmation envoyé. Ouvre Mailpit pour récupérer le code.",
        life: 6500,
        closable: false,
      })
    }
  },
  methods: {
    async verify() {
      const email = String(this.email || '').trim()
      const token = String(this.token || '').trim()
      if (!email || !token) {
        this.$toast.add({
          severity: 'warn',
          summary: 'Champs manquants',
          detail: email ? "Renseigne le code." : "Renseigne l'email et le code.",
          life: 4500,
          closable: false,
        })
        return
      }

      try {
        this.loading = true
        const { data, error } = await supabase.auth.verifyOtp({
          type: 'signup',
          email,
          token,
        })
        if (error) throw error

        // Si verifyOtp crée une session, on peut rediriger directement.
        const hasSession = !!data?.session
        this.$toast.add({
          severity: 'success',
          summary: 'Email vérifié',
          detail: hasSession ? 'Tu es connecté.' : 'Tu peux maintenant te connecter.',
          life: 3500,
          closable: false,
        })
        this.$router.push(hasSession ? '/' : '/login')
      } catch (e) {
        const msg =
          e?.message ||
          e?.error_description ||
          "Code invalide ou expiré. Ouvre l'email de confirmation et réessaie."
        this.$toast.add({
          severity: 'error',
          summary: 'Vérification impossible',
          detail: msg,
          life: 6000,
          closable: false,
        })
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
h1 {
  font-family: 'Poppins-Bold';
  font-size: 28px;
  color: #3A3A3A;
}

.dark h1 {
  color: #f3f4f6;
}

.input-field {
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background-color: #f9f9f9;
  color: #374151;
}

.dark .input-field {
  border-color: #4b5563;
  background-color: #374151;
  color: #f9fafb;
}

.submit-button {
  padding: 10px 20px;
  width: 100%;
  background-color: #B88E2F;
  color: white;
  border-radius: 30px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-family: 'Poppins-Medium';
  font-size: 16px;
  border: none;
}

.submit-button:hover {
  background-color: #9c7a2a;
}

.submit-button:disabled {
  background-color: #6b7280;
  cursor: not-allowed;
}
</style>
