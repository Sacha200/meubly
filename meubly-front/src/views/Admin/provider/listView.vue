<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Gestion des Fournisseurs</h1>
            <p class="mt-1 text-sm text-gray-500">Gérez les fournisseurs partenaires de la plateforme</p>
          </div>
          <router-link
            to="/admin/providers/create"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#B88E2F] hover:bg-[#B88E2F] hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B88E2F]"
          >
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouveau Fournisseur
          </router-link>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Search and Filters -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Search -->
          <div>
            <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <div class="relative">
              <input
                id="search"
                v-model="searchQuery"
                type="text"
                placeholder="Nom, URL, description..."
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F] focus:border-[#B88E2F]"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Status Filter -->
          <div>
            <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              id="status-filter"
              v-model="statusFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F] focus:border-[#B88E2F]"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>

          <!-- Type Filter -->
          <div>
            <label for="type-filter" class="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              id="type-filter"
              v-model="typeFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B88E2F] focus:border-[#B88E2F]"
            >
              <option value="">Tous les types</option>
              <option value="furniture">Meubles</option>
              <option value="decoration">Décoration</option>
              <option value="lighting">Éclairage</option>
              <option value="textile">Textile</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Providers Table -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B88E2F]"></div>
        </div>

        <div v-else-if="filteredProviders.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Aucun fournisseur trouvé</h3>
          <p class="mt-1 text-sm text-gray-500">Aucun fournisseur ne correspond à vos critères de recherche.</p>
        </div>

        <ul v-else class="divide-y divide-gray-200">
          <li v-for="provider in paginatedProviders" :key="provider.id" class="px-6 py-4 hover:bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="h-12 w-12 rounded-lg bg-[#B88E2F] bg-opacity-10 flex items-center justify-center">
                    <svg class="h-6 w-6 text-[#B88E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="flex items-center">
                    <p class="text-sm font-medium text-gray-900">{{ provider.name }}</p>
                    <span
                      v-if="provider.isActive"
                      class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      Actif
                    </span>
                    <span
                      v-else
                      class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      Inactif
                    </span>
                  </div>
                  <p class="text-sm text-gray-500">{{ provider.url }}</p>
                  <p v-if="provider.description" class="text-xs text-gray-400 mt-1">
                    {{ provider.description }}
                  </p>
                  <div class="flex items-center mt-1 text-xs text-gray-400">
                    <span>Type: {{ provider.type || 'Non spécifié' }}</span>
                    <span class="mx-2">•</span>
                    <span>Ajouté le {{ formatDate(provider.created_at) }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <div class="flex items-center space-x-1">
                  <button
                    @click="testProvider(provider)"
                    class="text-blue-600 hover:text-blue-900 p-1 rounded"
                    title="Tester la connexion"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                  <button
                    @click="editProvider(provider)"
                    class="text-[#B88E2F] hover:text-[#B88E2F] hover:opacity-80 p-1 rounded"
                    title="Modifier"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="deleteProvider(provider)"
                    class="text-red-600 hover:text-red-900 p-1 rounded"
                    title="Supprimer"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>

        <!-- Pagination -->
        <div v-if="filteredProviders.length > itemsPerPage" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              :class="[
                'relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md',
                currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              ]"
            >
              Précédent
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage >= totalPages"
              :class="[
                'ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md',
                currentPage >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              ]"
            >
              Suivant
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Affichage de <span class="font-medium">{{ startIndex + 1 }}</span> à <span class="font-medium">{{ endIndex }}</span> sur <span class="font-medium">{{ filteredProviders.length }}</span> résultats
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  @click="previousPage"
                  :disabled="currentPage === 1"
                  :class="[
                    'relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium',
                    currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  ]"
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                    page === currentPage
                      ? 'z-10 bg-[#B88E2F] border-[#B88E2F] text-white'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>
                <button
                  @click="nextPage"
                  :disabled="currentPage >= totalPages"
                  :class="[
                    'relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium',
                    currentPage >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  ]"
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">Confirmer la suppression</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              Êtes-vous sûr de vouloir supprimer le fournisseur <strong>{{ providerToDelete?.name }}</strong> ? Cette action est irréversible.
            </p>
          </div>
          <div class="items-center px-4 py-3">
            <button
              @click="confirmDelete"
              class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              Supprimer
            </button>
            <button
              @click="cancelDelete"
              class="mt-2 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Result Modal -->
    <div v-if="showTestModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full" :class="testResult.success ? 'bg-green-100' : 'bg-red-100'">
            <svg v-if="testResult.success" class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">
            {{ testResult.success ? 'Test réussi' : 'Test échoué' }}
          </h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              {{ testResult.message }}
            </p>
            <p v-if="testResult.details" class="text-xs text-gray-400 mt-2">
              {{ testResult.details }}
            </p>
          </div>
          <div class="items-center px-4 py-3">
            <button
              @click="closeTestModal"
              class="px-4 py-2 bg-[#B88E2F] text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-[#B88E2F] hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#B88E2F]"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'AdminProvidersListView',
  setup() {
    const router = useRouter()
    const providers = ref([])
    const loading = ref(true)
    const searchQuery = ref('')
    const statusFilter = ref('')
    const typeFilter = ref('')
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const showDeleteModal = ref(false)
    const providerToDelete = ref(null)
    const showTestModal = ref(false)
    const testResult = ref({})

    // Computed properties
    const filteredProviders = computed(() => {
      let filtered = providers.value

      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(provider => 
          provider.name?.toLowerCase().includes(query) ||
          provider.url?.toLowerCase().includes(query) ||
          provider.description?.toLowerCase().includes(query)
        )
      }

      if (statusFilter.value) {
        filtered = filtered.filter(provider => {
          if (statusFilter.value === 'active') return provider.isActive
          if (statusFilter.value === 'inactive') return !provider.isActive
          return true
        })
      }

      if (typeFilter.value) {
        filtered = filtered.filter(provider => provider.type === typeFilter.value)
      }

      return filtered
    })

    const totalPages = computed(() => Math.ceil(filteredProviders.value.length / itemsPerPage.value))
    const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
    const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, filteredProviders.value.length))
    const paginatedProviders = computed(() => 
      filteredProviders.value.slice(startIndex.value, endIndex.value)
    )

    const visiblePages = computed(() => {
      const pages = []
      const maxVisible = 5
      let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
      let end = Math.min(totalPages.value, start + maxVisible - 1)
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      return pages
    })

    // Methods
    const fetchProviders = async () => {
      try {
        loading.value = true
        const response = await axios.get('/api/v1/providers')
        providers.value = response.data
      } catch (error) {
        console.error('Erreur lors de la récupération des fournisseurs:', error)
      } finally {
        loading.value = false
      }
    }

    const editProvider = (provider) => {
      router.push(`/admin/providers/${provider.id}/edit`)
    }

    const deleteProvider = (provider) => {
      providerToDelete.value = provider
      showDeleteModal.value = true
    }

    const confirmDelete = async () => {
      try {
        await axios.delete(`/api/v1/providers/${providerToDelete.value.id}`)
        await fetchProviders()
        showDeleteModal.value = false
        providerToDelete.value = null
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }

    const cancelDelete = () => {
      showDeleteModal.value = false
      providerToDelete.value = null
    }

    const testProvider = async (provider) => {
      try {
        // Test the provider's API endpoint
        const response = await axios.get(`/api/v1/${provider.name.toLowerCase()}/offers/1`)
        
        if (response.status === 200) {
          testResult.value = {
            success: true,
            message: `Connexion réussie avec ${provider.name}`,
            details: `Récupération de ${response.data?.length || 0} produits`
          }
        } else {
          testResult.value = {
            success: false,
            message: `Échec de la connexion avec ${provider.name}`,
            details: `Code de statut: ${response.status}`
          }
        }
      } catch (error) {
        testResult.value = {
          success: false,
          message: `Erreur de connexion avec ${provider.name}`,
          details: error.message
        }
      }
      
      showTestModal.value = true
    }

    const closeTestModal = () => {
      showTestModal.value = false
      testResult.value = {}
    }

    const previousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
      }
    }

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
      }
    }

    const goToPage = (page) => {
      currentPage.value = page
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString('fr-FR')
    }

    // Lifecycle
    onMounted(() => {
      fetchProviders()
    })

    return {
      providers,
      loading,
      searchQuery,
      statusFilter,
      typeFilter,
      currentPage,
      itemsPerPage,
      showDeleteModal,
      providerToDelete,
      showTestModal,
      testResult,
      filteredProviders,
      totalPages,
      startIndex,
      endIndex,
      paginatedProviders,
      visiblePages,
      fetchProviders,
      editProvider,
      deleteProvider,
      confirmDelete,
      cancelDelete,
      testProvider,
      closeTestModal,
      previousPage,
      nextPage,
      goToPage,
      formatDate
    }
  }
}
</script>

<style scoped>
/* Custom styles for better UX */
.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}

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
  

  
  
  