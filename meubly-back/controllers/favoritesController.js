import { favoritesService } from "../services/favoritesService.js";

export const favoritesController = {
  async getAll(req, res, next) {
    try {
      const userId = req.user.id;
      const token = req.headers.authorization;
      const favorites = await favoritesService.getUserFavorites(userId, token);
      res.status(200).json(favorites);
    } catch (error) {
      next(error);
    }
  },

  async add(req, res, next) {
    try {
      const userId = req.user.id;
      const { furnitureId } = req.params;
      const token = req.headers.authorization;

      await favoritesService.addFavorite(userId, furnitureId, token);

      res.status(201).json({ message: "Added to favorites" });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const userId = req.user.id;
      const { furnitureId } = req.params;
      const token = req.headers.authorization;

      await favoritesService.removeFavorite(userId, furnitureId, token);

      res.status(200).json({ message: "Removed from favorites" });
    } catch (error) {
      next(error);
    }
  },
};
