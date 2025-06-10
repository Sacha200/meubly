<template>
  <div class="admin-products bg-white shadow-lg rounded-xl p-8 max-w-6xl mx-auto mt-8">
    <div v-if="loading" class="text-center py-8 text-lg font-semibold text-gray-500">Chargement des produits...</div>
    <div v-else-if="error" class="text-center text-red-500 py-8 text-lg font-semibold">{{ error }}</div>
    <template v-else>
      <!-- Barre de recherche et filtres -->
      <div class="header-filters flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div class="flex flex-wrap items-center gap-3">
          <input 
            v-model="search" 
            type="text" 
            placeholder="Rechercher un produit..." 
            class="search-input h-12 px-4 rounded-full border border-gray-300 shadow-sm"
          />
          <div class="relative">
            <input 
              v-model="selectedCategory" 
              type="text" 
              placeholder="Catégorie" 
              class="filter-input w-48 h-12 px-4 rounded-full border border-gray-300 shadow-sm"
              @input="searchCategory"
            />
            <div v-if="filteredCategories.length" class="suggestions-dropdown">
              <div 
                v-for="category in filteredCategories" 
                :key="category.value"
                class="suggestion-item"
                @click="selectedCategory = category"
              >
                {{ category.label }}
              </div>
            </div>
          </div>
          <div class="relative">
            <input 
              v-model="selectedStatus" 
              type="text" 
              placeholder="Statut" 
              class="filter-input w-40 h-12 px-4 rounded-full border border-gray-300 shadow-sm"
              @input="searchStatus"
            />
            <div v-if="filteredStatuses.length" class="suggestions-dropdown">
              <div 
                v-for="status in filteredStatuses" 
                :key="status.value"
                class="suggestion-item"
                @click="selectedStatus = status"
              >
                {{ status.label }}
              </div>
            </div>
          </div>
          <div class="relative">
            <input 
              v-model="selectedPrice" 
              type="text" 
              placeholder="Prix" 
              class="filter-input w-40 h-12 px-4 rounded-full border border-gray-300 shadow-sm"
              @input="searchPrice"
            />
            <div v-if="filteredPrices.length" class="suggestions-dropdown">
              <div 
                v-for="price in filteredPrices" 
                :key="price.value"
                class="suggestion-item"
                @click="selectedPrice = price"
              >
                {{ price.label }}
              </div>
            </div>
          </div>
        </div>
        <button class="add-product-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4.16666V15.8333" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4.16666 10H15.8333" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Ajouter un produit
        </button>
      </div>

      <!-- Tableau des produits -->
      <div class="products-table-container">
        <div class="table-header">
          <button class="refresh-btn" @click="refreshProducts">
            <i class="pi pi-refresh"></i>
          </button>
        </div>
        <table class="products-table">
          <thead>
            <tr>
              <th><input type="checkbox" class="select-all" /></th>
              <th>Image</th>
              <th>Nom du produit</th>
              <th>Prix unitaire</th>
              <th>Offres</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in paginatedProducts" :key="product.furniture_id">
              <td><input type="checkbox" class="select-item" /></td>
              <td>
                <img :src="product.cover_url" :alt="product.name" class="product-image" />
              </td>
              <td>{{ product.name }}</td>
              <td>{{ formatCurrency(product.price) }}</td>
              <td>{{ product.nb_offers }}</td>
              <td>
                <span :class="['status-tag', getStatusClass(product.status)]">
                  {{ product.status }}
                </span>
              </td>
              <td class="action-buttons">
                <button class="update-btn" @click="navigateToUpdateFurniture(product.furniture_id)">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.1667 2.5C14.3855 2.5 14.5953 2.5878 14.7559 2.74448C14.9165 2.90116 15.0167 3.11449 15.0167 3.33748V16.6625C15.0167 16.8855 14.9165 17.0988 14.7559 17.2555C14.5953 17.4122 14.3855 17.5 14.1667 17.5H5.83333C5.61449 17.5 5.40473 17.4122 5.24408 17.2555C5.08343 17.0988 4.98333 16.8855 4.98333 16.6625V3.33748C4.98333 3.11449 5.08343 2.90116 5.24408 2.74448C5.40473 2.5878 5.61449 2.5 5.83333 2.5H14.1667ZM13.3333 4.16667H6.66667V15.8333H13.3333V4.16667ZM8.33333 7.5H11.6667V9.16667H8.33333V7.5ZM8.33333 10.8333H11.6667V12.5H8.33333V10.8333Z" fill="white"/>
                  </svg>
                  Modifier
                </button>
                <button class="delete-btn">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 2.5H6.66667L5.83333 3.33333H3.33333V5H16.6667V3.33333H14.1667L13.3333 2.5ZM4.16667 15.8333C4.16667 16.2754 4.34226 16.6993 4.65482 17.0118C4.96738 17.3244 5.39131 17.5 5.83333 17.5H14.1667C14.6087 17.5 15.0326 17.3244 15.3452 17.0118C15.6577 16.6993 15.8333 16.2754 15.8333 15.8333V5.83333H4.16667V15.8333ZM6.66667 7.5H13.3333V15H6.66667V7.5Z" fill="white"/>
                  </svg>
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="paginatedProducts.length === 0" class="no-products">
          Aucun produit trouvé.
        </div>
      </div>

      <!-- Paginator -->
      <div class="flex justify-center mt-8">
        <Paginator :rows="rowsPerPage" :totalRecords="filteredProducts.length" :first="first" @page="onPageChange" />
      </div>
    </template>
  </div>
