<template>
    <div class="register-page flex">
        <div class="welcome-section flex flex-col items-center justify-center p-10">
            <h1 class="text-center">Bienvenue sur <br/>
              <span class="text-gold items-center">Meubly !</span></h1>
            <button @click="login" class="connect-button mt-6">Se connecter</button>
        </div>
        <div class="form-section flex flex-col justify-center p-10 items-center">
            <h2 class=" text-gold mb-6">Création de compte</h2>
            <form @submit.prevent="handleRegister" class="flex flex-col space-y-4 form-input">
                <div class="form-group">
                    <input 
                        v-model="formData.username" 
                        type="text" 
                        placeholder="Nom d'utilisateur"
                        @input="validateField('username')"
                        required
                    />
                    <span v-if="fieldErrors.username" class="error-message">
                        {{ fieldErrors.username }}
                    </span>
                </div>
                <div class="form-group">
                    <input 
                        v-model="formData.lastname" 
                        type="text" 
                        placeholder="Nom de famille"
                        required
                    />
                    <span v-if="fieldErrors.username" class="error-message">
                        {{ fieldErrors.lastname }}
                    </span>
                </div>
                <div class="form-group">
                    <input 
                        v-model="formData.email" 
                        type="email" 
                        placeholder="Email"
                        required
                    />
                    <span v-if="fieldErrors.email" class="error-message">
                        {{ fieldErrors.email }}
                    </span>
                </div>
                <div class="form-group">
                    <input 
                        v-model="formData.password" 
                        type="password" 
                        placeholder="Mot de passe"
                        required
                    />
                    <span v-if="fieldErrors.password" class="error-message">
                        {{ fieldErrors.password }}
                    </span>
                </div>
            </form> 
            <button type="submit" class="submit-button" @click="handleRegister">S'inscrire</button>
  
        </div>
    </div>
</template>

<script>
import { registerUser } from '../clientapi';

export default {
    name: 'Register',
    data() {
        return {
            formData: {
                username: '',
                lastname: '',
                email: '',
                password: '',
            },
            fieldErrors: {
                username: '',
                lastname: '',
                email: '',
                password: '',
            }
        }
    },
    methods: {
        validateForm() {
            const errors = [];

            // Validation du nom d'utilisateur
            if (this.formData.username.length < 3) {
                errors.push("Le nom d'utilisateur doit contenir au moins 3 caractères");
            }
            if (this.formData.username.length > 30) {
                errors.push("Le nom d'utilisateur ne peut pas dépasser 30 caractères");
            }
            if (!/^[a-zA-Z0-9_-]+$/.test(this.formData.username)) {
                errors.push("Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores");
            }

            // Validation du nom de famille
            if (this.formData.lastname.length < 2) {
                errors.push("Le nom de famille doit contenir au moins 2 caractères");
            }
            if (!/^[a-zA-ZÀ-ÿ\s-]+$/.test(this.formData.lastname)) {
                errors.push("Le nom de famille ne peut contenir que des lettres et des tirets");
            }

            // Validation plus stricte de l'email
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(this.formData.email)) {
                errors.push("L'adresse email n'est pas valide. Utilisez un format standard (exemple@domaine.com)");
            }
            
            // Vérification supplémentaire pour les domaines courants
            const validDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
            const emailDomain = this.formData.email.split('@')[1];
            if (!validDomains.includes(emailDomain)) {
                errors.push("Veuillez utiliser une adresse email avec un domaine connu (Gmail, Yahoo, Hotmail, Outlook)");
            }

            // Validation du mot de passe
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
            if (!/[!@#$%^&*]/.test(this.formData.password)) {
                errors.push("Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)");
            }

            return errors;
        },

        async handleRegister() {
            try {
                const errors = this.validateForm();
                if (errors.length > 0) {
                    alert(errors.join('\n'));
                    return;
                }

                const { user, profile } = await registerUser(this.formData);

                if (user) {
                    console.log('Profil créé:', profile);
                    alert('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.\nVérifiez aussi vos spams si vous ne voyez pas l\'email.');
                    this.$router.push('/');
                }

            } catch (error) {
                console.error('Erreur:', error);
                alert(
                    error.message.includes('email') 
                    ? 'Cette adresse email n\'est pas acceptée. Veuillez utiliser une adresse email valide (Gmail, Yahoo, Hotmail, Outlook).'
                    : error.message
                );
            }
        },

        validateField(fieldName) {
            // Validation en temps réel pour chaque champ
            switch(fieldName) {
                case 'username':
                    if (this.formData.username.length < 3) {
                        this.fieldErrors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères";
                    } else {
                        this.fieldErrors.username = '';
                    }
                    break;
                // Ajouter les autres cas...
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


.register-page {
    height: 100vh;
}

.welcome-section {
    background-color: #f8f1e7;
    width: 35%;
}

.form-section {
    width: 65%;
}

.form-input {
   max-width: 100%;
   width: 75%;
}

.text-gold {
    color: #B88E2F;
    font-family: 'Poppins-SemiBold';
    font-size: 32px;
}

.connect-button {
    padding: 10px 20px;
    width: 40%;
    border: 2px solid #B88E2F;
    border-radius: 30px;
    background-color: transparent;
    color: #3A3A3A;
    cursor: pointer;
    transition: background-color 0.3s;
}

.connect-button:hover {
    background-color: #B88E2F;
    color: white;
}

.input-field {
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    background-color: #f9f9f9;
}

.submit-button {
    padding: 10px 20px;
    width:20%;
    background-color: #B88E2F;
    color: white;
    border-radius: 30px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-top: 20px;
    font-family: 'Poppins-Medium';
    font-size: 16px;
}

.submit-button:hover {
    background-color: #9c7a2a;
}

.login-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
}

.form-group {
    margin-bottom: 15px;
}

input {
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
}

button {
    width: 100%;
    padding: 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background-color: #45a049;
}

.error-message {
    color: red;
    font-size: 0.8em;
    margin-top: 5px;
}
</style>
