import express from "express";
import { providerController } from "../../controllers/providerController.js";

const router = express.Router();
router.use(express.json());

// Route pour récupérer tous les fournisseurs
router.get("/providers", providerController.getAll);

// Route pour récupérer un fournisseur par ID
router.get("/providers/:id", providerController.getById);

// Route pour créer un nouveau fournisseur
router.post("/providers", providerController.create);

// Route pour mettre à jour un fournisseur
router.patch("/providers/:id", providerController.update);

// Route pour supprimer un fournisseur
router.delete("/providers/:id", providerController.delete);

// Routes existantes pour la récupération des données des fournisseurs
router.get("/:partner/offers/:categoryId", providerController.getPartnerOffers);

// Route de test (Supprimée car logic déplacée/obsolète? Ou je peux la garder en pointant vers une méthode controller si on veut)
// Je vais supprimer le test-duplicates car c'était du debug code.
// Le controller.compareCategory gère tout ça proprement.

// recupère les données de tous les fournisseurs pour une catégorie de meubles donnée
router.get("/compare/:categoryId", providerController.getAllOffers);

export default router;
