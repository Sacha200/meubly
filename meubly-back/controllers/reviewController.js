import { reviewService } from "../services/reviewService.js";
import { validationResult } from "express-validator";

export const reviewController = {
  async list(req, res) {
     // Validation result handling could be here or middleware. 
     // The route definition uses 'handleValidation', so we assume req is valid here or we check it.
     // But 'handleValidation' middleware provided in the snippet handles it.
     
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      const productId = isNaN(Number(id)) ? id : Number(id);
      const result = await reviewService.listByProduct(productId, { page, limit });
      res.status(200).json(result);
    } catch (error) {
      console.error("Erreur lors de la récupération des avis:", error);
      res.status(500).json({ error: "Impossible de récupérer les avis pour ce produit." });
    }
  },

  async createOrUpdate(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment = "", authorName } = req.body;
      const productId = isNaN(Number(id)) ? id : Number(id);

      // User attached by requireAuth middleware
      const userId = req.user ? req.user.id : null;

      if (!userId) {
         // Should not happen if route is protected, but safe guard
        return res.status(401).json({ error: "Une authentification est requise pour publier un avis." });
      }

      const sanitizedComment = comment.trim();

      const result = await reviewService.createOrUpdateReview({
        productId,
        userId,
        rating: Number(rating),
        comment: sanitizedComment,
        authorName,
      });

      res.status(result.action === "created" ? 201 : 200).json(result);
    } catch (error) {
      console.error("Erreur lors de la création ou mise à jour d'un avis:", error);
      res.status(500).json({ error: "Impossible d'enregistrer l'avis." });
    }
  }
};
