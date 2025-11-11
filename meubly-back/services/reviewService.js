import { supabase } from "../supabase.js";

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

async function computeSummary(productId) {
  const { data, error } = await supabase
    .from("Reviews")
    .select("rating")
    .eq("product_id", productId);

  if (error) {
    throw error;
  }

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (!data || data.length === 0) {
    return {
      average: null,
      total: 0,
      breakdown
    };
  }

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

    const { data, error, count } = await supabase
      .from("Reviews")
      .select(
        "review_id, product_id, user_id, rating, comment, author_name, created_at, updated_at",
        { count: "exact" }
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

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
      const { data: existing, error: existingError } = await supabase
        .from("Reviews")
        .select("review_id")
        .eq("product_id", productId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        throw existingError;
      }

      if (existing) {
        const { data, error } = await supabase
          .from("Reviews")
          .update(payload)
          .eq("review_id", existing.review_id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return { action: "updated", review: data };
      }
    }

    const { data, error } = await supabase
      .from("Reviews")
      .insert([
        {
          ...payload,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { action: "created", review: data };
  }
};
