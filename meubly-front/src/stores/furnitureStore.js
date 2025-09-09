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
          this.items = this.applyCustomSort(data);
          // on ne connaît pas le total côté serveur → on met un fallback
          this.total = data.length ?? 0;
        } else {
          const items = data.items || [];
          this.items = this.applyCustomSort(items);
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
    
    // Fonction pour appliquer un tri personnalisé qui privilégie canapés et lits
    applyCustomSort(items) {
      if (!Array.isArray(items)) return items;
      
      return items.sort((a, b) => {
        // Fonction pour déterminer la priorité d'un produit
        const getPriority = (item) => {
          const name = (item.name || '').toLowerCase();
          const description = (item.description || '').toLowerCase();
          const text = name + ' ' + description;
          
          // Priorité 1: Canapés (très haute priorité)
          if (text.includes('canapé') || text.includes('canape') || text.includes('sofa')) {
            return 1;
          }
          
          // Priorité 2: Lits (haute priorité)
          if (text.includes('lit') || text.includes('matelas') || text.includes('sommier')) {
            return 2;
          }
          
          // Priorité 3: Tables et chaises (priorité moyenne)
          if (text.includes('table') || text.includes('chaise') || text.includes('tabouret')) {
            return 3;
          }
          
          // Priorité 4: Meubles de rangement et bibliothèques (priorité faible)
          if (text.includes('bibliothèque') || text.includes('bibliotheque') || 
              text.includes('rangement') || text.includes('armoire') || 
              text.includes('étagère') || text.includes('etagere') ||
              text.includes('commode') || text.includes('buffet')) {
            return 4;
          }
          
          // Priorité 5: Autres meubles
          return 5;
        };
        
        const priorityA = getPriority(a);
        const priorityB = getPriority(b);
        
        // Si les priorités sont différentes, trier par priorité
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // Si les priorités sont identiques, trier par date de création (plus récent en premier)
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
    }
  },
});
