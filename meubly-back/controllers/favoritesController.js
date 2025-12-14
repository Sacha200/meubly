import { favoritesService } from "../services/favoritesService.js";

export const favoritesController = {
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const token = req.headers.authorization;
      const favorites = await favoritesService.getUserFavorites(userId, token);
      res.status(200).json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async add(req, res) {
    try {
      const userId = req.user.id;
      const { furnitureId } = req.params;
      const token = req.headers.authorization;
      
      await favoritesService.addFavorite(userId, furnitureId, token);
      
      res.status(201).json({ message: "Added to favorites" });
    } catch (error) {
        if (error.message === "Furniture not found") {
            return res.status(404).json({ error: "Furniture not found" });
        }
        if (error.message.includes("User profile not found")) {
            return res.status(400).json({ error: error.message });
        }
      res.status(500).json({ error: error.message });
    }
  },

  async remove(req, res) {
    try {
      const userId = req.user.id;
      const { furnitureId } = req.params;
      const token = req.headers.authorization;

      await favoritesService.removeFavorite(userId, furnitureId, token);
      
      res.status(200).json({ message: "Removed from favorites" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