</template>

<script>
import Paginator from 'primevue/paginator';
import { getProducts } from '../../../clientapi';

export default {
  components: {
    Paginator
  },
  data() {
    return {
      products: [],
      loading: true,
      error: null,
      categories: [],
      filteredCategories: [],
      status: [
        { label: 'Tous les statuts', value: null },
        { label: 'Actif', value: 'Actif' },
        { label: 'Inactif', value: 'Inactif' },
      ],
      filteredStatuses: [],
      prices: [
        { label: 'Tous les prix', value: null },
        { label: '50€ - 100€', value: '50-100' },
        { label: '100€ - 200€', value: '100-200' },
      ],
      filteredPrices: [],
      search: '',
      selectedCategory: null,
      selectedStatus: null,
      selectedPrice: null,
      first: 0,
      rowsPerPage: 7
    }
  },
  async created() {
    try {
      this.loading = true;
      this.error = null;
      const data = await getProducts();
      this.products = Array.isArray(data) ? data : data.data || [];
    } catch (e) {
      this.error = "Erreur lors du chargement des produits.";
      console.error(e);
    } finally {
      this.loading = false;
    }
  },
  computed: {
    filteredProducts() {
      return this.products.filter((p) => {
        const matchSearch = p.name?.toLowerCase().includes(this.search.toLowerCase());
        // Ajoute d'autres filtres si besoin
        return matchSearch;
      });
    },
    paginatedProducts() {
      const start = this.first;
      const end = start + this.rowsPerPage;
      console.log(this.filteredProducts)
      return this.filteredProducts.slice(start, end);
    }
  },
  methods: {
    searchCategory(event) {
      this.filteredCategories = this.categories.filter(cat =>
        cat.label.toLowerCase().includes(event.query.toLowerCase())
      );
    },
    searchStatus(event) {
      this.filteredStatuses = this.statuses.filter(stat =>
        stat.label.toLowerCase().includes(event.query.toLowerCase())
      );
    },
    searchPrice(event) {
      this.filteredPrices = this.prices.filter(price =>
        price.label.toLowerCase().includes(event.query.toLowerCase())
      );
    },
    formatCurrency(value) {
      return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    },
    getStatusClass(status) {
      switch (status) {
        case 'Actif':
          return 'success';
        case 'Inactif':
          return 'danger';
        default:
          return null;
      }
    },
    async refreshProducts() {
      try {
        this.loading = true;
        this.error = null;
        const data = await getProducts();
        this.products = Array.isArray(data) ? data : data.data || [];
      } catch (e) {
        this.error = "Erreur lors du chargement des produits.";
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    onPageChange(event) {
      this.first = event.first;
      this.rowsPerPage = event.rows;
    },
    navigateToUpdateFurniture(id) {
      this.$router.push(`/admin/furnitures/${id}`);
    }
  }
}
</script>

<style scoped>
.admin-products {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.07);
  padding: 2rem 2.5rem;
  margin-top: 2rem;
}

.search-input,
.filter-input {
  font-family: 'Poppins-Regular';
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus,
.filter-input:focus {
  border-color: #B88E2F;
  box-shadow: 0 0 0 2px rgba(184, 142, 47, 0.1);
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #f7f7f7;
}

.add-product-btn {
  background: #B88E2F;
  color: #fff;
  border-radius: 10px;
  padding-inline: 16px;
  padding-block: 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-family: 'Poppins-Semibold';
  justify-content: center;
}

.products-table-container {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px solid #e2e8f0;
}

.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.refresh-btn:hover {
  color: #B88E2F;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table th,
.products-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.products-table th {
  font-family: 'Poppins-Medium';
  color: #222;
  background-color: #f8fafc;
}

.products-table td {
  font-family: 'Poppins-Regular';
  color: #333;
}

.product-image {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-tag.success {
  background-color: #dcfce7;
  color: #166534;
}

.status-tag.danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 100%;
  justify-content: flex-start;
  margin-top: 16px;
}

.update-btn,
.delete-btn {
  padding: 4px 8px;
  border-radius: 15px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-family: 'Poppins-Regular';
  height: 32px;
  min-width: 90px;
  justify-content: center;
}

.update-btn {
  background: #B88E2F;
  opacity: 0.3;
  color: #fff;
}

.update-btn:hover {
  background: #B88E2F;
  opacity: 1;
  transition: all 0.3s ease;
}

.delete-btn {
  background: #FF0000;
  opacity: 0.3;
  color: #fff;
}

.delete-btn:hover {
  background: #FF0000;
  opacity: 1;
  transition: all 0.3s ease;
}

.no-products {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-family: 'Poppins-Regular';
}

/* Paginator styles */
:deep(.p-paginator) {
  background: transparent;
  border: none;
  padding: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.p-paginator-page) {
  width: 40px;
  height: 40px;
  margin: 0 4px;
  border-radius: 50%;
  border: none;
  color: #3A3A3A;
  font-family: 'Poppins-Medium';
  transition: all 0.3s ease;
  cursor: pointer;
}

:deep(.p-paginator-page.p-highlight) {
  background-color: #B88E2F !important;
  color: #FFFFFF !important;
  border: 2px solid #B88E2F;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page:not(.p-highlight):hover) {
  background: rgba(184, 142, 47, 0.1);
  color: #B88E2F;
}
</style>
