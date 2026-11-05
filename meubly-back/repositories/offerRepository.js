import { supabase } from "../supabase.js";

const COLUMNS = [
  "offer_id, external_title, url_website, price, shipping_cost, total_price, eco_fee",
  "availability, delivery_min_days, delivery_max_days, delivery_mode, assembly_included",
  "return_days, condition, seller_name, last_seen_at, updated_at, furniture_id",
  "partner(name, logo_url, is_affiliate)",
].join(", ");

export const offerRepository = {
  /**
   * Offres actives d'un meuble, de la moins chere a la plus chere livraison comprise ;
   * une offre au total inconnu (livraison non renseignee) passe apres, triee par prix article.
   * @param {string} furnitureId
   */
  async findByFurnitureId(furnitureId) {
    const { data, error } = await supabase
      .from("offer")
      .select(COLUMNS)
      .eq("furniture_id", furnitureId)
      .eq("status", "active")
      .order("total_price", { ascending: true, nullsFirst: false })
      .order("price", { ascending: true });

    if (error) throw error;
    return data;
  },
};
