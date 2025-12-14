import { supabase } from "../supabase.js";

export const userRepository = {
  async findAll() {
    const { data, error } = await supabase.from('User').select('*');
    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase.from('User').select('*').eq('user_id', id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByEmail(email) {
      const { data, error } = await supabase.from('User').select('*').eq('email', email).maybeSingle();
      if (error) throw error;
      return data;
  },

  async create(user) {
    const { data, error } = await supabase.from('User').insert([user]).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('User').update(updates).eq('user_id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { data, error } = await supabase.from('User').delete().eq('user_id', id);
    if (error) throw error;
    return data;
  }
};
