import express from "express";
import { body, param, query, validationResult } from "express-validator";
import { reviewService } from "../../services/reviewService.js";

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

router.get(
  "/furnitures/:id/reviews",
  [
    param("id").trim().notEmpty().withMessage("L'identifiant du produit est requis."),
    query("page").optional().isInt({ min: 1 }).withMessage("La page doit être un entier positif."),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("La limite doit être comprise entre 1 et 50."),
  ],
  handleValidation,
  async (req, res) => {
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
  }
);

router.post(
  "/furnitures/:id/reviews",
  [
    param("id").trim().notEmpty().withMessage("L'identifiant du produit est requis."),
    body("rating")
      .notEmpty()
      .withMessage("La note est obligatoire.")
      .isInt({ min: 1, max: 5 })
      .withMessage("La note doit être comprise entre 1 et 5."),
    body("comment")
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Le commentaire ne peut pas dépasser 1000 caractères."),
    body("userId")
      .optional()
      .isString()
      .withMessage("L'identifiant utilisateur doit être une chaîne."),
    body("authorName")
      .optional()
      .isString()
      .isLength({ max: 255 })
      .withMessage("Le nom de l'auteur ne peut pas dépasser 255 caractères."),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment = "", userId, authorName } = req.body;
      const productId = isNaN(Number(id)) ? id : Number(id);

      if (!userId) {
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
);

export default router;
