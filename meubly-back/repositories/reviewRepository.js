import { supabase } from "../supabase.js";

function isRelationMissing(error) {
  if (!error) return false;
  return error.code === "42P01" || String(error.message ?? "").toLowerCase().includes("relation") || String(error.details ?? "").toLowerCase().includes("does not exist");
}

export const reviewRepository = {
  async findReviewsByProduct(productId, from, to) {
    try {
      const { data, error, count } = await supabase
        .from("Reviews")
        .select(
          "review_id, product_id, user_id, rating, comment, author_name, created_at, updated_at",
          { count: "exact" }
        )
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data, count };
    } catch (error) {
       if (isRelationMissing(error)) {
        console.warn("[ReviewRepository] Table Reviews missing - returning empty.");
        return { data: [], count: 0 };
      }
      throw error;
    }
  },

  async getAllRatings(productId) {
    try {
      const { data, error } = await supabase
        .from("Reviews")
        .select("rating")
        .eq("product_id", productId);

      if (error) throw error;
      return data;
    } catch (error) {
      if (isRelationMissing(error)) {
         return [];
      }
      throw error;
    }
  },

  async findByProductAndUser(productId, userId) {
    const { data, error } = await supabase
      .from("Reviews")
      .select("review_id")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async update(reviewId, payload) {
    const { data, error } = await supabase
      .from("Reviews")
      .update(payload)
      .eq("review_id", reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from("Reviews")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
