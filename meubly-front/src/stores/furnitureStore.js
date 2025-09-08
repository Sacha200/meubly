// src/stores/furnitureStore.js
import { defineStore } from 'pinia';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const useFurnitureStore = defineStore('furniture', {
  state: () => ({
    items: [],
    total: 0,
    page: 1,
    limit: 12,
    loading: false,
    error: null,
    // filtres
    q: '',
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    sort: 'created_at:desc',
  }),
  actions: {
    async fetch() {
      this.loading = true;
      this.error = null;
      try {
        const url = new URL(`${API_BASE}/furnitures`);
        if (this.q) url.searchParams.set('q', this.q);
        if (this.categoryId) url.searchParams.set('categoryId', String(this.categoryId));
        if (this.minPrice != null) url.searchParams.set('minPrice', String(this.minPrice));
        if (this.maxPrice != null) url.searchParams.set('maxPrice', String(this.maxPrice));
        url.searchParams.set('sort', this.sort);
        url.searchParams.set('page', String(this.page));
        url.searchParams.set('limit', String(this.limit));

        const res = await fetch(url.toString(), { 
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
        
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
       if (Array.isArray(data)) {
          this.items = data;
          // on ne connaît pas le total côté serveur → on met un fallback
          this.total = data.length ?? 0;
        } else {
          this.items = data.items || [];
          this.total = data.total ?? (data.items ? data.items.length : 0);
          // synchroniser page/limit si renvoyés par l'API
          if (typeof data.page === 'number') this.page = data.page;
          if (typeof data.limit === 'number') this.limit = data.limit;
        }
      } catch (e) {
        this.error = e?.message || 'Error loading furnitures';
      } finally {
        this.loading = false;
      }
    },
  },
});
