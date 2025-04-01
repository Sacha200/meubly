import express from 'express';

import furnituresRouter from './v1/furnitures.js';
import usersRouter from './v1/users.js';
import authRouter from './v1/auth.js';
import categoriesRouter from './v1/categories.js';
const router = express.Router();


router.use( furnituresRouter);
router.use( usersRouter);
router.use(authRouter);
router.use( categoriesRouter);

export default router;
