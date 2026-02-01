<template>
  <div class="admin-update-furniture bg-white shadow-lg rounded-xl p-8 max-w-4xl mx-auto mt-8">
    <div v-if="loading" class="text-center py-8 text-lg font-semibold text-gray-500">Chargement du produit...</div>
    <div v-else-if="error" class="text-center text-red-500 py-8 text-lg font-semibold">{{ error }}</div>
    <template v-else>
      <h1 class="text-2xl font-bold mb-6">Modifier le produit</h1>
      
      <form @submit.prevent="updateFurniture" class="space-y-6">
        <TextInput
          id="name"
          label="Nom du produit"
          v-model="furniture.name"
          required
        />

        <Select
          id="type"
          label="Type de meuble"
          v-model="furniture.type"
          :options="furnitureTypes"
          required
          placeholder="Sélectionnez un type"
        />

        <TextArea
          id="description"
          label="Description"
          v-model="furniture.text"
          required
        />

        <TextInput
          id="price"
          label="Prix"
          v-model="furniture.price"
          type="number"
          required
          step="0.01"
          min="0"
        />

        <div class="flex justify-end space-x-4">
          <button 
            type="button"
            class="btn btn-secondary"
            @click="$router.push('/admin/furnitures')"
          >
            Annuler
          </button>
          <button 
            type="submit"
            class="btn btn-primary"
            :disabled="updating"
          >
            {{ updating ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFurnitureById, updateFurniture as updateFurnitureApi } from '../../../api/furnituresApi';
import TextInput from '../../../components/form/TextInput.vue';
import TextArea from '../../../components/form/TextArea.vue';
import Select from '../../../components/form/Select.vue';

export default {
  components: {
    TextInput,
    TextArea,
    Select
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const furniture = ref({
      name: '',
      type: '',
      text: '',
      price: null
    });
    const loading = ref(true);
    const updating = ref(false);
    const error = ref(null);

    const furnitureTypes = [
      { label: 'Canapé', value: 'canape' },
      { label: 'Table', value: 'table' },
      { label: 'Chaise', value: 'chaise' },
      { label: 'Armoire', value: 'armoire' },
      { label: 'Lit', value: 'lit' }
    ];

    const filteredTypes = ref([]);

    const searchTypes = (event) => {
      const query = event.query.toLowerCase();
      filteredTypes.value = furnitureTypes.filter(type => 
        type.label.toLowerCase().includes(query)
      );
    };

    const fetchFurniture = async () => {
      try {
        loading.value = true;
        error.value = null;
        const data = await getFurnitureById(route.params.id);
        furniture.value = data;
      } catch (e) {
        error.value = "Erreur lors du chargement du produit.";
        console.error(e);
      } finally {
        loading.value = false;
      }
    };

    const updateFurniture = async () => {
      try {
        updating.value = true;
        await updateFurnitureApi(route.params.id, furniture.value);
        await router.push('/admin/furnitures');
      } catch (e) {
        error.value = "Erreur lors de la mise à jour du produit.";
        console.error(e);
      } finally {
        updating.value = false;
      }
    };

    onMounted(fetchFurniture);

    return {
      furniture,
      loading,
      updating,
      error,
      furnitureTypes,
      filteredTypes,
      searchTypes,
      updateFurniture
    };
  }
};
</script>

<style scoped>
.admin-update-furniture {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.07);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background-color: white;
  font-size: 1rem;
  color: #374151;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #B88E2F;
  box-shadow: 0 0 0 2px rgba(184, 142, 47, 0.2);
}

.form-input:hover {
  border-color: #B88E2F;
}

textarea.form-input {
  resize: vertical;
  min-height: 100px;
}

input[type="number"].form-input {
  -moz-appearance: textfield;
}

input[type="number"].form-input::-webkit-outer-spin-button,
input[type="number"].form-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 1rem;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary {
  background: #B88E2F;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #9a7a28;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.custom-select {
  position: relative;
  width: 100%;
}

.select-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background-color: white;
  appearance: none;
  cursor: pointer;
  font-size: 1rem;
  color: #374151;
  transition: all 0.2s ease;
}

.select-input:focus {
  outline: none;
  border-color: #B88E2F;
  box-shadow: 0 0 0 2px rgba(184, 142, 47, 0.2);
}

.custom-select::after {
  content: '';
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #6b7280;
  pointer-events: none;
}

.select-input:hover {
  border-color: #B88E2F;
}

.select-input option {
  padding: 0.5rem;
}

.select-input option:checked {
  background-color: #B88E2F;
  color: white;
}
</style>
