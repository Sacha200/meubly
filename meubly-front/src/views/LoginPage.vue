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
                    </div>
                </div>
            </template>
        </Toast>
        <Header />
        <div class="container mx-auto px-4 py-8">
            <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h1 class="text-center mb-8">Connexion</h1>

                <form @submit.prevent="handleLogin" class="space-y-6">
                    <!-- Email -->
                    <div>
                        <label for="email" class="block mb-2 text-gray-700 dark:text-gray-300">Email</label>
                        <input
                            type="email"
                            id="email"
                            v-model="formData.email"
                            class="input-field w-full"
                            required
                        />
                        <span class="error-message">{{ fieldErrors.email }}</span>
                    </div>

                    <!-- Mot de passe -->
                    <div>
                        <label for="password" class="block mb-2 text-gray-700 dark:text-gray-300">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            v-model="formData.password"
                            class="input-field w-full"
                            required
                        />
                        <span class="error-message">{{ fieldErrors.password }}</span>
                    </div>

                    <!-- Boutons -->
                    <div class="flex flex-col items-center gap-4">
                        <label class="w-full flex items-center justify-start gap-2 text-sm text-gray-700 dark:text-gray-300 select-none">
                            <input
                                type="checkbox"
                                v-model="loginAsAdmin"
                                class="h-4 w-4 accent-[#B88E2F]"
                            />
                            Se connecter en tant qu’administrateur
                        </label>

                        <button type="submit" class="submit-button" :disabled="loading">
                            {{ loading ? 'Connexion...' : 'Se connecter' }}
                        </button>
                        <div v-if="errorMessage" class="text-red-500 text-sm">
                            {{ errorMessage }}
                            <div v-if="showResendConfirmation" class="mt-2">
                                <button 
                                    @click="resendConfirmation" 
                                    class="text-[#B88E2F] hover:underline"
                                >
                                    Renvoyer l'email de confirmation
                                </button>
                                <div class="mt-2">
                                    <a
                                        :href="mailpitUrl"
                                        target="_blank"
                                        rel="noreferrer"
                                        class="text-[#B88E2F] hover:underline"
                                    >
                                        Ouvrir Mailpit
                                    </a>
                                </div>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Pas encore de compte ?
                            <router-link to="/register" class="text-[#B88E2F] hover:underline">
                                S'inscrire
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
import { loginUser } from '../api/authApi';
import { supabase } from '../supabase';
import Toast from 'primevue/toast';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

export default {
    name: 'LoginPage',
    components: {
        Toast,
        Header,
        Footer
    },
    data() {
        return {
            formData: {
                email: '',
                password: '',
            },
            loginAsAdmin: false,
            fieldErrors: {
                email: '',
                password: '',
            },
            loading: false,
            errorMessage: '',
            showResendConfirmation: false,
            mailpitUrl: import.meta.env.VITE_MAILPIT_URL || 'http://localhost:8025'
        }
    },
    methods: {
        validateForm() {
            const errors = [];

            // Validation de l'email
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(this.formData.email)) {
                errors.push("L'adresse email n'est pas valide");
            }

            // Validation basique du mot de passe
            if (this.formData.password.length < 8) {
                errors.push("Le mot de passe doit contenir au moins 8 caractères");
            }

            return errors;
        },

        async handleLogin() {
            try {
                this.loading = true;
                this.errorMessage = '';
                this.showResendConfirmation = false;

                const errors = this.validateForm();
                if (errors.length > 0) {
                    this.errorMessage = errors.join('\n');
                    this.$toast.add({
                        severity: 'error',
                        summary: 'Formulaire invalide',
                        detail: errors[0],
                        life: 4500,
                        closable: false
                    });
                    return;
                }

                const { user, profile } = await loginUser(this.formData);

                if (user) {
                    console.log('Connexion réussie:', profile);
                    sessionStorage.setItem('role', profile.role);

                    // Si l'utilisateur demande une connexion "admin", vérifier le rôle
                    if (this.loginAsAdmin && profile?.role !== 'ADMIN') {
                        this.$toast.add({
                            severity: 'warn',
                            summary: 'Accès refusé',
                            detail: "Ce compte n'est pas administrateur.",
                            life: 5000,
                            closable: false
                        });
                        sessionStorage.removeItem('role');
                        localStorage.removeItem('userProfile');
                        await supabase.auth.signOut();
                        return;
                    }

                    this.$toast.add({
                        severity: 'success',
                        summary: this.loginAsAdmin ? 'Connexion administrateur' : 'Connexion réussie',
                        detail: `Bienvenue ${profile?.username || ''}`.trim(),
                        life: 2200,
                        closable: false
                    });
                    // Laisser le temps de voir la confirmation sur cette page
                    const nextRoute = this.loginAsAdmin ? '/admin/users' : '/';
                    setTimeout(() => this.$router.push(nextRoute), 1600);
                }

            } catch (error) {
                console.error('Erreur:', error);
                const fallback =
                    "Service d'authentification indisponible (Supabase). Réessaie dans quelques secondes.";
                const detail =
                    error?.message ||
                    error?.error_description ||
                    (typeof error === 'string' ? error : '') ||
                    fallback;
                this.errorMessage = detail;
                this.$toast.add({
                    severity: 'error',
                    summary: 'Connexion impossible',
                    detail,
                    life: 6000,
                    closable: false
                });
                
                // Afficher le bouton de renvoi si l'email n'est pas confirmé
                if ((error?.message || '').includes('confirmer votre email')) {
                    this.showResendConfirmation = true;
                }
            } finally {
                this.loading = false;
            }
        },

        async resendConfirmation() {
            try {
                const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: this.formData.email
                });

                if (error) throw error;

                this.$toast.add({
                    severity: 'info',
                    summary: 'Email renvoyé',
                    detail: "Email de confirmation renvoyé. Ouvre Mailpit pour le récupérer.",
                    life: 5000,
                    closable: false
                });
            } catch (error) {
                console.error('Erreur:', error);
                this.$toast.add({
                    severity: 'error',
                    summary: 'Envoi impossible',
                    detail: error.message || "Erreur lors de l'envoi",
                    life: 6000,
                    closable: false
                });
            }
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
}

.submit-button:hover {
    background-color: #9c7a2a;
}

.submit-button:disabled {
    background-color: #6b7280;
    cursor: not-allowed;
}

.error-message {
    color: red;
    font-size: 0.8em;
    margin-top: 5px;
}
</style> 