<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Créer un Utilisateur</h1>
            <p class="mt-1 text-sm text-gray-500">Ajoutez un nouvel utilisateur à la plateforme</p>
          </div>
          <router-link
            to="/admin/users"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B88E2F]"
          >
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à la liste
          </router-link>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white shadow rounded-lg">
        <form @submit.prevent="handleSubmit" class="space-y-6 p-6">
          <!-- Personal Information -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Informations Personnelles</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- First Name -->
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span class="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  v-model="form.firstName"
                  type="text"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="Prénom"
                />
                <p v-if="errors.firstName" class="mt-1 text-sm text-red-600">{{ errors.firstName }}</p>
              </div>

              <!-- Last Name -->
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span class="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  v-model="form.lastName"
                  type="text"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="Nom"
                />
                <p v-if="errors.lastName" class="mt-1 text-sm text-red-600">{{ errors.lastName }}</p>
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Informations de Contact</h3>
            <div class="space-y-4">
              <!-- Email -->
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email <span class="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="email@exemple.com"
                />
                <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
              </div>

              <!-- Phone -->
              <div>
                <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  id="phone"
                  v-model="form.phone"
                  type="tel"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="+33 1 23 45 67 89"
                />
                <p v-if="errors.phone" class="mt-1 text-sm text-red-600">{{ errors.phone }}</p>
              </div>
            </div>
          </div>

          <!-- Account Settings -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Paramètres du Compte</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Role -->
              <div>
                <label for="role" class="block text-sm font-medium text-gray-700 mb-2">
                  Rôle <span class="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  v-model="form.role"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.role ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                >
                  <option value="">Sélectionner un rôle</option>
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
                <p v-if="errors.role" class="mt-1 text-sm text-red-600">{{ errors.role }}</p>
              </div>

              <!-- Status -->
              <div>
                <label for="isActive" class="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <div class="flex items-center">
                  <input
                    id="isActive"
                    v-model="form.isActive"
                    type="checkbox"
                    class="h-4 w-4 text-[#B88E2F] focus:ring-[#B88E2F] border-gray-300 rounded"
                  />
                  <label for="isActive" class="ml-2 block text-sm text-gray-900">
                    Compte actif
                  </label>
                </div>
                <p v-if="errors.isActive" class="mt-1 text-sm text-red-600">{{ errors.isActive }}</p>
              </div>
            </div>
          </div>

          <!-- Password -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Mot de Passe</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Password -->
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe <span class="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="Mot de passe"
                />
                <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
              </div>

              <!-- Confirm Password -->
              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe <span class="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  type="password"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="Confirmer le mot de passe"
                />
                <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">{{ errors.confirmPassword }}</p>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <router-link
              to="/admin/users"
              class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B88E2F]"
            >
              Annuler
            </router-link>
            <button
              type="submit"
              :disabled="loading"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#B88E2F] hover:bg-[#B88E2F] hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B88E2F] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Création...' : 'Créer l\'utilisateur' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'AdminUserCreateView',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const errors = reactive({})

    const form = reactive({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      isActive: true,
      password: '',
      confirmPassword: ''
    })

    const validateForm = () => {
      errors.value = {}

      if (!form.firstName.trim()) {
        errors.firstName = 'Le prénom est requis'
      }

      if (!form.lastName.trim()) {
        errors.lastName = 'Le nom est requis'
      }

      if (!form.email.trim()) {
        errors.email = 'L\'email est requis'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'L\'email n\'est pas valide'
      }

      if (!form.role) {
        errors.role = 'Le rôle est requis'
      }

      if (!form.password) {
        errors.password = 'Le mot de passe est requis'
      } else if (form.password.length < 6) {
        errors.password = 'Le mot de passe doit contenir au moins 6 caractères'
      }

      if (!form.confirmPassword) {
        errors.confirmPassword = 'La confirmation du mot de passe est requise'
      } else if (form.password !== form.confirmPassword) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas'
      }

      return Object.keys(errors).length === 0
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      try {
        loading.value = true
        
        const userData = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          role: form.role,
          isActive: form.isActive,
          password: form.password
        }

        await axios.post('/api/v1/users', userData)
        
        router.push('/admin/users')
      } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error)
        
        if (error.response?.data?.message) {
          // Handle specific error messages from the server
          const message = error.response.data.message
          if (message.includes('email')) {
            errors.email = 'Cet email est déjà utilisé'
          } else {
            // General error
            alert('Erreur lors de la création de l\'utilisateur: ' + message)
          }
        } else {
          alert('Erreur lors de la création de l\'utilisateur')
        }
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      errors,
      loading,
      handleSubmit
    }
  }
}
</script>

<style scoped>
/* Custom styles for better UX */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
