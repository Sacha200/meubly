<template>
    <div>
        <Header />
        <div class="container mx-auto px-4 py-8">
            <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
                <h1 class="text-center mb-8">Connexion</h1>

                <form @submit.prevent="handleLogin" class="space-y-6">
                    <!-- Email -->
                    <div>
                        <label for="email" class="block mb-2">Email</label>
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
                        <label for="password" class="block mb-2">Mot de passe</label>
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
                            </div>
                        </div>
                        <p class="text-sm text-gray-600">
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
import { loginUser } from '../clientapi';
import { supabase } from '../supabase';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

export default {
    name: 'LoginPage',
    components: {
        Header,
        Footer
    },
    data() {
        return {
            formData: {
                email: '',
                password: '',
            },
            fieldErrors: {
                email: '',
                password: '',
            },
            loading: false,
            errorMessage: '',
            showResendConfirmation: false
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
                    return;
                }

                const { user, profile } = await loginUser(this.formData);

                if (user) {
                    console.log('Connexion réussie:', profile);
                    this.$router.push('/');
                }

            } catch (error) {
                console.error('Erreur:', error);
                this.errorMessage = error.message;
                
                // Afficher le bouton de renvoi si l'email n'est pas confirmé
                if (error.message.includes('confirmer votre email')) {
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

                alert('Email de confirmation renvoyé. Veuillez vérifier votre boîte de réception.');
            } catch (error) {
                console.error('Erreur:', error);
                alert(error.message);
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

.input-field {
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    background-color: #f9f9f9;
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

.error-message {
    color: red;
    font-size: 0.8em;
    margin-top: 5px;
}
</style> 