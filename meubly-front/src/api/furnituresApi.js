import API_BASE from './apiBase';

// Fonction pour récupérer tous les meubles
export async function getFurnitures({
    q = '',
    categoryId = null,
    minPrice = null,
    maxPrice = null,
    sort = 'created_at:desc',
    page = 1,
    limit = 12,
  } = {}) {
    try {
      const url = new URL(`${API_BASE}/furnitures`);
      console.log('API_BASE:', API_BASE);
      console.log('URL construite:', url.toString());
      if (q) url.searchParams.set('q', q);
      if (categoryId) url.searchParams.set('categoryId', String(categoryId));
      if (minPrice != null) url.searchParams.set('minPrice', String(minPrice));
      if (maxPrice != null) url.searchParams.set('maxPrice', String(maxPrice));
      url.searchParams.set('sort', sort);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));
  
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
  
      // <-- Renvoie { items, total, page, limit }
      return await response.json();
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  }

// Fonction pour récupérer un meuble spécifique
export async function getFurnitureById(id) {
  try {
    const response = await fetch(`${API_BASE}/furnitures/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erreur lors de la récupération du produit');
    return data;
  } catch (error) {
    console.error('Erreur détaillée:', error);
    throw error;
  }
}

// Recherche par texte, renvoie { items, total, page, limit }
export async function searchFurnitures(searchQuery = '', opts = {}) {
    const { page = 1, limit = 12, sort = 'created_at:desc', categoryId = null, minPrice = null, maxPrice = null } = opts;
    return getFurnitures({ q: searchQuery, categoryId, minPrice, maxPrice, page, limit, sort });
  }

// Fonction pour mettre à jour un meuble
export async function updateFurniture(id, productData) {
    try {
      const response = await fetch(`${API_BASE}/furnitures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour du produit');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur détaillée:', error);
      throw error;
    }
  }

// ===========================
// AVIS PRODUITS
// ===========================

export async function listFurnitureReviews(productId, { page = 1, limit = 5 } = {}) {
    const url = new URL(`${API_BASE}/furnitures/${productId}/reviews`);
    if (page) url.searchParams.set('page', String(page));
    if (limit) url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
        const message = data?.error || data?.errors?.[0]?.msg || 'Erreur lors de la récupération des avis';
        throw new Error(message);
    }

    return data;
}

export async function submitFurnitureReview(productId, payload) {
    const response = await fetch(`${API_BASE}/furnitures/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        const message = data?.error || data?.errors?.[0]?.msg || 'Erreur lors de l\'enregistrement de l\'avis';
        throw new Error(message);
    }

    return data;
}

