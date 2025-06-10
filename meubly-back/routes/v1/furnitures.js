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
    console.log('Récupération des meubles...');
    const { search, category } = req.query;
    console.log('Paramètres reçus - search:', search, 'category:', category);
    
    let query = supabase
      .from("Furniture")
      .select("*")
      .order("created_at", { ascending: false });

    console.log('Exécution de la requête...');
    const { data, error } = await query;

    if (error) {
      console.error('Erreur Supabase:', error);
      throw error;
    }

    console.log('Meubles récupérés:', data?.length || 0, 'éléments');
    console.log('Premier élément (structure):', data?.[0]);

    // Ajouter un filtre de recherche si le paramètre search est fourni
    if (search && data && data.length > 0) {
      console.log('Ajout du filtre de recherche pour:', search);
      console.log('Champs disponibles:', Object.keys(data[0]));
      
      // Filtrage côté serveur JavaScript pour déboguer
      const filteredData = data.filter(item => 
        item.name?.toLowerCase().includes(search.toLowerCase())
      );
      console.log('Résultats filtrés:', filteredData.length);
      res.status(200).json(filteredData);
    } else {
      res.status(200).json(data);
    }

  } catch (error) {
    console.error("Erreur complète:", error);
    res.status(500).json({ error: error.message });
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

// Create a new furniture
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
