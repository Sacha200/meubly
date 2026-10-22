import { supabase } from "../supabase.js";

const LIST_COLUMNS = "review_id, rating, comment, created_at, updated_at, profile(username)";
const OWN_COLUMNS = "review_id, furniture_id, rating, comment, created_at, updated_at";

export const reviewRepository = {
  async findByFurniture(furnitureId, from, to) {
    const { data, error, count } = await supabase
      .from("review")
      .select(LIST_COLUMNS, { count: "exact" })
      .eq("furniture_id", furnitureId)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    return { data, count };
  },

  async getAllRatings(furnitureId) {
    const { data, error } = await supabase
      .from("review")
      .select("rating")
      .eq("furniture_id", furnitureId);
    if (error) throw error;
    return data;
  },

  async findByFurnitureAndUser(furnitureId, userId) {
    const { data, error } = await supabase
      .from("review")
      .select(OWN_COLUMNS)
      .eq("furniture_id", furnitureId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from("review")
      .insert(payload)
      .select(OWN_COLUMNS)
      .single();
    if (error) throw error;
    return data;
  },

  async update(reviewId, payload) {
    const { data, error } = await supabase
      .from("review")
      .update(payload)
      .eq("review_id", reviewId)
      .select(OWN_COLUMNS)
      .single();
    if (error) throw error;
    return data;
  },

  /** @returns {Promise<number>} nombre de lignes supprimees */
  async deleteById(reviewId) {
    const { error, count } = await supabase
      .from("review")
      .delete({ count: "exact" })
      .eq("review_id", reviewId);
    if (error) throw error;
    return count ?? 0;
  },
};
