import express from 'express';
import furnituresRouter from './v1/furnitures.js';
import usersRouter from './v1/users.js';
import authRouter from './v1/auth.js';
import categoriesRouter from './v1/categories.js';
import providerRouter from './v1/provider.js';
import reviewsRouter from './v1/reviews.js';
import favoritesRouter from './v1/favorites.js';
import aiRouter from './v1/ai.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/ai', aiRouter);
router.use(usersRouter);
router.use(furnituresRouter);
router.use(categoriesRouter);
router.use(providerRouter);
router.use(reviewsRouter);
router.use(favoritesRouter);

export default router;
