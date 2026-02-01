import { furnitureService } from "../services/furnitureService.js";

export const furnitureController = {
  async getAll(req, res) {
    try {
      const result = await furnitureService.searchFurnitures(req.query);
      res.status(200).json(result);
    } catch (error) {
      // In a real app, use a middleware for error handling
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

      // Cache (Fire and Forget)
      if (product) {
         furnitureService.cacheFurniture(product); 
      }

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
      const data = await furnitureService.getOffers(id, query);
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

  // async update(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const { name, type, price } = req.body; // Validation should be here or in middleware (express-validator used in reviews)
  //     // For now, pass to service
  //     const data = await furnitureService.updateFurniture(id, { name, type, price });
  //     res.json(data);
  //   } catch (error) {
  //     res.status(400).json({ error: error.message });
  //   }
  // },

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
