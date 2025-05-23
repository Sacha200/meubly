import express from 'express';

import furnituresRouter from './v1/furnitures.js';
import usersRouter from './v1/users.js';
import authRouter from './v1/auth.js';
import categoriesRouter from './v1/categories.js';
import providerRouter from './v1/provider.js';
const router = express.Router();


router.use( furnituresRouter);
router.use( usersRouter);
router.use(authRouter);
router.use( categoriesRouter);
router.use( providerRouter);

export default router;
