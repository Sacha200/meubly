import express from "express";
import { body, param, query, validationResult } from "express-validator";
import { reviewController } from "../../controllers/reviewController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

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
  reviewController.list
);

router.post(
  "/furnitures/:id/reviews",
  requireAuth,
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
    body("authorName")
      .optional()
      .isString()
      .isLength({ max: 255 })
      .withMessage("Le nom de l'auteur ne peut pas dépasser 255 caractères."),
  ],
  handleValidation,
  reviewController.createOrUpdate
);

export default router;
