import { categoryService } from "../services/categoryService.js";

export const categoryController = {
  async getAll(req, res) {
    try {
      const { search, limit } = req.query;
      const categories = await categoryService.getAllCategories(search, limit);
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
       const id = Number(req.params.id);
       const category = await categoryService.getCategoryById(id);
       res.status(200).json(category);
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const category = await categoryService.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const id = Number(req.params.id);
      const category = await categoryService.updateCategory(id, req.body);
      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const id = Number(req.params.id);
      await categoryService.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
