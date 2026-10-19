import express from "express";
import { body } from "express-validator";
import { aiController } from "../../controllers/aiController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";
import { aiLimiter } from "../../middlewares/rateLimit.js";
import { handleValidation } from "./validation.js";

const router = express.Router();

router.post(
  "/generate-scene",
  requireAuth,
  aiLimiter,
  [
    body("furnitureId").isUUID().withMessage("Identifiant de meuble invalide."),
    body("prompt")
      .isString()
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage("La description doit contenir entre 3 et 200 caracteres."),
  ],
  handleValidation,
  aiController.generateScene
);

export default router;
