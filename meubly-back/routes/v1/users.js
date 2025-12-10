import express from 'express';
import { userController } from '../../controllers/userController.js';

const router = express.Router();
router.use(express.json());

router.get('/users', userController.getAll);
router.get('/users/:id', userController.getById);
router.post('/users', userController.create);
router.patch('/users/:id', userController.update);
router.delete('/users/:id', userController.delete);

export default router;
  
