<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow-sm border-b">
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center gap-4"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Partenaires</h1>
          <p class="mt-1 text-sm text-gray-500">Enseignes et marchands référencés sur Meubly.</p>
        </div>
        <router-link
          to="/admin/providers/create"
          class="px-4 py-2 rounded-md text-white bg-primary-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Nouveau partenaire
        </router-link>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <p v-if="errorMessage" role="alert" class="mb-4 text-sm text-red-700">{{ errorMessage }}</p>

      <div class="bg-white shadow sm:rounded-md overflow-x-auto">
        <p v-if="loading" class="py-12 text-center text-gray-500" aria-live="polite">
          Chargement...
        </p>
        <p v-else-if="providers.length === 0" class="py-12 text-center text-gray-500">
          Aucun partenaire.
        </p>
        <table v-else class="min-w-full divide-y divide-gray-200">
          <caption class="sr-only">
            Partenaires
          </caption>
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-600">Nom</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-600">
                Site
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-600">
                Statut
              </th>
              <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="provider in providers" :key="provider.id">
              <td class="px-4 py-3 text-sm text-gray-900">{{ provider.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">
                <a
                  v-if="provider.url"
                  :href="provider.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="underline"
                  >{{ provider.url }}</a
                >
                <span v-else>-</span>
              </td>
              <td class="px-4 py-3 text-sm">
                <span :class="provider.isActive ? 'text-green-700' : 'text-gray-600'">
                  {{ provider.isActive ? "Actif" : "Inactif" }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-right whitespace-nowrap">
                <router-link
                  :to="`/admin/providers/${provider.id}/edit`"
                  class="mr-3 underline text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                >
                  Modifier <span class="sr-only">{{ provider.name }}</span>
                </router-link>
                <button
                  type="button"
                  class="underline text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                  @click="askDelete(provider)"
                >
                  Supprimer <span class="sr-only">{{ provider.name }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="providerToDelete"
      class="fixed inset-0 bg-gray-600/50 flex items-start justify-center pt-20 z-50"
      @keydown.esc="providerToDelete = null"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="provider-delete-title"
        aria-describedby="provider-delete-desc"
        class="w-96 max-w-[calc(100%-2rem)] p-5 rounded-md bg-white shadow-lg"
      >
        <h2 id="provider-delete-title" class="text-lg font-medium text-gray-900">
          Supprimer le partenaire ?
        </h2>
        <p id="provider-delete-desc" class="mt-2 text-sm text-gray-600">
          <strong>{{ providerToDelete.name }}</strong> sera supprimé définitivement.
        </p>
        <div class="mt-4 flex justify-end gap-2">
          <button
            ref="cancelButton"
            type="button"
            class="px-4 py-2 rounded-md bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
            @click="providerToDelete = null"
          >
            Annuler
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-md bg-red-600 text-white focus:outline-none focus:ring-2 focus:ring-red-400"
            @click="confirmDelete"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from "vue";
import { deleteProvider, listProviders } from "../../../api/providersApi";

const providers = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const providerToDelete = ref(null);
const cancelButton = ref(null);

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    providers.value = await listProviders();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function askDelete(provider) {
  providerToDelete.value = provider;
  await nextTick();
  cancelButton.value?.focus();
}

async function confirmDelete() {
  const provider = providerToDelete.value;
  providerToDelete.value = null;
  try {
    await deleteProvider(provider.id);
    await load();
  } catch (error) {
    errorMessage.value = error.message;
  }
}

onMounted(load);
</script>
