import express from "express";
import { favoritesController } from "../../controllers/favoritesController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

const router = express.Router();
router.use(express.json());

// Toutes les routes favoris nécessitent d'être connecté
router.use(requireAuth);

router.get("/favorites", favoritesController.getAll);
router.post("/favorites/:furnitureId", favoritesController.add);
router.delete("/favorites/:furnitureId", favoritesController.remove);

export default router;
