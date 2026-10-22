import { supabase } from "../supabase.js";

const COLUMNS = "user_id, email, username, lastname, role, created_at";

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

  async findById(id) {
    const { data, error } = await supabase
      .from("profile")
      .select(COLUMNS)
      .eq("user_id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Recherche paginee sur l'email ou le nom d'utilisateur.
   * `q` doit avoir ete valide a la route (aucun caractere de syntaxe PostgREST).
   * @param {{ q?: string, from: number, to: number }} params
   * @returns {Promise<{ rows: object[], count: number }>}
   */
  async search({ q, from, to }) {
    let query = supabase
      .from("profile")
      .select(COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (q) query = query.or(`email.ilike.%${q}%,username.ilike.%${q}%`);
    const { data, error, count } = await query;
    if (error) throw error;
    return { rows: data ?? [], count: count ?? 0 };
  },
};
