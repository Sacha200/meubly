import { supabase } from "../supabase.js";

export const favoritesRepository = {
  /**
   * Ajoute un favori pour un utilisateur.
   * Ignore si le favori existe déjà.
   */
  async add(userId, furnitureId) {
    // On utilise upsert ou insert avec ignoreDuplicates si la contrainte UNIQUE est en place
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, furniture_id: furnitureId }])
      .select()
      .maybeSingle();

    // Si erreur de contrainte unique (déjà favori), on l'ignore ou on renvoie l'existant
    if (error && error.code === '23505') { // Code PostgreSQL pour Unique Violation
        return { message: "Already in favorites" };
    }
    if (error) {
        console.error("FavoritesRepository ADD Error:", JSON.stringify(error, null, 2));
        throw error;
    }
    return data;
  },

  /**
   * Retire un favori.
   */
  async remove(userId, furnitureId) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('furniture_id', furnitureId);
    
    if (error) throw error;
  },

  /**
   * Récupère tous les favoris d'un utilisateur avec les détails du meuble.
   */
  async findByUser(userId) {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        created_at,
        furniture:Furniture (
          furniture_id,
          title,
          cached_min_price,
          cover_url,
          description
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Aplatir un peu le résultat si besoin, ou le laisser tel quel
    // Supabase renvoie { furniture: { ... } }
    return data.map(item => ({
        added_at: item.created_at,
        ...item.furniture
    }));
  },

  /**
   * Vérifie si un meuble est favori pour un user.
   */
  async isFavorite(userId, furnitureId) {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('furniture_id', furnitureId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
  }
};
