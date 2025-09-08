// src/stores/categoryStore.js
import { defineStore } from 'pinia';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchCategories(search = '') {
      this.loading = true;
      this.error = null;
      try {
        const url = new URL(`${API_BASE}/categories`);
        if (search) url.searchParams.set('search', search);
        // facultatif : limiter le nombre si utilisé en dropdown
        url.searchParams.set('limit', '100');

        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // si tu as besoin d'envoyer les cookies/JWT un jour :
          // credentials: 'include'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.categories = Array.isArray(data) ? data : [];
      } catch (e) {
        this.error = e?.message || 'Error loading categories';
      } finally {
        this.loading = false;
      }
    },
  },
});
