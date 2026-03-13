import { supabase } from "../supabase.js";

export const offerRepository = {
  async findByFurnitureId(furnitureId) {
    const { data, error } = await supabase
      .from("offer")
      .select("offer_id, external_title, url_website, price, updated_at, is_active, furniture_id, partner(name, logo_url)")
      .eq("furniture_id", furnitureId)
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) throw error;
    return data;
  }
};
