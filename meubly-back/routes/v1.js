// routes/v1.js - Organisation modulaire
import express from 'express';
import furnituresRouter from './v1/furnitures.js';
import usersRouter from './v1/users.js';
import authRouter from './v1/auth.js';
import categoriesRouter from './v1/categories.js';
import providerRouter from './v1/provider.js';
import reviewsRouter from './v1/reviews.js';
import favoritesRouter from './v1/favorites.js';
const router = express.Router();

// Configuration des routes
// Configuration des routes (Ordre important !)
router.use('/auth', authRouter); // 1. Auth d'abord (Login/Register publics)
router.use(usersRouter); // Permissions handled by requireAuth middleware in routes
router.use(furnituresRouter); // Public Search is important
router.use(categoriesRouter);
router.use(providerRouter);
router.use(reviewsRouter);

// Routes nécessitant Auth (Si middleware global dans le router)
router.use(favoritesRouter);

export default router;
