<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Nouveau partenaire</h1>
      <ProviderForm submit-label="Créer le partenaire" :on-submit="create" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import ProviderForm from "./ProviderForm.vue";
import { createProvider } from "../../../api/providersApi";

const router = useRouter();

async function create(dto) {
  await createProvider(dto);
  router.push("/admin/providers");
}
</script>
