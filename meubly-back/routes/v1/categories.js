import express from "express";
import { categoryController } from "../../controllers/categoryController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";
import { requireAdmin } from "../../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/categories", categoryController.getAll);
router.get("/categories/:id", categoryController.getById);

router.post("/categories", requireAuth, requireAdmin, categoryController.create);
router.put("/categories/:id", requireAuth, requireAdmin, categoryController.update);
router.delete("/categories/:id", requireAuth, requireAdmin, categoryController.delete);

export default router;
