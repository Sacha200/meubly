import express from "express";
import { param, query } from "express-validator";
import { userController } from "../../controllers/userController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";
import { requireAdmin } from "../../middlewares/roleMiddleware.js";
import { handleValidation, isPgUuid } from "./validation.js";

const router = express.Router();

// Lettres, chiffres, espace et @ . _ + - : exclut la syntaxe des filtres PostgREST (, ( ) % *).
const SEARCH_PATTERN = /^[\p{L}\p{N}@._+\- ]*$/u;
const idParam = isPgUuid(param("id")).withMessage("Identifiant invalide.");
const admin = [requireAuth, requireAdmin];

router.get(
  "/users",
  admin,
  [
    query("q").optional().isString().trim().isLength({ max: 100 }).matches(SEARCH_PATTERN),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  handleValidation,
  userController.list
);
router.get("/users/:id", admin, idParam, handleValidation, userController.getById);
router.post("/users/:id/block", admin, idParam, handleValidation, userController.block);
router.post("/users/:id/unblock", admin, idParam, handleValidation, userController.unblock);
router.delete("/users/:id", admin, idParam, handleValidation, userController.delete);

export default router;
