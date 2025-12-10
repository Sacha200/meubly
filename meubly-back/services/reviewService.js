import { reviewRepository } from "../repositories/reviewRepository.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

function sanitizePagination(page, limit) {
  const pageNumber = Math.max(1, parseInt(page, 10) || DEFAULT_PAGE);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));
  const from = (pageNumber - 1) * safeLimit;
  const to = from + safeLimit - 1;

  return {
    page: pageNumber,
    limit: safeLimit,
    from,
    to
  };
}

const EMPTY_BREAKDOWN = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

function buildEmptySummary() {
  return {
    average: null,
    total: 0,
    breakdown: { ...EMPTY_BREAKDOWN }
  };
}

async function computeSummary(productId) {
  const data = await reviewRepository.getAllRatings(productId);

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
    breakdown
  };
}

export const reviewService = {
  async listByProduct(productId, { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) {
    const { page: safePage, limit: safeLimit, from, to } = sanitizePagination(page, limit);

    const { data, count } = await reviewRepository.findReviewsByProduct(productId, from, to);

    const summary = await computeSummary(productId);

    const items = (data ?? []).map((item) => ({
      ...item,
      rating: Number(item.rating) || 0,
    }));

    return {
      items,
      total: count ?? 0,
      page: safePage,
      limit: safeLimit,
      summary
    };
  },

  async createOrUpdateReview({ productId, userId, rating, comment, authorName }) {
    const payload = {
      product_id: productId,
      rating,
      comment: comment || null,
      author_name: authorName || null,
      updated_at: new Date().toISOString()
    };

    if (userId) {
      payload.user_id = userId;
    }

    if (userId) {
        // Check existing using repository
        const existing = await reviewRepository.findByProductAndUser(productId, userId);

        if (existing) {
          const updated = await reviewRepository.update(existing.review_id, payload);
          return { action: "updated", review: updated };
        }
    }

    const created = await reviewRepository.create({
        ...payload,
        created_at: new Date().toISOString()
    });

    return { action: "created", review: created };
  }
};
