import express from "express";
import { body, param } from "express-validator";
import { providerController } from "../../controllers/providerController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";
import { requireAdmin } from "../../middlewares/roleMiddleware.js";
import { handleValidation, isPgUuid } from "./validation.js";

const router = express.Router();

const HTTP_URL = { protocols: ["http", "https"], require_protocol: true };
const idParam = isPgUuid(param("id")).withMessage("Identifiant invalide.");
const providerFields = (creating) => [
  creating
    ? body("name").isString().trim().isLength({ min: 1, max: 100 })
    : body("name").optional().isString().trim().isLength({ min: 1, max: 100 }),
  body("url").optional({ values: "null" }).isURL(HTTP_URL).withMessage("URL invalide."),
  body("logoUrl").optional({ values: "null" }).isURL(HTTP_URL).withMessage("URL invalide."),
  body("isActive").optional().isBoolean({ strict: true }),
];

router.get("/providers", providerController.getAll);
router.get("/providers/:id", idParam, handleValidation, providerController.getById);

router.post(
  "/providers",
  requireAuth,
  requireAdmin,
  providerFields(true),
  handleValidation,
  providerController.create
);
router.patch(
  "/providers/:id",
  requireAuth,
  requireAdmin,
  idParam,
  providerFields(false),
  handleValidation,
  providerController.update
);
router.delete(
  "/providers/:id",
  requireAuth,
  requireAdmin,
  idParam,
  handleValidation,
  providerController.delete
);

export default router;
