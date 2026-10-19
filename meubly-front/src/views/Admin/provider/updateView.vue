<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Modifier le partenaire</h1>
      <p v-if="loadError" role="alert" class="text-sm text-red-700">{{ loadError }}</p>
      <p v-else-if="!provider" class="text-gray-500" aria-live="polite">Chargement...</p>
      <ProviderForm v-else :initial="provider" :on-submit="save" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProviderForm from "./ProviderForm.vue";
import { getProvider, updateProvider } from "../../../api/providersApi";

const route = useRoute();
const router = useRouter();
const provider = ref(null);
const loadError = ref("");

onMounted(async () => {
  try {
    provider.value = await getProvider(route.params.id);
  } catch (error) {
    loadError.value = error.message;
  }
});

async function save(dto) {
  await updateProvider(route.params.id, dto);
  router.push("/admin/providers");
}
</script>
