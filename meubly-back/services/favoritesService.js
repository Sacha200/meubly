import { favoritesRepository } from "../repositories/favoritesRepository.js";
import { furnitureRepository } from "../repositories/furnitureRepository.js";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "../supabase.js";

const createScopedClient = (token) => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: token } }
    });
};

export const favoritesService = {
  async addFavorite(userId, furnitureId, userToken) {
    const scopedSupabase = createScopedClient(userToken);

    const furniture = await furnitureRepository.findById(furnitureId);
    if (!furniture) {
        throw new Error("Furniture not found");
    }

    const { data: existing } = await scopedSupabase
        .from('favorite')
        .select('user_id')
        .eq('user_id', userId)
        .eq('furniture_id', furnitureId)
        .maybeSingle();

    if (existing) return { message: "Already in favorites" };

    const { data, error } = await scopedSupabase
        .from('favorite')
        .insert([{ user_id: userId, furniture_id: furnitureId }])
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

    const { error } = await scopedSupabase
      .from('favorite')
      .delete()
      .eq('user_id', userId)
      .eq('furniture_id', furnitureId);

    if (error) throw error;
  },

  async getUserFavorites(userId) {
    return favoritesRepository.findByUser(userId);
  }
};
