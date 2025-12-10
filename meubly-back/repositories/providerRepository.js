import { supabase } from "../supabase.js";

export const providerRepository = {
    async findAll() {
        const { data, error } = await supabase.from("Provider").select("*");
        if (error) throw error;
        return data;
    },

    async findById(id) {
        const { data, error } = await supabase.from("Provider").select("*").eq("id", id).single();
        if (error) throw error;
        return data;
    },

    async create(provider) {
        const { data, error } = await supabase.from("Provider").insert(provider).select().single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase.from("Provider").update(updates).eq("id", id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { data, error } = await supabase.from("Provider").delete().eq("id", id);
        if (error) throw error;
        return data;
    }
};
