import { defineStore } from 'pinia';
import { supabase } from '../supabase';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        session: null,
    }),
    actions: {
        async init() {
            // Récupérer la session actuelle
            const { data: { session } } = await supabase.auth.getSession();
            this.session = session;
            this.user = session?.user ?? null;

            // Écouter les changements d'auth
            supabase.auth.onAuthStateChange((_event, session) => {
                this.session = session;
                this.user = session?.user ?? null;
            });
        }
    },
    getters: {
        isAuthenticated: (state) => !!state.user,
        userEmail: (state) => state.user?.email,
        userName: (state) => state.user?.user_metadata?.username
    }
}); 