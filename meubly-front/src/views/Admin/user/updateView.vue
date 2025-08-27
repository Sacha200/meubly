<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Modifier l'Utilisateur</h1>
            <p class="mt-1 text-sm text-gray-500">Modifiez les informations de l'utilisateur</p>
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
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B88E2F]"></div>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Erreur</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{{ error }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white shadow rounded-lg">
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

          <!-- Password (Optional for updates) -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Mot de Passe (Optionnel)</h3>
            <p class="text-sm text-gray-500 mb-4">Laissez vide pour conserver le mot de passe actuel</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Password -->
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="Nouveau mot de passe"
                />
                <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
              </div>

              <!-- Confirm Password -->
              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  type="password"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="Confirmer le nouveau mot de passe"
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
              {{ loading ? 'Modification...' : 'Modifier l\'utilisateur' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

export default {
  name: 'AdminUserUpdateView',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(false)
    const error = ref('')
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

    const fetchUser = async () => {
      try {
        loading.value = true
        const response = await axios.get(`/api/v1/users/${route.params.id}`)
        const user = response.data
        
        form.firstName = user.firstName || ''
        form.lastName = user.lastName || ''
        form.email = user.email || ''
        form.phone = user.phone || ''
        form.role = user.role || ''
        form.isActive = user.isActive !== undefined ? user.isActive : true
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error)
        error.value = 'Impossible de charger les données de l\'utilisateur'
      } finally {
        loading.value = false
      }
    }

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

      // Password validation only if password is provided
      if (form.password && form.password.length < 6) {
        errors.password = 'Le mot de passe doit contenir au moins 6 caractères'
      }

      if (form.password && !form.confirmPassword) {
        errors.confirmPassword = 'La confirmation du mot de passe est requise'
      } else if (form.password && form.password !== form.confirmPassword) {
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
          isActive: form.isActive
        }

        // Only include password if provided
        if (form.password) {
          userData.password = form.password
        }

        await axios.put(`/api/v1/users/${route.params.id}`, userData)
        
        router.push('/admin/users')
      } catch (error) {
        console.error('Erreur lors de la modification de l\'utilisateur:', error)
        
        if (error.response?.data?.message) {
          const message = error.response.data.message
          if (message.includes('email')) {
            errors.email = 'Cet email est déjà utilisé'
          } else {
            alert('Erreur lors de la modification de l\'utilisateur: ' + message)
          }
        } else {
          alert('Erreur lors de la modification de l\'utilisateur')
        }
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchUser()
    })

    return {
      form,
      errors,
      loading,
      error,
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

