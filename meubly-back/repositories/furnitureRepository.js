import { supabase } from "../supabase.js";

export const furnitureRepository = {
  async findById(id) {
    const { data, error } = await supabase
      .from("furniture")
      .select("*, furniture_image(image_id, url, alt_text, type, position, source, is_cover)")
      .eq("furniture_id", id)
      .order("position", { referencedTable: "furniture_image", ascending: true })
      .single();

    if (error) throw error;
    return data;
  },

  async create(furniture) {
    const { data, error } = await supabase.from("furniture").insert([
      {
        ...furniture,
        created_at: new Date(),
      },
    ]);

    if (error) throw error;
    return data;
  },

  async search({ q, categoryId, minPrice, maxPrice, sort, from, to }) {
    let selectClause = "furniture_id, title, description, cover_url, cached_min_price, cached_nb_offers, size_width, size_height, size_depth, created_at, ai_description, ai_tags, ai_style, ai_material, ai_category_suggestion, ai_scene_prompt, ai_enriched_at";
    if (categoryId) selectClause += ", furniture_category!inner(category_id)";

    let queryFurniture = supabase
      .from("furniture")
      .select(selectClause, { count: "exact" });

    if (q) queryFurniture = queryFurniture.ilike("title", `%${q}%`);
    if (categoryId) queryFurniture = queryFurniture.eq("furniture_category.category_id", categoryId);
    if (minPrice) queryFurniture = queryFurniture.gte("cached_min_price", minPrice);
    if (maxPrice) queryFurniture = queryFurniture.lte("cached_min_price", maxPrice);

    if (sort) {
      const [col, dir] = sort.split(":");
      let sortCol = col === 'price' ? 'cached_min_price' : col === 'name' ? 'title' : col;
      if (sortCol && dir) queryFurniture = queryFurniture.order(sortCol, { ascending: dir === "asc" });
    } else {
      queryFurniture = queryFurniture.order("created_at", { ascending: false });
    }

    if (from !== undefined && to !== undefined) {
      queryFurniture = queryFurniture.range(from, to);
    }

    const { data, error, count } = await queryFurniture;
    if (error) throw error;
    return { data, count };
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from("furniture")
      .update(updates)
      .eq("furniture_id", id)
      .select();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from("furniture")
      .delete()
      .eq("furniture_id", id);
    
    if (error) throw error;
  },

  async upsert(furniture) {
      const { error } = await supabase
      .from("furniture")
      .upsert(furniture);
      if (error) throw error;
  }
};
