import { furnitureService } from "../services/furnitureService.js";

export const furnitureController = {
  async getAll(req, res) {
    try {
      const result = await furnitureService.searchFurnitures(req.query);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message || "Erreur interne" });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const product = await furnitureService.getFurnitureById(id);
      
      if (!product) {
        return res.status(404).json({ error: "Meuble non trouvé" });
      }

      furnitureService.cacheFurniture(product);
      res.status(200).json(product);
    } catch (error) {
       console.error("Erreur:", error);
       res.status(500).json({ error: error.message });
    }
  },

  async getOffers(req, res) {
    try {
      const { id } = req.params;
      const { query } = req.query;
      const debugOffers =
        process.env.DEBUG_OFFERS === "true" || process.env.DEBUG === "true";

      if (debugOffers) {
        console.log("[offers] getOffers request", { furniture_id: id, query });
      }
      const data = await furnitureService.getOffers(id, query);

      if (debugOffers) {
        const count = Array.isArray(data) ? data.length : 0;
        const best = count > 0 ? data[0] : null;
        console.log("[offers] getOffers result", {
          furniture_id: id,
          count,
          best_offer: best
            ? {
                offer_id: best.offer_id,
                price: best.price,
                url_website: best.url_website,
                partner: best.Partner?.name,
              }
            : null,
        });
      }
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const data = await furnitureService.addFurniture(req.body);
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await furnitureService.updateFurniture(id, req.body);
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
       const { id } = req.params;
       await furnitureService.deleteFurniture(id);
       res.status(204).send();
    } catch (error) {
       res.status(400).json({ error: error.message });
    }
  }
};
