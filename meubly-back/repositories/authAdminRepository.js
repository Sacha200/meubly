import { supabase } from "../supabase.js";

/** Seul point d'acces a l'API d'administration de Supabase Auth (service role). */
export const authAdminRepository = {
  /**
   * @param {string} id
   * @returns {Promise<{ id: string, email: string, banned_until?: string | null, created_at: string, last_sign_in_at?: string | null } | null>}
   */
  async getUser(id) {
    const { data, error } = await supabase.auth.admin.getUserById(id);
    if (error) {
      if (error.status === 404) return null;
      throw error;
    }
    return data.user;
  },

  /**
   * @param {string} id
   * @param {"876000h" | "none"} duration "876000h" (100 ans) bloque, "none" debloque
   */
  async setBan(id, duration) {
    const { error } = await supabase.auth.admin.updateUserById(id, { ban_duration: duration });
    if (error) throw error;
  },

  /** Supprime le compte ; profil, favoris et avis suivent par cascade. */
  async deleteUser(id) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;
  },
};
