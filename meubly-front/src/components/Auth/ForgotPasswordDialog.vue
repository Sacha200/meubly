<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div
      ref="dialogEl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-title"
      class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-surface"
      @keydown="onKeydown"
    >
      <h2 id="forgot-title" class="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Réinitialiser votre mot de passe ?
      </h2>

      <template v-if="!sent">
        <p class="mb-4 text-sm text-gray-700 dark:text-gray-300">
          Nous allons vous envoyer un lien par email pour choisir un nouveau mot de passe.
        </p>
        <form novalidate @submit.prevent="submit">
          <label for="forgot-email" class="mb-2 block text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="forgot-email"
            ref="emailInput"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            :aria-invalid="!!error"
            :aria-describedby="error ? 'forgot-error' : undefined"
            class="w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <p
            v-if="error"
            id="forgot-error"
            role="alert"
            class="mt-2 text-sm text-red-700 dark:text-red-400"
          >
            {{ error }}
          </p>
          <div class="mt-6 flex flex-col gap-3">
            <button
              type="submit"
              :disabled="loading"
              class="w-full rounded-full bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 disabled:cursor-not-allowed disabled:bg-gray-500"
            >
              {{ loading ? "Envoi..." : "Envoyer le lien" }}
            </button>
            <button
              type="button"
              class="w-full rounded-full border border-primary-700 px-5 py-2.5 font-medium text-primary-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:border-gray-300 dark:text-gray-100 dark:hover:bg-gray-700"
              @click="emit('close')"
            >
              Annuler
            </button>
          </div>
        </form>
      </template>

      <template v-else>
        <p role="status" class="text-sm text-gray-700 dark:text-gray-300">
          Si un compte existe pour <strong>{{ sentTo }}</strong
          >, un lien de réinitialisation vient d'être envoyé. Ouvrez-le
          <strong>dans ce navigateur</strong>, il est valable une heure. Pensez à regarder dans vos
          courriers indésirables.
        </p>
        <button
          ref="backButton"
          type="button"
          class="mt-6 w-full rounded-full bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
          @click="emit('close')"
        >
          Retour à la connexion
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
/**
 * Fenetre de demande de reinitialisation du mot de passe, ouverte depuis la page de connexion.
 * Le message de confirmation est volontairement neutre : il ne revele pas si l'adresse
 * correspond a un compte.
 */
import { nextTick, onMounted, ref } from "vue";
import { requestPasswordReset } from "@/api/authApi";

const props = defineProps({
  initialEmail: { type: String, default: "" },
});
const emit = defineEmits(["close"]);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const email = ref(props.initialEmail);
const error = ref("");
const loading = ref(false);
const sent = ref(false);
const sentTo = ref("");
const dialogEl = ref(null);
const emailInput = ref(null);
const backButton = ref(null);

onMounted(() => emailInput.value?.focus());

async function submit() {
  error.value = "";
  const value = email.value.trim();
  if (!EMAIL_REGEX.test(value)) {
    error.value = "L'adresse email n'est pas valide.";
    return;
  }
  loading.value = true;
  try {
    await requestPasswordReset(value);
    sentTo.value = value;
    sent.value = true;
    await nextTick();
    backButton.value?.focus();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

/** Echap ferme la fenetre ; Tab reste piege dans la fenetre. */
function onKeydown(event) {
  if (event.key === "Escape") {
    emit("close");
    return;
  }
  if (event.key !== "Tab" || !dialogEl.value) return;
  const focusables = dialogEl.value.querySelectorAll("input, button:not([disabled])");
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>
