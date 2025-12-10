import { userService } from "../services/userService.js";

export const userController = {
  async getAll(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.status(200).json(user);
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    // Basic validation
    const { firstName, lastName, email, password, role } = req.body;
    if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }
    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Format d\'email invalide' });
    }
    // Validation du mot de passe
    if (password.length < 8) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    try {
      const newUser = await userService.createUser(req.body);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await userService.updateUser(id, req.body);
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);
      res.status(200).json({ message: "User deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
