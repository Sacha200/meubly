// stores/authStore.js
import { defineStore } from 'pinia';
import { supabase } from '../supabase';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        session: null,
        role: null,
    }),
    actions: {
        async init() {
            const { data: { session } } = await supabase.auth.getSession();
            this.session = session;
            this.user = session?.user ?? null;
            this._loadRole();

            supabase.auth.onAuthStateChange((_event, session) => {
                this.session = session;
                this.user = session?.user ?? null;
                this._loadRole();
            });
        },
        setRole(role) {
            this.role = role;
            sessionStorage.setItem('role', role);
        },
        clearRole() {
            this.role = null;
            sessionStorage.removeItem('role');
            localStorage.removeItem('userProfile');
        },
        _loadRole() {
            const fromSession = sessionStorage.getItem('role');
            if (fromSession) { this.role = fromSession; return; }
            try {
                const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                this.role = profile?.role || null;
            } catch {
                this.role = null;
            }
        }
    },
    getters: {
        isAuthenticated: (state) => !!state.user,
        isAdmin: (state) => state.role === 'ADMIN',
        userEmail: (state) => state.user?.email,
        userName: (state) => state.user?.user_metadata?.username,
    }
});

