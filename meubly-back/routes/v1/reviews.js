import express from "express";
import { body, param, query } from "express-validator";
import { reviewController } from "../../controllers/reviewController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";
import { requireAdmin } from "../../middlewares/roleMiddleware.js";
import { handleValidation } from "./validation.js";

const router = express.Router();

const furnitureId = param("id").isUUID().withMessage("Identifiant de meuble invalide.");

router.get(
  "/furnitures/:id/reviews",
  [
    furnitureId,
    query("page").optional().isInt({ min: 1 }).withMessage("La page doit être un entier positif."),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("La limite doit être comprise entre 1 et 50."),
  ],
  handleValidation,
  reviewController.list
);

router.get(
  "/furnitures/:id/reviews/me",
  requireAuth,
  furnitureId,
  handleValidation,
  reviewController.getMine
);

router.post(
  "/furnitures/:id/reviews",
  requireAuth,
  [
    furnitureId,
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("La note doit être un entier compris entre 1 et 5."),
    body("comment")
      .optional({ values: "null" })
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Le commentaire ne peut pas dépasser 1000 caractères."),
  ],
  handleValidation,
  reviewController.upsert
);

router.delete(
  "/furnitures/:id/reviews/me",
  requireAuth,
  furnitureId,
  handleValidation,
  reviewController.deleteMine
);

router.delete(
  "/reviews/:reviewId",
  requireAuth,
  requireAdmin,
  param("reviewId").isUUID().withMessage("Identifiant d'avis invalide."),
  handleValidation,
  reviewController.deleteAny
);

export default router;
