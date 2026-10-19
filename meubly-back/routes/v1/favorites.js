import express from "express";
import { favoritesController } from "../../controllers/favoritesController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// requireAuth par route : un router.use() sans prefixe s'appliquerait a toute l'API v1.
router.get("/favorites", requireAuth, favoritesController.getAll);
router.post("/favorites/:furnitureId", requireAuth, favoritesController.add);
router.delete("/favorites/:furnitureId", requireAuth, favoritesController.remove);

export default router;
