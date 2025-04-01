import express from "express";
import { supabase } from "../../supabase.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
router.use(express.json());

// Get all furnitures
router.get("/furnitures", async (req, res) => {
  try {
    const furnitures = await supabase.from("Furniture").select("*");
    res.status(200).json(furnitures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a furniture by id
router.get("/furnitures/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("Furniture")
      .select("*")
      .eq("furniture_id", id)

    const firstFurniture = data[0];
    console.log(firstFurniture);
    res.status(200).json(firstFurniture);

  } catch (error) {
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
  const {
    furniture_id,
    name,
    type,
    price,
    description,
    height,
    width,
    depth,
    nb_offers,
  } = req.body;
  const { data, error } = await supabase
    .from("Furniture")
    .insert({
      furniture_id,
      name,
      type,
      price,
      description,
      height,
      width,
      depth,
      nb_offers,
    });
  if (error) throw error;
  res.status(201).json(data);
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
