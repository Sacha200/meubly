import express from "express";
import { furnitureService } from "../../services/furnitureService.js";
import { supabase } from "../../supabase.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
router.use(express.json());

// Get all furnitures
router.get("/furnitures", async (req, res) => {
  try {
    const {
      q = "",
      categoryId,
      minPrice,
      maxPrice,
      sort = "created_at:desc",
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(60, Math.max(1, parseInt(limit, 10) || 12));
    const from = (pageNum - 1) * lim;
    const to = from + lim - 1;

    let query = supabase
      .from("Furniture")
      .select(
        "furniture_id, name, type, description, cover_url, price, category_id, created_at, nb_offers",
        { count: "exact" }
      );

    if (q) query = query.ilike("name", `%${q}%`);
    if (categoryId) query = query.eq("category_id", Number(categoryId));
    if (minPrice) query = query.gte("price", Number(minPrice));
    if (maxPrice) query = query.lte("price", Number(maxPrice));

    const [col, dir] = String(sort).split(":"); // ex: "price:asc"
    if (col && dir) query = query.order(col, { ascending: dir === "asc" });

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // S'assurer que nb_offers a une valeur par défaut
    const itemsWithOffers = (data || []).map(item => ({
      ...item,
      nb_offers: item.nb_offers || 1 // Valeur par défaut si null/undefined
    }));

    return res.status(200).json({
      items: itemsWithOffers,
      total: count || 0,
      page: pageNum,
      limit: lim
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get a furniture by id
router.get("/furnitures/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await furnitureService.getFurnitureById(id);
    
    // Mise en cache dans Supabase
    await supabase
      .from("Furniture")
      .upsert(product);

    res.status(200).json(product);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: error.message });
  }
});



// Get a furniture by id with its offers, with optional query parameter
router.get("/:id/offers", async (req, res) => {
  try {
    const { id } = req.params;
    const { query } = req.query; // This is the query parameter

    let offersQuery = supabase
      .from("Offers")
      .select("id, name_furniture, website, url_website, prices")
      .eq("offer_id", id);

    if (query) {
      offersQuery = offersQuery.ilike("website", `%${query}%`);
    }

    const { data, error } = await offersQuery;
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Création d'un nouveau meuble
router.post("/furnitures", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("Furniture")
      .insert([req.body]);

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a furniture by id
router.patch("/furnitures/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, price } = req.body;
    const { data, error } = await supabase
      .from("Furniture")
      .update({ name, type, price })
      .eq("id", id);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a furniture by id
router.delete("/furnitures/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("Furniture")
      .delete()
      .eq("id", id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

