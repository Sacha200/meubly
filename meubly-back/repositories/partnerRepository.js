import { supabase } from "../supabase.js";

const COLUMNS = "partner_id, name, website_base_url, logo_url, is_active, created_at";

/** Acces a la table `partner` (enseignes / marchands). */
export const partnerRepository = {
  async findAll() {
    const { data, error } = await supabase
      .from("partner")
      .select(COLUMNS)
      .order("name", { ascending: true });
    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from("partner")
      .select(COLUMNS)
      .eq("partner_id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(row) {
    const { data, error } = await supabase.from("partner").insert(row).select(COLUMNS).single();
    if (error) throw error;
    return data;
  },

  async update(id, row) {
    const { data, error } = await supabase
      .from("partner")
      .update(row)
      .eq("partner_id", id)
      .select(COLUMNS)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from("partner").delete().eq("partner_id", id);
    if (error) throw error;
  },
};
