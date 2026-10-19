<template>
  <form class="bg-white rounded-lg shadow p-6 space-y-5" novalidate @submit.prevent="submit">
    <div>
      <label for="provider-name" class="block text-sm font-medium text-gray-700">Nom *</label>
      <input
        id="provider-name"
        v-model.trim="form.name"
        type="text"
        required
        maxlength="100"
        :aria-invalid="Boolean(errors.name)"
        :aria-describedby="errors.name ? 'provider-name-error' : undefined"
        class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <p v-if="errors.name" id="provider-name-error" class="mt-1 text-sm text-red-700">
        {{ errors.name }}
      </p>
    </div>

    <div>
      <label for="provider-url" class="block text-sm font-medium text-gray-700">Site web</label>
      <input
        id="provider-url"
        v-model.trim="form.url"
        type="url"
        placeholder="https://"
        :aria-invalid="Boolean(errors.url)"
        :aria-describedby="errors.url ? 'provider-url-error' : undefined"
        class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <p v-if="errors.url" id="provider-url-error" class="mt-1 text-sm text-red-700">
        {{ errors.url }}
      </p>
    </div>

    <div>
      <label for="provider-logo" class="block text-sm font-medium text-gray-700">URL du logo</label>
      <input
        id="provider-logo"
        v-model.trim="form.logoUrl"
        type="url"
        placeholder="https://"
        :aria-invalid="Boolean(errors.logoUrl)"
        :aria-describedby="errors.logoUrl ? 'provider-logo-error' : undefined"
        class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <p v-if="errors.logoUrl" id="provider-logo-error" class="mt-1 text-sm text-red-700">
        {{ errors.logoUrl }}
      </p>
    </div>

    <div class="flex items-center gap-2">
      <input
        id="provider-active"
        v-model="form.isActive"
        type="checkbox"
        class="h-4 w-4 focus:ring-2 focus:ring-primary-500"
      />
      <label for="provider-active" class="text-sm text-gray-700">Partenaire actif</label>
    </div>

    <p v-if="submitError" role="alert" class="text-sm text-red-700">{{ submitError }}</p>

    <div class="flex justify-end gap-2">
      <router-link
        to="/admin/providers"
        class="px-4 py-2 rounded-md bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        Annuler
      </router-link>
      <button
        type="submit"
        :disabled="saving"
        class="px-4 py-2 rounded-md text-white bg-primary-500 hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        {{ saving ? "Enregistrement..." : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, watch } from "vue";

const props = defineProps({
  /** Valeurs initiales au format du contrat `/providers`. */
  initial: { type: Object, default: () => ({}) },
  submitLabel: { type: String, default: "Enregistrer" },
  /** Recoit `{ name, url, logoUrl, isActive }` ; une erreur levee est affichee. */
  onSubmit: { type: Function, required: true },
});

const form = reactive({ name: "", url: "", logoUrl: "", isActive: true });
const errors = reactive({ name: "", url: "", logoUrl: "" });
const saving = ref(false);
const submitError = ref("");

watch(
  () => props.initial,
  (value) => {
    form.name = value.name ?? "";
    form.url = value.url ?? "";
    form.logoUrl = value.logoUrl ?? "";
    form.isActive = value.isActive ?? true;
  },
  { immediate: true }
);

function isHttpUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function validate() {
  errors.name = form.name ? "" : "Le nom est obligatoire.";
  errors.url = !form.url || isHttpUrl(form.url) ? "" : "Adresse http(s) attendue.";
  errors.logoUrl = !form.logoUrl || isHttpUrl(form.logoUrl) ? "" : "Adresse http(s) attendue.";
  return !errors.name && !errors.url && !errors.logoUrl;
}

async function submit() {
  submitError.value = "";
  if (!validate()) return;
  saving.value = true;
  try {
    await props.onSubmit({
      name: form.name,
      url: form.url || null,
      logoUrl: form.logoUrl || null,
      isActive: form.isActive,
    });
  } catch (error) {
    submitError.value = error.message;
  } finally {
    saving.value = false;
  }
}
</script>
