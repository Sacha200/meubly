import { supabase } from "../supabase.js";

export const partnerRepository = {
  // async findAll() {
  //   const { data, error } = await supabase
  //     .from("partner")
  //     .select("*")
  //     .order("name", { ascending: true });

  //   if (error) throw error;
  //   return data;
  // },

  // async findById(id) {
  //   const { data, error } = await supabase
  //     .from("partner")
  //     .select("*")
  //     .eq("partner_id", id)
  //     .single();

  //   if (error) throw error;
  //   return data;
  // },

  // async create(partner) {
  //   const { data, error } = await supabase
  //     .from("partner")
  //     .insert(partner)
  //     .select()
  //     .single();

  //   if (error) throw error;
  //   return data;
  // },

  // async update(id, updates) {
  //   const { data, error } = await supabase
  //     .from("partner")
  //     .update(updates)
  //     .eq("partner_id", id)
  //     .select()
  //     .single();

  //   if (error) throw error;
  //   return data;
  // },

  // async delete(id) {
  //   const { error } = await supabase
  //     .from("partner")
  //     .delete()
  //     .eq("partner_id", id);

  //   if (error) throw error;
  // }
};
