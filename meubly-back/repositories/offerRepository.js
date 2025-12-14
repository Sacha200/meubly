import { supabase } from "../supabase.js";

export const offerRepository = {
  async findByFurnitureId(furnitureId) {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("furnitures_id", furnitureId)
      .order("price", { ascending: true }); // Tri automatique par prix croissant

    if (error) throw error;
    return data;
  }
};
