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

  async search({ query, categoryId, minPrice, maxPrice, sort, from, to }) {
    // Mise à jour des colonnes sélectionnées selon le nouveau schéma
    let selectClause = "furniture_id, title, description, cover_url, cached_min_price, cached_nb_offers, size_width, size_height, size_depth, created_at";
    
    // Si filtrage par catégorie, on ajoute la jointure inner
    if (categoryId) {
      selectClause += ", FurnitureCategory!inner(category_id)";
    }

    let queryFurniture = supabase
      .from("Furniture")
      .select(selectClause, { count: "exact" });

    // Recherche sur 'title' au lieu de 'name'
    if (query) queryFurniture = queryFurniture.ilike("title", `%${query}%`);
    
    // Filtre via la table de liaison
    if (categoryId) queryFurniture = queryFurniture.eq("FurnitureCategory.category_id", categoryId);
    
    // Filtre sur 'cached_min_price' au lieu de 'price'
    if (minPrice) queryFurniture = queryFurniture.gte("cached_min_price", minPrice);
    if (maxPrice) queryFurniture = queryFurniture.lte("cached_min_price", maxPrice);

    if (sort) {
      const [col, dir] = sort.split(":");
      // Mapping des tris si nécessaire
      let sortCol = col;
      if (col === 'price') sortCol = 'cached_min_price';
      if (col === 'name') sortCol = 'title';
      
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
      .from("Furniture")
      .update(updates)
      .eq("furniture_id", id)
      .select();

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
