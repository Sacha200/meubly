import { supabase } from "../supabase.js";

export const partnerRepository = {
  // async findAll() {
  //   const { data, error } = await supabase
  //     .from("Partner")
  //     .select("*")
  //     .order("name", { ascending: true });

  //   if (error) throw error;
  //   return data;
  // },

  // async findById(id) {
  //   const { data, error } = await supabase
  //     .from("Partner")
  //     .select("*")
  //     .eq("partner_id", id)
  //     .single();

  //   if (error) throw error;
  //   return data;
  // },

  // async create(partner) {
  //   const { data, error } = await supabase
  //     .from("Partner")
  //     .insert(partner)
  //     .select()
  //     .single();

  //   if (error) throw error;
  //   return data;
  // },

  // async update(id, updates) {
  //   const { data, error } = await supabase
  //     .from("Partner")
  //     .update(updates)
  //     .eq("partner_id", id)
  //     .select()
  //     .single();

  //   if (error) throw error;
  //   return data;
  // },

  // async delete(id) {
  //   const { error } = await supabase
  //     .from("Partner")
  //     .delete()
  //     .eq("partner_id", id);

  //   if (error) throw error;
  // }
};
