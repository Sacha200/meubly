import { categoryService } from "../services/categoryService.js";

export const categoryController = {
  async getAll(req, res, next) {
    try {
      const { search, limit } = req.query;
      const categories = await categoryService.getAllCategories(search, limit);
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id);
      res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.updateCategory(id, req.body);
      res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await categoryService.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
