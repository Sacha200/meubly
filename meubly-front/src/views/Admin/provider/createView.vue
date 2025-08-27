<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Créer un Fournisseur</h1>
            <p class="mt-1 text-sm text-gray-500">Ajoutez un nouveau fournisseur à la plateforme</p>
          </div>
          <router-link
            to="/admin/providers"
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
          <!-- Basic Information -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Informations de Base</h3>
            <div class="space-y-4">
              <!-- Name -->
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                  Nom du fournisseur <span class="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="Nom du fournisseur"
                />
                <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
              </div>

              <!-- URL -->
              <div>
                <label for="url" class="block text-sm font-medium text-gray-700 mb-2">
                  URL du site web <span class="text-red-500">*</span>
                </label>
                <input
                  id="url"
                  v-model="form.url"
                  type="url"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.url ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="https://www.exemple.com"
                />
                <p v-if="errors.url" class="mt-1 text-sm text-red-600">{{ errors.url }}</p>
              </div>

              <!-- Description -->
              <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  v-model="form.description"
                  rows="3"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="Description du fournisseur et de ses services..."
                ></textarea>
                <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
              </div>
            </div>
          </div>

          <!-- Provider Settings -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Paramètres du Fournisseur</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Type -->
              <div>
                <label for="type" class="block text-sm font-medium text-gray-700 mb-2">
                  Type de fournisseur
                </label>
                <select
                  id="type"
                  v-model="form.type"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.type ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                >
                  <option value="">Sélectionner un type</option>
                  <option value="furniture">Meubles</option>
                  <option value="decoration">Décoration</option>
                  <option value="lighting">Éclairage</option>
                  <option value="textile">Textile</option>
                </select>
                <p v-if="errors.type" class="mt-1 text-sm text-red-600">{{ errors.type }}</p>
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
                    Fournisseur actif
                  </label>
                </div>
                <p v-if="errors.isActive" class="mt-1 text-sm text-red-600">{{ errors.isActive }}</p>
              </div>
            </div>
          </div>

          <!-- API Configuration -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Configuration API</h3>
            <div class="space-y-4">
              <!-- API Endpoint -->
              <div>
                <label for="apiEndpoint" class="block text-sm font-medium text-gray-700 mb-2">
                  Point d'entrée API
                </label>
                <input
                  id="apiEndpoint"
                  v-model="form.apiEndpoint"
                  type="url"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.apiEndpoint ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="https://api.exemple.com/products"
                />
                <p v-if="errors.apiEndpoint" class="mt-1 text-sm text-red-600">{{ errors.apiEndpoint }}</p>
              </div>

              <!-- API Key -->
              <div>
                <label for="apiKey" class="block text-sm font-medium text-gray-700 mb-2">
                  Clé API
                </label>
                <input
                  id="apiKey"
                  v-model="form.apiKey"
                  type="password"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F]',
                    errors.apiKey ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#B88E2F]'
                  ]"
                  placeholder="Clé API (optionnelle)"
                />
                <p v-if="errors.apiKey" class="mt-1 text-sm text-red-600">{{ errors.apiKey }}</p>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <router-link
              to="/admin/providers"
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
              {{ loading ? 'Création...' : 'Créer le fournisseur' }}
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
  name: 'AdminProviderCreateView',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const errors = reactive({})

    const form = reactive({
      name: '',
      url: '',
      description: '',
      type: '',
      isActive: true,
      apiEndpoint: '',
      apiKey: ''
    })

    const validateForm = () => {
      errors.value = {}

      if (!form.name.trim()) {
        errors.name = 'Le nom du fournisseur est requis'
      }

      if (!form.url.trim()) {
        errors.url = 'L\'URL est requise'
      } else if (!/^https?:\/\/.+/.test(form.url)) {
        errors.url = 'L\'URL doit commencer par http:// ou https://'
      }

      if (form.apiEndpoint && !/^https?:\/\/.+/.test(form.apiEndpoint)) {
        errors.apiEndpoint = 'L\'URL de l\'API doit commencer par http:// ou https://'
      }

      return Object.keys(errors).length === 0
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      try {
        loading.value = true
        
        const providerData = {
          name: form.name,
          url: form.url,
          description: form.description || null,
          type: form.type || null,
          isActive: form.isActive,
          apiEndpoint: form.apiEndpoint || null,
          apiKey: form.apiKey || null
        }

        await axios.post('/api/v1/providers', providerData)
        
        router.push('/admin/providers')
      } catch (error) {
        console.error('Erreur lors de la création du fournisseur:', error)
        
        if (error.response?.data?.message) {
          const message = error.response.data.message
          if (message.includes('name')) {
            errors.name = 'Ce nom de fournisseur est déjà utilisé'
          } else if (message.includes('url')) {
            errors.url = 'Cette URL est déjà utilisée'
          } else {
            alert('Erreur lors de la création du fournisseur: ' + message)
          }
        } else {
          alert('Erreur lors de la création du fournisseur')
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
