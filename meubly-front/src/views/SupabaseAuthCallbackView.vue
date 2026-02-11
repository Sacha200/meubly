<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">Connexion…</h2>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Finalisation de l’authentification Supabase en cours. Tu vas être redirigé automatiquement.
      </p>
      <p v-if="error" class="mt-4 text-sm text-red-600 dark:text-red-400 break-words">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase'

export default {
  name: 'SupabaseAuthCallbackView',
  data() {
    return { error: null }
  },
  async mounted() {
    try {
      // Supabase JS gère la session via l'URL (detectSessionInUrl: true).
      // On force une lecture de session pour s'assurer que tout est pris en compte.
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      // Si pas de session (ex: simple confirmation email), on redirige vers login.
      const hasSession = !!data?.session
      this.$router.replace(hasSession ? '/' : '/login')
    } catch (e) {
      this.error = e?.message || String(e)
      setTimeout(() => this.$router.replace('/login'), 2500)
    }
  }
}
</script>

