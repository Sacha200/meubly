import { categoryRepository } from "../repositories/categoryRepository.js";

export const categoryService = {
  async getAllCategories(search, limit) {
    return await categoryRepository.findAll(search, limit);
  },

  async getCategoryById(id) {
    // Note: id is UUID now, so isNaN check might be wrong if it expects number.
    // Assuming UUID is string.
    if (!id) throw new Error('Invalid category id');
    
    const category = await categoryRepository.findById(id);
    if (!category) throw new Error('Category not found');
    
    return category;
  },

  async createCategory(categoryData) {
     if (!categoryData.label || typeof categoryData.label !== 'string') {
        throw new Error('label is required');
     }
     return await categoryRepository.create(categoryData);
  },

  async updateCategory(id, { label, cover_url, parent_id }) {
     if (!id) throw new Error('Invalid category id');

     const payload = {};
     if (typeof label === 'string') payload.label = label;
     if (typeof cover_url === 'string' || cover_url === null) payload.cover_url = cover_url;
     if (parent_id !== undefined) payload.parent_id = parent_id;

     return await categoryRepository.update(id, payload);
  },

  async deleteCategory(id) {
      if (!id) throw new Error('Invalid category id');
      await categoryRepository.delete(id);
  }
};
