import express from 'express';
import { categoryController } from '../../controllers/categoryController.js';

const router = express.Router();    
router.use(express.json());

// Get all categories
router.get('/categories', categoryController.getAll);

// Get a category by id
router.get('/categories/:id', categoryController.getById);

// Create a new category
router.post('/categories', categoryController.create);

// Update a category
router.put('/categories/:id', categoryController.update);

// Delete a category
router.delete('/categories/:id', categoryController.delete);

export default router;
          