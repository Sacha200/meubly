import API_BASE from "./apiBase";
import { authFetch } from "./authHeaders";

// Fonction pour récupérer tous les meubles
export async function getFurnitures({
  q = "",
  categoryId = null,
  minPrice = null,
  maxPrice = null,
  sort = "created_at:desc",
  page = 1,
  limit = 12,
} = {}) {
  try {
    const url = new URL(`${API_BASE}/furnitures`);
    console.log("API_BASE:", API_BASE);
    console.log("URL construite:", url.toString());
    if (q) url.searchParams.set("q", q);
    if (categoryId) url.searchParams.set("categoryId", String(categoryId));
    if (minPrice != null) url.searchParams.set("minPrice", String(minPrice));
    if (maxPrice != null) url.searchParams.set("maxPrice", String(maxPrice));
    url.searchParams.set("sort", sort);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

    // <-- Renvoie { items, total, page, limit }
    return await response.json();
  } catch (error) {
    console.error("Erreur API:", error);
    throw error;
  }
}

// Fonction pour récupérer un meuble spécifique
export async function getFurnitureById(id) {
  try {
    const response = await fetch(`${API_BASE}/furnitures/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erreur lors de la récupération du produit");
    return data;
  } catch (error) {
    console.error("Erreur détaillée:", error);
    throw error;
  }
}

// Recherche par texte, renvoie { items, total, page, limit }
export async function searchFurnitures(searchQuery = "", opts = {}) {
  const {
    page = 1,
    limit = 12,
    sort = "created_at:desc",
    categoryId = null,
    minPrice = null,
    maxPrice = null,
  } = opts;
  return getFurnitures({ q: searchQuery, categoryId, minPrice, maxPrice, page, limit, sort });
}

// Fonction pour mettre à jour un meuble
/** Mise a jour d'un meuble (admin) : requiert la session de l'administrateur. */
export function updateFurniture(id, productData) {
  return authFetch(`${API_BASE}/furnitures/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
}

/** Avis publics d'un meuble, pagines, avec resume (moyenne, total, repartition). */
export async function listFurnitureReviews(furnitureId, { page = 1, limit = 5 } = {}) {
  const url = new URL(`${API_BASE}/furnitures/${furnitureId}/reviews`);
  if (page) url.searchParams.set("page", String(page));
  if (limit) url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString());
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data?.error || data?.errors?.[0]?.msg || "Erreur lors de la récupération des avis"
    );
  }
  return data;
}

/** Avis de l'utilisateur connecte sur ce meuble, ou null. */
export async function getMyFurnitureReview(furnitureId) {
  const { review } = await authFetch(`${API_BASE}/furnitures/${furnitureId}/reviews/me`);
  return review;
}

/** Cree ou met a jour son avis (un par meuble). Le nom affiche vient du profil cote back. */
export function submitFurnitureReview(furnitureId, { rating, comment }) {
  return authFetch(`${API_BASE}/furnitures/${furnitureId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating, comment }),
  });
}

export function deleteMyFurnitureReview(furnitureId) {
  return authFetch(`${API_BASE}/furnitures/${furnitureId}/reviews/me`, { method: "DELETE" });
}

/** Suppression d'un avis abusif (admin). */
export function deleteReviewAsAdmin(reviewId) {
  return authFetch(`${API_BASE}/reviews/${reviewId}`, { method: "DELETE" });
}
