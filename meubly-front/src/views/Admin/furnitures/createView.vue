<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Nouveau Meuble</h1>
            <p class="mt-1 text-sm text-gray-500">Ajoutez un nouveau meuble au catalogue</p>
          </div>
          <router-link
            to="/admin/furnitures"
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
      <!-- Form -->
      <div class="bg-white shadow rounded-lg">
        <form @submit.prevent="handleSubmit" class="space-y-6 p-6">
          <!-- Basic Information -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Informations de Base</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Name -->
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                  Nom du meuble <span class="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  required
                  :class="['form-input', { error: errors.name }]"
                  placeholder="Ex: Canapé 3 places, Table de salle à manger..."
                />
                <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
              </div>

              <!-- Category -->
              <div>
                <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie <span class="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  v-model="form.category"
                  required
                  :class="['form-input', { error: errors.category }]"
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="canape">Canapé</option>
                  <option value="table">Table</option>
                  <option value="chaise">Chaise</option>
                  <option value="armoire">Armoire</option>
                  <option value="lit">Lit</option>
                  <option value="bureau">Bureau</option>
                  <option value="etagere">Étagère</option>
                  <option value="commode">Commode</option>
                  <option value="fauteuil">Fauteuil</option>
                  <option value="buffet">Buffet</option>
                  <option value="bibliotheque">Bibliothèque</option>
                  <option value="autre">Autre</option>
                </select>
                <p v-if="errors.category" class="mt-1 text-sm text-red-600">{{ errors.category }}</p>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Description</h3>
            <div>
              <label for="text" class="block text-sm font-medium text-gray-700 mb-2">
                Description détaillée <span class="text-red-500">*</span>
              </label>
              <textarea
                id="text"
                v-model="form.text"
                rows="4"
                required
                :class="['form-input', { error: errors.text }]"
                placeholder="Décrivez le meuble, ses caractéristiques, matériaux, dimensions..."
              ></textarea>
              <p v-if="errors.text" class="mt-1 text-sm text-red-600">{{ errors.text }}</p>
            </div>
          </div>

          <!-- Pricing and Stock -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Prix et Stock</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Price -->
              <div>
                <label for="price" class="block text-sm font-medium text-gray-700 mb-2">
                  Prix (€) <span class="text-red-500">*</span>
                </label>
                <input
                  id="price"
                  v-model="form.price"
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  :class="['form-input', { error: errors.price }]"
                  placeholder="0.00"
                />
                <p v-if="errors.price" class="mt-1 text-sm text-red-600">{{ errors.price }}</p>
              </div>

              <!-- Original Price -->
              <div>
                <label for="originalPrice" class="block text-sm font-medium text-gray-700 mb-2">
                  Prix original (€)
                </label>
                <input
                  id="originalPrice"
                  v-model="form.originalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  :class="['form-input', { error: errors.originalPrice }]"
                  placeholder="Prix barré si promotion"
                />
                <p v-if="errors.originalPrice" class="mt-1 text-sm text-red-600">{{ errors.originalPrice }}</p>
              </div>

              <!-- Stock -->
              <div>
                <label for="stock" class="block text-sm font-medium text-gray-700 mb-2">
                  Stock disponible
                </label>
                <input
                  id="stock"
                  v-model="form.stock"
                  type="number"
                  min="0"
                  :class="['form-input', { error: errors.stock }]"
                  placeholder="Quantité en stock"
                />
                <p v-if="errors.stock" class="mt-1 text-sm text-red-600">{{ errors.stock }}</p>
              </div>
            </div>
          </div>

          <!-- Images -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Images</h3>
            <div class="space-y-4">
              <!-- Cover Image -->
              <div>
                <label for="coverUrl" class="block text-sm font-medium text-gray-700 mb-2">
                  Image principale <span class="text-red-500">*</span>
                </label>
                <input
                  id="coverUrl"
                  v-model="form.cover_url"
                  type="url"
                  required
                  :class="['form-input', { error: errors.cover_url }]"
                  placeholder="https://exemple.com/image.jpg"
                />
                <p v-if="errors.cover_url" class="mt-1 text-sm text-red-600">{{ errors.cover_url }}</p>
                <p class="mt-1 text-xs text-gray-500">
                  URL de l'image principale du meuble
                </p>
              </div>

              <!-- Additional Images -->
              <div>
                <label for="images" class="block text-sm font-medium text-gray-700 mb-2">
                  Images supplémentaires
                </label>
                <textarea
                  id="images"
                  v-model="form.images"
                  rows="3"
                  :class="['form-input', { error: errors.images }]"
                  placeholder="URLs séparées par des virgules ou des retours à la ligne"
                ></textarea>
                <p v-if="errors.images" class="mt-1 text-sm text-red-600">{{ errors.images }}</p>
                <p class="mt-1 text-xs text-gray-500">
                  URLs des images supplémentaires, une par ligne
                </p>
              </div>
            </div>
          </div>

          <!-- Specifications -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Spécifications</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Dimensions -->
              <div>
                <label for="dimensions" class="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions
                </label>
                <input
                  id="dimensions"
                  v-model="form.dimensions"
                  type="text"
                  :class="['form-input', { error: errors.dimensions }]"
                  placeholder="Ex: L 200 x l 80 x H 75 cm"
                />
                <p v-if="errors.dimensions" class="mt-1 text-sm text-red-600">{{ errors.dimensions }}</p>
              </div>

              <!-- Material -->
              <div>
                <label for="material" class="block text-sm font-medium text-gray-700 mb-2">
                  Matériau principal
                </label>
                <input
                  id="material"
                  v-model="form.material"
                  type="text"
                  :class="['form-input', { error: errors.material }]"
                  placeholder="Ex: Bois massif, MDF, Cuir..."
                />
                <p v-if="errors.material" class="mt-1 text-sm text-red-600">{{ errors.material }}</p>
              </div>

              <!-- Color -->
              <div>
                <label for="color" class="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <input
                  id="color"
                  v-model="form.color"
                  type="text"
                  :class="['form-input', { error: errors.color }]"
                  placeholder="Ex: Blanc, Chêne, Gris..."
                />
                <p v-if="errors.color" class="mt-1 text-sm text-red-600">{{ errors.color }}</p>
              </div>

              <!-- Weight -->
              <div>
                <label for="weight" class="block text-sm font-medium text-gray-700 mb-2">
                  Poids (kg)
                </label>
                <input
                  id="weight"
                  v-model="form.weight"
                  type="number"
                  step="0.1"
                  min="0"
                  :class="['form-input', { error: errors.weight }]"
                  placeholder="Poids en kilogrammes"
                />
                <p v-if="errors.weight" class="mt-1 text-sm text-red-600">{{ errors.weight }}</p>
              </div>
            </div>
          </div>

          <!-- Additional Settings -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Paramètres Supplémentaires</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Status -->
              <div>
                <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
                  Statut <span class="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  v-model="form.status"
                  required
                  :class="['form-input', { error: errors.status }]"
                >
                  <option value="">Sélectionner un statut</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="out_of_stock">Rupture de stock</option>
                </select>
                <p v-if="errors.status" class="mt-1 text-sm text-red-600">{{ errors.status }}</p>
              </div>

              <!-- Featured -->
              <div>
                <label for="isFeatured" class="block text-sm font-medium text-gray-700 mb-2">
                  Mis en avant
                </label>
                <select
                  id="isFeatured"
                  v-model="form.is_featured"
                  :class="['form-input', { error: errors.is_featured }]"
                >
                  <option :value="false">Non</option>
                  <option :value="true">Oui</option>
                </select>
                <p v-if="errors.is_featured" class="mt-1 text-sm text-red-600">{{ errors.is_featured }}</p>
              </div>
            </div>
          </div>

          <!-- SEO and Meta -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">SEO et Métadonnées</h3>
            <div class="space-y-4">
              <!-- Meta Title -->
              <div>
                <label for="metaTitle" class="block text-sm font-medium text-gray-700 mb-2">
                  Titre SEO
                </label>
                <input
                  id="metaTitle"
                  v-model="form.meta_title"
                  type="text"
                  :class="['form-input', { error: errors.meta_title }]"
                  placeholder="Titre optimisé pour les moteurs de recherche"
                />
                <p v-if="errors.meta_title" class="mt-1 text-sm text-red-600">{{ errors.meta_title }}</p>
              </div>

              <!-- Meta Description -->
              <div>
                <label for="metaDescription" class="block text-sm font-medium text-gray-700 mb-2">
                  Description SEO
                </label>
                <textarea
                  id="metaDescription"
                  v-model="form.meta_description"
                  rows="3"
                  :class="['form-input', { error: errors.meta_description }]"
                  placeholder="Description optimisée pour les moteurs de recherche"
                ></textarea>
                <p v-if="errors.meta_description" class="mt-1 text-sm text-red-600">{{ errors.meta_description }}</p>
              </div>

              <!-- Tags -->
              <div>
                <label for="tags" class="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  id="tags"
                  v-model="form.tags"
                  type="text"
                  :class="['form-input', { error: errors.tags }]"
                  placeholder="Tags séparés par des virgules"
                />
                <p v-if="errors.tags" class="mt-1 text-sm text-red-600">{{ errors.tags }}</p>
                <p class="mt-1 text-xs text-gray-500">
                  Mots-clés pour faciliter la recherche, séparés par des virgules
                </p>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <router-link
              to="/admin/furnitures"
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
              {{ saving ? 'Création...' : 'Créer le meuble' }}
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
          <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">Meuble créé avec succès</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              Le meuble <strong>{{ form.name }}</strong> a été ajouté au catalogue avec succès.
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'AdminFurnitureCreateView',
  setup() {
    const router = useRouter()
    const saving = ref(false)
    const showSuccessModal = ref(false)

    const form = reactive({
      name: '',
      category: '',
      text: '',
      price: '',
      originalPrice: '',
      stock: '',
      cover_url: '',
      images: '',
      dimensions: '',
      material: '',
      color: '',
      weight: '',
      status: '',
      is_featured: false,
      meta_title: '',
      meta_description: '',
      tags: ''
    })

    const errors = reactive({
      name: '',
      category: '',
      text: '',
      price: '',
      originalPrice: '',
      stock: '',
      cover_url: '',
      images: '',
      dimensions: '',
      material: '',
      color: '',
      weight: '',
      status: '',
      is_featured: '',
      meta_title: '',
      meta_description: '',
      tags: ''
    })

    // Validation functions
    const validateUrl = (url) => {
      if (!url) return true // Optional field
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
        errors.name = 'Le nom du meuble est requis'
        isValid = false
      } else if (form.name.trim().length < 2) {
        errors.name = 'Le nom doit contenir au moins 2 caractères'
        isValid = false
      }

      // Category validation
      if (!form.category) {
        errors.category = 'La catégorie est requise'
        isValid = false
      }

      // Description validation
      if (!form.text.trim()) {
        errors.text = 'La description est requise'
        isValid = false
      } else if (form.text.trim().length < 10) {
        errors.text = 'La description doit contenir au moins 10 caractères'
        isValid = false
      }

      // Price validation
      if (!form.price || form.price <= 0) {
        errors.price = 'Le prix doit être supérieur à 0'
        isValid = false
      }

      // Original price validation
      if (form.originalPrice && parseFloat(form.originalPrice) <= parseFloat(form.price)) {
        errors.originalPrice = 'Le prix original doit être supérieur au prix actuel'
        isValid = false
      }

      // Cover URL validation
      if (!form.cover_url.trim()) {
        errors.cover_url = 'L\'URL de l\'image principale est requise'
        isValid = false
      } else if (!validateUrl(form.cover_url)) {
        errors.cover_url = 'L\'URL de l\'image principale n\'est pas valide'
        isValid = false
      }

      // Status validation
      if (!form.status) {
        errors.status = 'Le statut est requis'
        isValid = false
      }

      return isValid
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      try {
        saving.value = true
        
        const createData = {
          name: form.name.trim(),
          category: form.category,
          text: form.text.trim(),
          price: parseFloat(form.price),
          originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
          stock: form.stock ? parseInt(form.stock) : null,
          cover_url: form.cover_url.trim(),
          images: form.images.trim() || null,
          dimensions: form.dimensions.trim() || null,
          material: form.material.trim() || null,
          color: form.color.trim() || null,
          weight: form.weight ? parseFloat(form.weight) : null,
          status: form.status,
          is_featured: form.is_featured,
          meta_title: form.meta_title.trim() || null,
          meta_description: form.meta_description.trim() || null,
          tags: form.tags.trim() || null
        }

        await axios.post('/api/v1/furnitures', createData)
        
        showSuccessModal.value = true
        
      } catch (err) {
        console.error('Erreur lors de la création:', err)
        
        if (err.response?.data?.error) {
          // Handle specific API errors
          if (err.response.data.error.includes('name')) {
            errors.name = 'Ce nom de meuble est déjà utilisé'
          } else {
            alert('Erreur lors de la création: ' + err.response.data.error)
          }
        } else {
          alert('Erreur lors de la création du meuble')
        }
      } finally {
        saving.value = false
      }
    }

    const goToList = () => {
      showSuccessModal.value = false
      router.push('/admin/furnitures')
    }

    return {
      form,
      errors,
      saving,
      showSuccessModal,
      handleSubmit,
      goToList
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
