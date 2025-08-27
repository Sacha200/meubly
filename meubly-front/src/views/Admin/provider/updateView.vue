<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Modifier le Fournisseur</h1>
            <p class="mt-1 text-sm text-gray-500">Modifiez les informations du fournisseur</p>
          </div>
          <router-link
            to="/admin/providers"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
      <!-- Loading State -->
      <div v-if="loading && !provider" class="bg-white shadow rounded-lg p-6">
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span class="ml-3 text-gray-600">Chargement du fournisseur...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white shadow rounded-lg p-6">
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Erreur lors du chargement</h3>
          <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
          <div class="mt-6">
            <button
              @click="fetchProvider"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div v-else-if="provider" class="bg-white shadow rounded-lg">
        <form @submit.prevent="handleSubmit" class="space-y-6 p-6">
          <!-- Basic Information -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Informations de Base</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  :class="['form-input', { error: errors.name }]"
                  placeholder="Ex: IKEA, Amazon, etc."
                />
                <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
              </div>

              <!-- Type -->
              <div>
                <label for="type" class="block text-sm font-medium text-gray-700 mb-2">
                  Type de produits <span class="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  v-model="form.type"
                  required
                  :class="['form-input', { error: errors.type }]"
                >
                  <option value="">Sélectionner un type</option>
                  <option value="furniture">Meubles</option>
                  <option value="decoration">Décoration</option>
                  <option value="lighting">Éclairage</option>
                  <option value="textile">Textile</option>
                  <option value="kitchen">Cuisine</option>
                  <option value="bathroom">Salle de bain</option>
                  <option value="garden">Jardin</option>
                  <option value="general">Général</option>
                </select>
                <p v-if="errors.type" class="mt-1 text-sm text-red-600">{{ errors.type }}</p>
              </div>
            </div>
          </div>

          <!-- API Configuration -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Configuration API</h3>
            <div class="space-y-4">
              <!-- URL -->
              <div>
                <label for="url" class="block text-sm font-medium text-gray-700 mb-2">
                  URL de l'API <span class="text-red-500">*</span>
                </label>
                <input
                  id="url"
                  v-model="form.url"
                  type="url"
                  required
                  :class="['form-input', { error: errors.url }]"
                  placeholder="https://api.exemple.com/products"
                />
                <p v-if="errors.url" class="mt-1 text-sm text-red-600">{{ errors.url }}</p>
                <p class="mt-1 text-xs text-gray-500">
                  L'URL doit être accessible et retourner des données JSON
                </p>
              </div>

              <!-- API Key (Optional) -->
              <div>
                <label for="apiKey" class="block text-sm font-medium text-gray-700 mb-2">
                  Clé API (optionnel)
                </label>
                <div class="relative">
                  <input
                    id="apiKey"
                    v-model="form.apiKey"
                    :type="showApiKey ? 'text' : 'password'"
                    :class="['form-input pr-10', { error: errors.apiKey }]"
                    placeholder="Clé API si nécessaire"
                  />
                  <button
                    type="button"
                    @click="showApiKey = !showApiKey"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg v-if="showApiKey" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                    <svg v-else class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                <p v-if="errors.apiKey" class="mt-1 text-sm text-red-600">{{ errors.apiKey }}</p>
              </div>

              <!-- Request Method -->
              <div>
                <label for="requestMethod" class="block text-sm font-medium text-gray-700 mb-2">
                  Méthode de requête <span class="text-red-500">*</span>
                </label>
                <select
                  id="requestMethod"
                  v-model="form.requestMethod"
                  required
                  :class="['form-input', { error: errors.requestMethod }]"
                >
                  <option value="">Sélectionner une méthode</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
                <p v-if="errors.requestMethod" class="mt-1 text-sm text-red-600">{{ errors.requestMethod }}</p>
              </div>
            </div>
          </div>

          <!-- Additional Settings -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Paramètres Supplémentaires</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Status -->
              <div>
                <label for="isActive" class="block text-sm font-medium text-gray-700 mb-2">
                  Statut <span class="text-red-500">*</span>
                </label>
                <select
                  id="isActive"
                  v-model="form.isActive"
                  required
                  :class="['form-input', { error: errors.isActive }]"
                >
                  <option value="">Sélectionner un statut</option>
                  <option :value="true">Actif</option>
                  <option :value="false">Inactif</option>
                </select>
                <p v-if="errors.isActive" class="mt-1 text-sm text-red-600">{{ errors.isActive }}</p>
              </div>

              <!-- Priority -->
              <div>
                <label for="priority" class="block text-sm font-medium text-gray-700 mb-2">
                  Priorité d'affichage
                </label>
                <input
                  id="priority"
                  v-model="form.priority"
                  type="number"
                  min="1"
                  max="10"
                  :class="['form-input', { error: errors.priority }]"
                  placeholder="1-10 (1 = priorité haute)"
                />
                <p v-if="errors.priority" class="mt-1 text-sm text-red-600">{{ errors.priority }}</p>
                <p class="mt-1 text-xs text-gray-500">
                  Détermine l'ordre d'affichage des fournisseurs
                </p>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Description</h3>
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                Description du fournisseur
              </label>
              <textarea
                id="description"
                v-model="form.description"
                rows="4"
                :class="['form-input', { error: errors.description }]"
                placeholder="Description détaillée du fournisseur, ses spécialités, etc."
              ></textarea>
              <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
            </div>
          </div>

          <!-- Contact Information -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Informations de Contact</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Contact Email -->
              <div>
                <label for="contactEmail" class="block text-sm font-medium text-gray-700 mb-2">
                  Email de contact
                </label>
                <input
                  id="contactEmail"
                  v-model="form.contactEmail"
                  type="email"
                  :class="['form-input', { error: errors.contactEmail }]"
                  placeholder="contact@fournisseur.com"
                />
                <p v-if="errors.contactEmail" class="mt-1 text-sm text-red-600">{{ errors.contactEmail }}</p>
              </div>

              <!-- Contact Phone -->
              <div>
                <label for="contactPhone" class="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone de contact
                </label>
                <input
                  id="contactPhone"
                  v-model="form.contactPhone"
                  type="tel"
                  :class="['form-input', { error: errors.contactPhone }]"
                  placeholder="+33 1 23 45 67 89"
                />
                <p v-if="errors.contactPhone" class="mt-1 text-sm text-red-600">{{ errors.contactPhone }}</p>
              </div>
            </div>
          </div>

          <!-- Test Connection -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-900 mb-2">Tester la Connexion</h4>
            <p class="text-xs text-gray-500 mb-3">
              Testez la connexion à l'API avec les paramètres actuels
            </p>
            <button
              type="button"
              @click="testConnection"
              :disabled="testing || !form.url"
              class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B88E2F] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="testing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ testing ? 'Test en cours...' : 'Tester la connexion' }}
            </button>
            
            <div v-if="testResult" class="mt-3">
              <div class="flex items-center">
                <svg v-if="testResult.success" class="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span class="text-sm" :class="testResult.success ? 'text-green-700' : 'text-red-700'">
                  {{ testResult.message }}
                </span>
              </div>
              <p v-if="testResult.details" class="text-xs text-gray-500 mt-1">
                {{ testResult.details }}
              </p>
            </div>
          </div>

          <!-- Provider Info Display -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-900 mb-2">Informations Système</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">ID:</span>
                <span class="ml-2 font-mono text-gray-900">{{ provider.id }}</span>
              </div>
              <div>
                <span class="text-gray-500">Créé le:</span>
                <span class="ml-2 text-gray-900">{{ formatDate(provider.created_at) }}</span>
              </div>
              <div v-if="provider.updated_at">
                <span class="text-gray-500">Modifié le:</span>
                <span class="ml-2 text-gray-900">{{ formatDate(provider.updated_at) }}</span>
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
              :disabled="saving"
              class="bg-[#B88E2F] hover:bg-[#B88E2F] hover:opacity-80 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ saving ? 'Sauvegarde...' : 'Sauvegarder les modifications' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">Modifications sauvegardées</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              Les informations de <strong>{{ provider?.name }}</strong> ont été mises à jour avec succès.
            </p>
          </div>
          <div class="items-center px-4 py-3">
            <button
              @click="goToList"
              class="px-4 py-2 bg-indigo-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

