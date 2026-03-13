import { supabase } from "../supabase.js";

export const categoryRepository = {
  async findAll(search, limit = 100) {
    let query = supabase
      .from('category')
      .select('category_id, label, cover_url, parent_id')
      .order('label', { ascending: true })
      .limit(Number(limit) || 100);

    if (search) {
      query = query.ilike('label', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('category')
      .select('category_id, label, cover_url, parent_id')
      .eq('category_id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(category) {
    const { data, error } = await supabase
      .from('category')
      .insert(category)
      .select('category_id, label, cover_url, parent_id')
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('category')
      .update(updates)
      .eq('category_id', id)
      .select('category_id, label, cover_url, parent_id')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('category').delete().eq('category_id', id);
    if (error) throw error;
  }
};
