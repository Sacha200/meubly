import { supabase } from "../supabase.js";

export const offerRepository = {
  async findByFurnitureId(furnitureId) {
    const { data, error } = await supabase
      .from("offers")
      .select("offer_id, external_title, url_website, price, updated_at, is_active, furniture_id, Partner(name, logo_url)")
      .eq("furniture_id", furnitureId) // Correction: singulier
      .eq("is_active", true) // On ne récupère que les offres actives par défaut
      .order("price", { ascending: true });

    if (error) throw error;
    return data;
  }
};
