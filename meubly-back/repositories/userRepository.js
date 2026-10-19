import { supabase } from "../supabase.js";

export const userRepository = {
  /**
   * @param {string} userId
   * @returns {Promise<"USER" | "ADMIN" | null>}
   */
  async findRoleByUserId(userId) {
    const { data, error } = await supabase
      .from("profile")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data?.role ?? null;
  },

  async findAll() {
    const { data, error } = await supabase.from("profile").select("*");
    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from("profile")
      .select("*")
      .eq("user_id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByEmail(email) {
    const { data, error } = await supabase
      .from("profile")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(user) {
    const { data, error } = await supabase.from("profile").insert([user]).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from("profile")
      .update(updates)
      .eq("user_id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { data, error } = await supabase.from("profile").delete().eq("user_id", id);
    if (error) throw error;
    return data;
  },
};
