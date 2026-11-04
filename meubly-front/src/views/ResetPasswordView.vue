<template>
  <div>
    <AppHeader />
    <main class="container mx-auto px-4 py-8">
      <div class="mx-auto max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-surface">
        <h1 class="mb-6 text-center text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Nouveau mot de passe
        </h1>

        <p
          v-if="status === 'loading'"
          role="status"
          class="text-center text-gray-700 dark:text-gray-300"
        >
          Vérification du lien...
        </p>

        <div v-else-if="status === 'invalid'" class="text-center">
          <p class="mb-2 font-medium text-gray-800 dark:text-gray-100">Ce lien n'est plus valide</p>
          <p class="mb-6 text-sm text-gray-700 dark:text-gray-300">
            Il a peut-être expiré, déjà servi ou été ouvert dans un autre navigateur que celui de la
            demande.
          </p>
          <router-link
            to="/login"
            class="font-medium text-primary-700 underline hover:text-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-700 dark:text-primary-300"
          >
            Refaire une demande depuis la page de connexion
          </router-link>
        </div>

        <form v-else novalidate class="space-y-5" @submit.prevent="submit">
          <div>
            <label for="new-password" class="mb-2 block text-gray-700 dark:text-gray-300">
              Nouveau mot de passe
            </label>
            <input
              id="new-password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              aria-describedby="password-rules"
              class="w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <ul
              id="password-rules"
              aria-label="Règles du mot de passe"
              class="mt-2 space-y-1 text-sm"
            >
              <li
                v-for="check in checks"
                :key="check.id"
                :data-ok="check.ok"
                :class="
                  check.ok
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400'
                "
              >
                <span aria-hidden="true">{{ check.ok ? "✓" : "○" }}</span>
                {{ check.label }}
                <span class="sr-only">{{ check.ok ? "(respectée)" : "(non respectée)" }}</span>
              </li>
            </ul>
          </div>

          <div>
            <label for="confirm-password" class="mb-2 block text-gray-700 dark:text-gray-300">
              Confirmer le mot de passe
            </label>
            <input
              id="confirm-password"
              v-model="confirm"
              type="password"
              autocomplete="new-password"
              required
              class="w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <p v-if="error" role="alert" class="text-sm text-red-700 dark:text-red-400">
            {{ error }}
          </p>

          <button
            type="submit"
            :disabled="saving"
            class="w-full rounded-full bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            {{ saving ? "Enregistrement..." : "Enregistrer" }}
          </button>
        </form>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
/**
 * Page ouverte par le lien de reinitialisation. supabase-js echange le code PKCE de l'URL
 * contre une session pendant son initialisation (detectSessionInUrl) ; getSession attend
 * cette initialisation. Sans session, le lien est invalide (expire, deja utilise, ou ouvert
 * dans un autre navigateur que celui de la demande).
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/supabase";
import { updatePassword } from "@/api/authApi";
import { isPasswordValid, passwordChecks } from "@/utils/passwordRules";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";

const router = useRouter();

const status = ref("loading");
const password = ref("");
const confirm = ref("");
const error = ref("");
const saving = ref(false);

const checks = computed(() => passwordChecks(password.value));

onMounted(async () => {
  const { data, error: sessionError } = await supabase.auth.getSession();
  status.value = !sessionError && data?.session ? "ready" : "invalid";
});

async function submit() {
  error.value = "";
  if (!isPasswordValid(password.value)) {
    error.value = "Le mot de passe ne respecte pas les règles indiquées.";
    return;
  }
  if (password.value !== confirm.value) {
    error.value = "Les deux mots de passe ne sont pas identiques.";
    return;
  }
  saving.value = true;
  try {
    await updatePassword(password.value);
    await router.push({ path: "/login", query: { reset: "ok" } });
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>
