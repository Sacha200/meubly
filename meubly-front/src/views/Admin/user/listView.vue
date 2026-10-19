<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p class="mt-1 text-sm text-gray-500">
          Consulter, bloquer ou supprimer un compte. Les mots de passe et les rôles ne se gèrent pas
          ici.
        </p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <form class="bg-white rounded-lg shadow p-6 mb-6" role="search" @submit.prevent="search">
        <label for="user-search" class="block text-sm font-medium text-gray-700 mb-2">
          Rechercher par email ou nom d'utilisateur
        </label>
        <div class="flex gap-2">
          <input
            id="user-search"
            v-model.trim="query"
            type="search"
            maxlength="100"
            aria-describedby="user-search-help"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            class="px-4 py-2 rounded-md text-white bg-primary-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Rechercher
          </button>
        </div>
        <p id="user-search-help" class="mt-1 text-xs text-gray-500">
          Lettres, chiffres, espaces et @ . _ + - uniquement.
        </p>
      </form>

      <p v-if="errorMessage" role="alert" class="mb-4 text-sm text-red-700">{{ errorMessage }}</p>

      <div class="bg-white shadow sm:rounded-md overflow-x-auto">
        <p v-if="loading" class="py-12 text-center text-gray-500" aria-live="polite">
          Chargement...
        </p>
        <p v-else-if="users.length === 0" class="py-12 text-center text-gray-500">
          Aucun compte trouvé.
        </p>
        <table v-else class="min-w-full divide-y divide-gray-200">
          <caption class="sr-only">
            Comptes utilisateurs, page
            {{
              page
            }}
            sur
            {{
              totalPages
            }}
          </caption>
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-600">
                Email
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-600">Nom</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-600">
                Rôle
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-600">
                Inscription
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
            <tr v-for="user in users" :key="user.id">
              <td class="px-4 py-3 text-sm text-gray-900">{{ user.email }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ [user.username, user.lastname].filter(Boolean).join(" ") || "-" }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ user.role === "ADMIN" ? "Administrateur" : "Utilisateur" }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ formatDate(user.createdAt) }}</td>
              <td class="px-4 py-3 text-sm">
                <span :class="user.blocked ? 'text-red-700' : 'text-green-700'">
                  {{ user.blocked ? "Bloqué" : "Actif" }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-right whitespace-nowrap">
                <template v-if="user.id !== currentUserId">
                  <button
                    type="button"
                    class="mr-3 underline text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                    :disabled="busyId === user.id"
                    @click="toggleBlock(user)"
                  >
                    {{ user.blocked ? "Débloquer" : "Bloquer" }}
                    <span class="sr-only">{{ user.email }}</span>
                  </button>
                  <button
                    type="button"
                    class="underline text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                    :disabled="busyId === user.id"
                    @click="askDelete(user)"
                  >
                    Supprimer <span class="sr-only">{{ user.email }}</span>
                  </button>
                </template>
                <span v-else class="text-gray-500">Votre compte</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav
        v-if="totalPages > 1"
        class="mt-4 flex items-center justify-between"
        aria-label="Pagination"
      >
        <button
          type="button"
          class="px-3 py-1 border rounded disabled:opacity-50"
          :disabled="page <= 1"
          @click="goTo(page - 1)"
        >
          Précédent
        </button>
        <span class="text-sm text-gray-700">Page {{ page }} sur {{ totalPages }}</span>
        <button
          type="button"
          class="px-3 py-1 border rounded disabled:opacity-50"
          :disabled="page >= totalPages"
          @click="goTo(page + 1)"
        >
          Suivant
        </button>
      </nav>
    </div>

    <div
      v-if="userToDelete"
      class="fixed inset-0 bg-gray-600/50 flex items-start justify-center pt-20 z-50"
      @keydown.esc="userToDelete = null"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-desc"
        class="w-96 max-w-[calc(100%-2rem)] p-5 rounded-md bg-white shadow-lg"
      >
        <h2 id="delete-title" class="text-lg font-medium text-gray-900">Supprimer le compte ?</h2>
        <p id="delete-desc" class="mt-2 text-sm text-gray-600">
          Le compte <strong>{{ userToDelete.email }}</strong
          >, ses favoris et ses avis seront supprimés définitivement.
        </p>
        <div class="mt-4 flex justify-end gap-2">
          <button
            ref="cancelButton"
            type="button"
            class="px-4 py-2 rounded-md bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
            @click="userToDelete = null"
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
import { computed, nextTick, onMounted, ref } from "vue";
import { blockUser, deleteUser, listUsers, unblockUser } from "../../../api/usersApi";
import { useAuthStore } from "../../../stores/authStore";

const PAGE_SIZE = 20;

const authStore = useAuthStore();
const currentUserId = computed(() => authStore.user?.id);

const users = ref([]);
const total = ref(0);
const page = ref(1);
const query = ref("");
const loading = ref(true);
const errorMessage = ref("");
const busyId = ref(null);
const userToDelete = ref(null);
const cancelButton = ref(null);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await listUsers({ q: query.value, page: page.value, limit: PAGE_SIZE });
    users.value = result.items;
    total.value = result.total;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

function search() {
  page.value = 1;
  load();
}

function goTo(target) {
  page.value = target;
  load();
}

async function toggleBlock(user) {
  busyId.value = user.id;
  errorMessage.value = "";
  try {
    await (user.blocked ? unblockUser(user.id) : blockUser(user.id));
    user.blocked = !user.blocked;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    busyId.value = null;
  }
}

async function askDelete(user) {
  userToDelete.value = user;
  await nextTick();
  cancelButton.value?.focus();
}

async function confirmDelete() {
  const user = userToDelete.value;
  userToDelete.value = null;
  busyId.value = user.id;
  try {
    await deleteUser(user.id);
    await load();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    busyId.value = null;
  }
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

onMounted(load);
</script>
