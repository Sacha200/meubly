<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-gray-50">
    <!-- Section bienvenue -->
    <div class="w-full md:w-1/2 flex flex-col items-center justify-center bg-[#f8f1e7] p-8 md:p-10 h-full min-h-[50vh] md:min-h-screen">
      <h1 class="text-center font-bold text-2xl md:text-3xl text-[#3A3A3A] mb-4">
        Bienvenue sur <br />
        <span class="text-gold">Meubly !</span>
      </h1>
      <button @click="login" class="connect-button mt-6">Se connecter</button>
    </div>
    <!-- Section formulaire -->
    <div class="w-full md:w-1/2 flex flex-col items-center justify-center p-4 md:p-10">
      <div class="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 class="text-gold mb-6 text-2xl font-semibold text-center">Création de compte</h2>
        <form @submit.prevent="handleRegister" class="flex flex-col space-y-4">
          <div class="form-group">
            <input
              v-model="formData.username"
              type="text"
              placeholder="Nom d'utilisateur"
              @input="validateField('username')"
              required
              class="input-field"
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
              class="input-field"
            />
            <span v-if="fieldErrors.lastname" class="error-message">
              {{ fieldErrors.lastname }}
            </span>
          </div>
          <div class="form-group">
            <input
              v-model="formData.email"
              type="email"
              placeholder="Email"
              required
              class="input-field"
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
              class="input-field"
            />
            <span v-if="fieldErrors.password" class="error-message">
              {{ fieldErrors.password }}
            </span>
          </div>
          <button type="submit" class="submit-button mt-2">S'inscrire</button>
        </form>
      </div>
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
    },
    login() {
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
.text-gold {
  color: #B88E2F;
  font-family: 'Poppins-SemiBold';
}

.input-field {
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background-color: #f9f9f9;
  width: 100%;
  font-size: 1rem;
}

.connect-button {
  padding: 10px 20px;
  width: 180px;
  border: 2px solid #B88E2F;
  border-radius: 30px;
  background-color: transparent;
  color: #3A3A3A;
  cursor: pointer;
  transition: background-color 0.3s;
  font-family: 'Poppins-Medium';
  font-size: 16px;
}

.connect-button:hover {
  background-color: #B88E2F;
  color: white;
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
</style>
