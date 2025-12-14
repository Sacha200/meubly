import { favoritesRepository } from "../repositories/favoritesRepository.js";
import { furnitureRepository } from "../repositories/furnitureRepository.js";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey, supabase } from "../supabase.js";

// Helper to create a client acting as the user
const createScopedClient = (token) => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: token } }
    });
};


export const favoritesService = {
  async addFavorite(userId, furnitureId, userToken) {
    const scopedSupabase = createScopedClient(userToken);

    // 1. Récupérer l'ID du profil public (table "User") correspondant à l'ID Auth
    // Use GLOBAL SUPABASE (Admin) because RLS on User table might be restrictive
    // Since we are backend, we trust the userId claims.
    const { data: userProfile, error: userError } = await supabase
        .from('User')
        .select('user_id') // Corrected from 'id' to 'user_id'
        .eq('user_id', userId)
        .maybeSingle();

    if (userError || !userProfile) {
        // Fallback: Si le profil n'existe pas, on tente de le créer (Self-Healing)
        // Ou on renvoie une erreur explicite.
        console.error(`PROFILE NOT FOUND for ${userId}. Error:`, userError);
        throw new Error("User profile not found. Please complete registration.");
    }

    // 2. Vérifier si le meuble existe (Admin Read ou Public Read ok)
    // furnitureRepository uses Admin client, so it's fine.
    const furniture = await furnitureRepository.findById(furnitureId);
    if (!furniture) {
        throw new Error("Furniture not found");
    }

    // 3. Ajouter le favori
    // ATTENTION: favoritesRepository utilise 'supabase' global (Admin/Anon).
    // Si on veut utiliser RLS, on devrait passer le client scopé au repo ou appeler insert ici.
    // Pour l'instant, passons ID et laissons Repo faire (en supposant que Repo a les droits Admin,
    // ce qui DEVRAIT être le cas si SERVICE_ROLE_KEY est là).
    // MAIS mon problème précédent était justement que Repo n'avait PAS les droits.
    // Donc, faisons l'insert ICI avec le SCOPED client.
    
    // Check if exists first (Uniqueness)
    const { data: existing } = await scopedSupabase
        .from('favorites')
        .select('user_id') // Corrected from id? Favorites table might use id or composite. Let's use user_id to check.
        .eq('user_id', userProfile.user_id)
        .eq('furniture_id', furnitureId)
        .maybeSingle();
        
    if(existing) return { message: "Already in favorites" };
    
    // Use userProfile.user_id !!!
    const { data, error } = await scopedSupabase
        .from('favorites')
        .insert([{ user_id: userProfile.user_id, furniture_id: furnitureId }])
        .select()
        .single();
        
    if (error) {
         if (error.code === '23505') return { message: "Already in favorites" };
         throw error;
    }
    return data;
  },

  async removeFavorite(userId, furnitureId, userToken) {
    const scopedSupabase = createScopedClient(userToken);

    const { data: userProfile } = await supabase
        .from('User')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
        
    if (!userProfile) return;
    
    const { error } = await scopedSupabase
      .from('favorites')
      .delete()
      .eq('user_id', userProfile.user_id)
      .eq('furniture_id', furnitureId);
    
    if (error) throw error;
  },

  async getUserFavorites(userId, userToken) {
     const scopedSupabase = createScopedClient(userToken);

     const { data: userProfile } = await scopedSupabase
        .from('User')
        .select('id')
        .eq('user_id', userId)
        .single();
        
    if (!userProfile) return [];

    // Ici on fait une jointure. Scoped client permet de voir SES favoris.
    const { data, error } = await scopedSupabase
      .from('favorites')
      .select(`
        created_at,
        furniture:Furniture (
          furniture_id,
          name,
          price,
          cover_url,
          description
        )
      `)
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
        added_at: item.created_at,
        ...item.furniture
    }));
  }
};