export default {
  name: 'AdminProviderUpdateView',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const provider = ref(null)
    const loading = ref(true)
    const saving = ref(false)
    const testing = ref(false)
    const error = ref(null)
    const showApiKey = ref(false)
    const showSuccessModal = ref(false)
    const testResult = ref(null)

    const form = reactive({
      name: '',
      type: '',
      url: '',
      apiKey: '',
      requestMethod: '',
      isActive: '',
      priority: '',
      description: '',
      contactEmail: '',
      contactPhone: ''
    })

    const errors = reactive({
      name: '',
      type: '',
      url: '',
      apiKey: '',
      requestMethod: '',
      isActive: '',
      priority: '',
      description: '',
      contactEmail: '',
      contactPhone: ''
    })

    // Validation functions
    const validateEmail = (email) => {
      if (!email) return true // Optional field
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    const validatePhone = (phone) => {
      if (!phone) return true // Optional field
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/
      return phoneRegex.test(phone)
    }

    const validateUrl = (url) => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }

    const validateForm = () => {
      let isValid = true
      
      // Reset errors
      Object.keys(errors).forEach(key => {
        errors[key] = ''
      })

      // Name validation
      if (!form.name.trim()) {
        errors.name = 'Le nom du fournisseur est requis'
        isValid = false
      } else if (form.name.trim().length < 2) {
        errors.name = 'Le nom doit contenir au moins 2 caractères'
        isValid = false
      }

      // Type validation
      if (!form.type) {
        errors.type = 'Le type de produits est requis'
        isValid = false
      }

      // URL validation
      if (!form.url.trim()) {
        errors.url = 'L\'URL de l\'API est requise'
        isValid = false
      } else if (!validateUrl(form.url)) {
        errors.url = 'L\'URL n\'est pas valide'
        isValid = false
      }

      // Request method validation
      if (!form.requestMethod) {
        errors.requestMethod = 'La méthode de requête est requise'
        isValid = false
      }

      // Status validation
      if (form.isActive === '') {
        errors.isActive = 'Le statut est requis'
        isValid = false
      }

      // Priority validation
      if (form.priority && (form.priority < 1 || form.priority > 10)) {
        errors.priority = 'La priorité doit être comprise entre 1 et 10'
        isValid = false
      }

      // Contact email validation
      if (form.contactEmail && !validateEmail(form.contactEmail)) {
        errors.contactEmail = 'L\'email de contact n\'est pas valide'
        isValid = false
      }

      // Contact phone validation
      if (form.contactPhone && !validatePhone(form.contactPhone)) {
        errors.contactPhone = 'Le numéro de téléphone n\'est pas valide'
        isValid = false
      }

      return isValid
    }

    const fetchProvider = async () => {
      try {
        loading.value = true
        error.value = null
        const providerId = route.params.id
        const response = await axios.get(`/api/v1/providers/${providerId}`)
        
        if (response.data && response.data.length > 0) {
          provider.value = response.data[0]
          
          // Populate form with provider data
          form.name = provider.value.name || ''
          form.type = provider.value.type || ''
          form.url = provider.value.url || ''
          form.apiKey = provider.value.apiKey || ''
          form.requestMethod = provider.value.requestMethod || ''
          form.isActive = provider.value.isActive
          form.priority = provider.value.priority || ''
          form.description = provider.value.description || ''
          form.contactEmail = provider.value.contactEmail || ''
          form.contactPhone = provider.value.contactPhone || ''
        } else {
          error.value = 'Fournisseur non trouvé'
        }
      } catch (err) {
        console.error('Erreur lors du chargement du fournisseur:', err)
        error.value = 'Erreur lors du chargement du fournisseur'
      } finally {
        loading.value = false
      }
    }

    const testConnection = async () => {
      if (!form.url) {
        testResult.value = {
          success: false,
          message: 'Veuillez d\'abord saisir une URL',
          details: ''
        }
        return
      }

      try {
        testing.value = true
        testResult.value = null

        // Test the API endpoint
        const response = await axios.get(form.url, {
          timeout: 10000,
          headers: form.apiKey ? {
            'Authorization': `Bearer ${form.apiKey}`,
            'Content-Type': 'application/json'
          } : {
            'Content-Type': 'application/json'
          }
        })

        if (response.status === 200) {
          testResult.value = {
            success: true,
            message: 'Connexion réussie !',
            details: `Statut: ${response.status}, Données reçues: ${JSON.stringify(response.data).length} caractères`
          }
        } else {
          testResult.value = {
            success: false,
            message: 'Connexion échouée',
            details: `Code de statut: ${response.status}`
          }
        }
      } catch (error) {
        testResult.value = {
          success: false,
          message: 'Erreur de connexion',
          details: error.message
        }
      } finally {
        testing.value = false
      }
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      try {
        saving.value = true
        
        const updateData = {
          name: form.name.trim(),
          type: form.type,
          url: form.url.trim(),
          apiKey: form.apiKey.trim() || null,
          requestMethod: form.requestMethod,
          isActive: form.isActive,
          priority: form.priority ? parseInt(form.priority) : null,
          description: form.description.trim() || null,
          contactEmail: form.contactEmail.trim() || null,
          contactPhone: form.contactPhone.trim() || null
        }

        const providerId = route.params.id
        await axios.patch(`/api/v1/providers/${providerId}`, updateData)
        
        showSuccessModal.value = true
        
      } catch (err) {
        console.error('Erreur lors de la mise à jour:', err)
        
        if (err.response?.data?.error) {
          // Handle specific API errors
          if (err.response.data.error.includes('name')) {
            errors.name = 'Ce nom de fournisseur est déjà utilisé'
          } else if (err.response.data.error.includes('url')) {
            errors.url = 'Cette URL est déjà utilisée'
          } else {
            alert('Erreur lors de la mise à jour: ' + err.response.data.error)
          }
        } else {
          alert('Erreur lors de la mise à jour du fournisseur')
        }
      } finally {
        saving.value = false
      }

    }

    const goToList = () => {
      showSuccessModal.value = false
      router.push('/admin/providers')
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Lifecycle
    onMounted(() => {
      fetchProvider()
    })

    return {
      provider,
      loading,
      saving,
      testing,
      error,
      form,
      errors,
      showApiKey,
      showSuccessModal,
      testResult,
      fetchProvider,
      testConnection,
      handleSubmit,
      goToList,
      formatDate
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

/* Classe réutilisable pour tous les inputs */
.form-input {
  @apply w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2;
}

.form-input:not(.error) {
  @apply border-gray-300 focus:border-[#B88E2F] focus:ring-[#B88E2F];
}

.form-input.error {
  @apply border-red-300 focus:border-red-500 focus:ring-red-500;
}
</style>
