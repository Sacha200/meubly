import { userRepository } from "../repositories/userRepository.js";

export const userService = {
  async getAllUsers() {
    return await userRepository.findAll();
  },

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error("User not found");
    return user;
  },

  async createUser(userData) {
      // Basic validation handled in controller or schema
      return await userRepository.create(userData);
  },

  async updateUser(id, updates) {
      return await userRepository.update(id, updates);
  },

  async deleteUser(id) {
      return await userRepository.delete(id);
  }
};
