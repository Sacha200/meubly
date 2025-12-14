import express from "express";
import { furnitureController } from "../../controllers/furnitureController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";
import { requireAdmin } from "../../middlewares/roleMiddleware.js";

const router = express.Router();
router.use(express.json());

// Get all furnitures
router.get("/furnitures", furnitureController.getAll);

// Get a furniture by id
router.get("/furnitures/:id", furnitureController.getById);

// Get a furniture by id with its offers
router.get("/furnitures/:id/offers", furnitureController.getOffers);

// create a new furniture (Protected)
router.post("/furnitures", requireAuth, requireAdmin, furnitureController.create);

// update a furniture by id (Protected)
router.patch("/furnitures/:id", requireAuth, requireAdmin, furnitureController.update);

// delete a furniture by id (Protected)
router.delete("/furnitures/:id", requireAuth, requireAdmin, furnitureController.delete);

export default router;

