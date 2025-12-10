import { categoryRepository } from "../repositories/categoryRepository.js";

export const categoryService = {
  async getAllCategories(search, limit) {
    return await categoryRepository.findAll(search, limit);
  },

  async getCategoryById(id) {
    if (Number.isNaN(id)) throw new Error('Invalid category id');
    
    const category = await categoryRepository.findById(id);
    if (!category) throw new Error('Category not found');
    
    return category;
  },

  async createCategory(categoryData) {
     if (!categoryData.title || typeof categoryData.title !== 'string') {
        throw new Error('title is required');
     }
     return await categoryRepository.create(categoryData);
  },

  async updateCategory(id, { title, cover_url }) {
     if (Number.isNaN(id)) throw new Error('Invalid category id');

     const payload = {};
     if (typeof title === 'string') payload.title = title;
     if (typeof cover_url === 'string' || cover_url === null) payload.cover_url = cover_url;

     return await categoryRepository.update(id, payload);
  },

  async deleteCategory(id) {
      if (Number.isNaN(id)) throw new Error('Invalid category id');
      await categoryRepository.delete(id);
  }
};
