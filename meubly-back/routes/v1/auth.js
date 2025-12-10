import express from "express";
import { authController } from "../../controllers/authController.js";

const router = express.Router();
router.use(express.json());

// Register a new user
router.post("/register", authController.register);

// Login using Supabase Auth
router.post("/login", authController.login);

// Logout (No actual server-side logout for JWT but standardized response)
router.post("/logout", authController.logout);

export default router;
