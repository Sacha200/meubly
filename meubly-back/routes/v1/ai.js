import express from 'express';
import { aiController } from '../../controllers/aiController.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/generate-scene', requireAuth, aiController.generateScene);

export default router;
