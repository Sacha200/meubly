import express from "express";
import { body } from "express-validator";
import { aiController } from "../../controllers/aiController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";
import { aiLimiter } from "../../middlewares/rateLimit.js";
import { handleValidation, isPgUuid } from "./validation.js";

const router = express.Router();

router.post(
  "/generate-scene",
  requireAuth,
  [
    isPgUuid(body("furnitureId")).withMessage("Identifiant de meuble invalide."),
    body("prompt")
      .isString()
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage("La description doit contenir entre 3 et 200 caracteres."),
  ],
  handleValidation,
  aiLimiter, // apres la validation : une requete invalide ne consomme pas le quota
  aiController.generateScene
);

export default router;
