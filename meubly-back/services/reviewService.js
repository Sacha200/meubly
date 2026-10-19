import { reviewRepository } from "../repositories/reviewRepository.js";
import { furnitureRepository } from "../repositories/furnitureRepository.js";
import { httpError } from "../utils/httpError.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;
const UNIQUE_VIOLATION = "23505";

function sanitizePagination(page, limit) {
  const pageNumber = Math.max(1, parseInt(page, 10) || DEFAULT_PAGE);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));
  const from = (pageNumber - 1) * safeLimit;
  const to = from + safeLimit - 1;

  return {
    page: pageNumber,
    limit: safeLimit,
    from,
    to,
  };
}

const EMPTY_BREAKDOWN = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

function buildEmptySummary() {
  return {
    average: null,
    total: 0,
    breakdown: { ...EMPTY_BREAKDOWN },
  };
}

async function computeSummary(furnitureId) {
  const data = await reviewRepository.getAllRatings(furnitureId);

  if (!data || data.length === 0) {
    return buildEmptySummary();
  }

  const breakdown = { ...EMPTY_BREAKDOWN };
  let sum = 0;

  for (const row of data) {
    const rating = Number(row.rating) || 0;
    if (rating >= 1 && rating <= 5) {
      breakdown[rating] += 1;
      sum += rating;
    }
  }

  const total = Object.values(breakdown).reduce((acc, value) => acc + value, 0);

  return {
    average: total > 0 ? sum / total : null,
    total,
    breakdown,
  };
}

/** Avis public : jamais d'identifiant utilisateur, seulement le nom affiche. */
function toPublicReview(row) {
  return {
    review_id: row.review_id,
    rating: Number(row.rating) || 0,
    comment: row.comment ?? null,
    author_name: row.profile?.username || "Utilisateur",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function assertFurnitureExists(furnitureId) {
  if (!(await furnitureRepository.findSummary(furnitureId))) {
    throw httpError(404, "Meuble introuvable");
  }
}

export const reviewService = {
  async listByFurniture(furnitureId, { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) {
    await assertFurnitureExists(furnitureId);
    const { page: safePage, limit: safeLimit, from, to } = sanitizePagination(page, limit);
    const { data, count } = await reviewRepository.findByFurniture(furnitureId, from, to);
    return {
      items: (data ?? []).map(toPublicReview),
      total: count ?? 0,
      page: safePage,
      limit: safeLimit,
      summary: await computeSummary(furnitureId),
    };
  },

  async getOwnReview(furnitureId, userId) {
    return reviewRepository.findByFurnitureAndUser(furnitureId, userId);
  },

  /** Un avis par utilisateur et par meuble : re-soumettre met a jour l'existant. */
  async upsertReview({ furnitureId, userId, rating, comment }) {
    await assertFurnitureExists(furnitureId);
    const fields = { rating, comment: comment || null, updated_at: new Date().toISOString() };
    const existing = await reviewRepository.findByFurnitureAndUser(furnitureId, userId);
    if (existing) {
      const review = await reviewRepository.update(existing.review_id, fields);
      return { action: "updated", review };
    }
    try {
      const review = await reviewRepository.create({
        ...fields,
        furniture_id: furnitureId,
        user_id: userId,
      });
      return { action: "created", review };
    } catch (error) {
      // Deux soumissions simultanees : la contrainte unique (user_id, furniture_id) refuse la
      // seconde insertion (23505), qui devient une mise a jour de l'avis cree entre-temps.
      if (error?.code !== UNIQUE_VIOLATION) throw error;
      const concurrent = await reviewRepository.findByFurnitureAndUser(furnitureId, userId);
      if (!concurrent) throw error;
      const review = await reviewRepository.update(concurrent.review_id, fields);
      return { action: "updated", review };
    }
  },

  async deleteOwnReview(furnitureId, userId) {
    const existing = await reviewRepository.findByFurnitureAndUser(furnitureId, userId);
    if (!existing) throw httpError(404, "Aucun avis a supprimer");
    await reviewRepository.deleteById(existing.review_id);
  },

  async deleteReview(reviewId) {
    if ((await reviewRepository.deleteById(reviewId)) === 0) {
      throw httpError(404, "Avis introuvable");
    }
  },
};
