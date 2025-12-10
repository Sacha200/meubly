import { supabase } from "../supabase.js";

export const furnitureRepository = {
  async findById(id) {
    const { data, error } = await supabase
      .from("Furniture")
      .select("*")
      .eq("furniture_id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(furniture) {
    const { data, error } = await supabase.from("Furniture").insert([
      {
        ...furniture,
        created_at: new Date(),
      },
    ]);

    if (error) throw error;
    return data;
  },

  async search({ q, categoryId, minPrice, maxPrice, sort, from, to }) {
    let query = supabase
      .from("Furniture")
      .select(
        "furniture_id, name, type, description, cover_url, price, category_id, created_at, nb_offers",
        { count: "exact" }
      );

    if (q) query = query.ilike("name", `%${q}%`);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (minPrice) query = query.gte("price", minPrice);
    if (maxPrice) query = query.lte("price", maxPrice);

    if (sort) {
      const [col, dir] = sort.split(":");
      if (col && dir) query = query.order(col, { ascending: dir === "asc" });
    } else {
        query = query.order("created_at", { ascending: false });
    }

    if (from !== undefined && to !== undefined) {
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from("Furniture")
      .update(updates)
      .eq("furniture_id", id) // Note: route used "id", schema has "furniture_id". Assuming furniture_id is correct based on findById.
      .select(); // Route didn't select, but it return data.

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from("Furniture")
      .delete()
      .eq("furniture_id", id);
    
    if (error) throw error;
  },

  async upsert(furniture) {
      const { error } = await supabase
      .from("Furniture")
      .upsert(furniture);
      if (error) throw error;
  }
};
