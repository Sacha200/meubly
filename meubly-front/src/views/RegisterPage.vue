<template>
  <div>
    <Toast position="top-right">
      <template #message="slotProps">
        <div class="p-toast-message-content flex items-start gap-3">
          <span class="p-toast-message-icon inline-flex items-center justify-center" aria-hidden="true">
            <svg v-if="slotProps.message.severity === 'success'" viewBox="0 0 24 24" class="w-4 h-4">
              <path fill="currentColor" d="M9.0 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
            </svg>
            <svg v-else-if="slotProps.message.severity === 'info'" viewBox="0 0 24 24" class="w-4 h-4">
              <path fill="currentColor"
                d="M11 17h2v-6h-2v6zm0-8h2V7h-2v2zm1-7C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
            <svg v-else-if="slotProps.message.severity === 'warn'" viewBox="0 0 24 24" class="w-4 h-4">
              <path fill="currentColor"
                d="M1 21h22L12 2 1 21zm12-3h-2v2h2v-2zm0-8h-2v6h2V10z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" class="w-4 h-4">
              <path fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.59 13.59L14.17 14.17 12 12l-2.17 2.17-1.41-1.41L10.59 10.59 8.41 8.41l1.41-1.41L12 9.17l2.17-2.17 1.41 1.41-2.18 2.18 2.18 2.18-1.41 1.41z" />
            </svg>
          </span>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="p-toast-summary">{{ slotProps.message.summary }}</span>
            </div>
            <div v-if="slotProps.message.detail" class="p-toast-detail">
              {{ slotProps.message.detail }}
            </div>

            <div v-if="slotProps.message?.data?.actions" class="mt-3 flex flex-wrap gap-3">
              <button
                v-if="slotProps.message.data.actions.mailpit"
                type="button"
                class="cta-button"
                @click="openMailpit"
              >
                Ouvrir Mailpit
              </button>
            </div>
          </div>
        </div>
      </template>
    </Toast>

    <Header />
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 class="text-center mb-8">Inscription</h1>

        <form @submit.prevent="handleRegister" class="space-y-6">
          <div>
            <label for="username" class="block mb-2 text-gray-700 dark:text-gray-300">Nom d'utilisateur</label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              class="input-field w-full"
              placeholder="Nom d'utilisateur"
              @input="validateField('username')"
              required
            />
            <span v-if="fieldErrors.username" class="error-message">{{ fieldErrors.username }}</span>
          </div>

          <div>
            <label for="email" class="block mb-2 text-gray-700 dark:text-gray-300">Email</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              class="input-field w-full"
              placeholder="Email"
              required
            />
            <span v-if="fieldErrors.email" class="error-message">{{ fieldErrors.email }}</span>
          </div>

          <div>
            <label for="password" class="block mb-2 text-gray-700 dark:text-gray-300">Mot de passe</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              class="input-field w-full"
              placeholder="Mot de passe"
              required
            />
            <span v-if="fieldErrors.password" class="error-message">{{ fieldErrors.password }}</span>
          </div>

          <div class="flex flex-col items-center gap-4">
            <button type="submit" class="submit-button" :disabled="loading">
              {{ loading ? 'Inscription...' : "S'inscrire" }}
            </button>

            <p class="text-sm text-gray-600 dark:text-gray-400">
              Déjà un compte ?
              <router-link to="/login" class="text-[#B88E2F] hover:underline">
                Se connecter
              </router-link>
            </p>
          </div>
        </form>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script>
import { registerUser } from '../api/authApi';
import Toast from 'primevue/toast';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

export default {
  name: 'Register',
  components: { Toast, Header, Footer },
  data() {
    return {
      formData: {
        username: '',
        email: '',
        password: '',
      },
      fieldErrors: {
        username: '',
        email: '',
        password: '',
      },
      mailpitUrl: import.meta.env.VITE_MAILPIT_URL || 'http://localhost:8025',
      loading: false
    }
  },
  methods: {
    validateForm() {
      const errors = [];

      if (this.formData.username.length < 3) {
        errors.push("Le nom d'utilisateur doit contenir au moins 3 caractères");
      }
      if (this.formData.username.length > 30) {
        errors.push("Le nom d'utilisateur ne peut pas dépasser 30 caractères");
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(this.formData.username)) {
        errors.push("Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores");
      }
      
      
      

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(this.formData.email)) {
        errors.push("L'adresse email n'est pas valide. Utilisez un format standard (exemple@domaine.com)");
      }

      if (this.formData.password.length < 8) {
        errors.push("Le mot de passe doit contenir au moins 8 caractères");
      }
      if (!/[A-Z]/.test(this.formData.password)) {
        errors.push("Le mot de passe doit contenir au moins une majuscule");
      }
      if (!/[a-z]/.test(this.formData.password)) {
        errors.push("Le mot de passe doit contenir au moins une minuscule");
      }
      if (!/[0-9]/.test(this.formData.password)) {
        errors.push("Le mot de passe doit contenir au moins un chiffre");
      }

      return errors;
    },

    async handleRegister() {
      try {
        this.loading = true;
        const errors = this.validateForm();
        if (errors.length > 0) {
          this.$toast.add({
            severity: 'error',
            summary: 'Formulaire invalide',
            detail: errors[0],
            life: 4500,
            closable: false
          });
          return;
        }

        const { user, profile } = await registerUser(this.formData);

        if (user) {
          console.log('User:', user);
          console.log('Profil créé:', profile);
          // Diriger vers l'écran de vérification (optionnel) :
          // l'utilisateur peut soit coller le token, soit cliquer le lien dans l'email.
          this.$router.push({ path: '/verify-email', query: { email: this.formData.email, sent: '1' } });
        }

      } catch (error) {
        console.error('Erreur:', error);
        const msg = (error?.message || '').toLowerCase();
        if (msg.includes('error sending confirmation email') || msg.includes('confirmation email')) {
          this.$toast.add({
            severity: 'warn',
            summary: 'Compte créé',
            detail: "Compte créé, mais l’email n’a pas été envoyé. Vérifie Mailpit (ou la config SMTP).",
            life: 11000,
            closable: false,
            data: { actions: { mailpit: true } }
          });
          return;
        }
        const fallback = "Service d'authentification indisponible (Supabase). Réessaie dans quelques secondes.";
        const detail =
          error?.message ||
          error?.error_description ||
          (typeof error === 'string' ? error : '') ||
          fallback;
        this.$toast.add({
          severity: 'error',
          summary: 'Inscription impossible',
          detail,
          life: 6000,
          closable: false
        });
      } finally {
        this.loading = false;
      }
    },

    validateField(fieldName) {
      if (fieldName === 'username') {
        this.fieldErrors.username = this.formData.username.length < 3
          ? "Le nom d'utilisateur doit contenir au moins 3 caractères"
          : '';
      }
    },
    openMailpit() {
      window.open(this.mailpitUrl, '_blank', 'noopener,noreferrer');
    }
  }
}
</script>

<style scoped>
h1 {
  font-family: 'Poppins-Bold';
  font-size: 32px;
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

.dark .input-field::placeholder {
  color: #9ca3af;
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

.error-message {
  color: red;
  font-size: 0.85em;
  margin-top: 2px;
  display: block;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 9999px;
  background: #22c55e;
  color: white;
  font-family: 'Poppins-Medium';
  font-size: 14px;
  text-decoration: none;
}

.cta-button:hover {
  background: #288e46;
}

.cta-link {
  color: #B88E2F;
  font-size: 14px;
  font-family: 'Poppins-Medium';
  text-decoration: underline;
  background: transparent;
  border: none;
  cursor: pointer;
}
</style>
