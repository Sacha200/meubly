import { supabase } from "../supabase.js";

export const furnitureService = {
    
  // Récupérer un meuble par son id
    async getFurnitureById(id) {
    try {
      const { data, error } = await supabase
        .from("Furniture")
        .select("*")
        .eq("furniture_id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération du meuble:", error);
      throw error;
    }
  },


  async addFurniture(furniture) {
    try {
      const { data, error } = await supabase.from("Furniture").insert([
        {
          ...furniture,
          created_at: new Date(),
        },
      ]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erreur lors de l'ajout du meuble:", error);
      throw error;
    }
  },
};
