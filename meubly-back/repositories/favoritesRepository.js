import { supabase } from "../supabase.js";

export const favoritesRepository = {
  /**
   * Ajoute un favori pour un utilisateur.
   * Ignore si le favori existe déjà.
   */
  async add(userId, furnitureId) {
    // On utilise upsert ou insert avec ignoreDuplicates si la contrainte UNIQUE est en place
    const { data, error } = await supabase
      .from('favorite')
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
      .from('favorite')
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
      .from('favorite')
      .select(`
        added_at,
        furniture:furniture (
          furniture_id,
          title,
          cached_min_price,
          cover_url,
          description
        )
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
        added_at: item.added_at,
        ...item.furniture
    }));
  },

  /**
   * Vérifie si un meuble est favori pour un user.
   */
  async isFavorite(userId, furnitureId) {
      const { data, error } = await supabase
        .from('favorite')
        .select('user_id')
        .eq('user_id', userId)
        .eq('furniture_id', furnitureId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
  }
};
