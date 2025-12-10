import { authService } from "../services/authService.js";

export const authController = {
  async register(req, res) {
    try {
      const { username, lastname, email, password } = req.body;
      const result = await authService.register({ username, lastname, email, password });
      res.status(201).json({
          message: "Inscription réussie",
          ...result
      });
    } catch (error) {
      console.error("Erreur complète:", error);
      res.status(500).json({ error: error.message || "Erreur lors de l'inscription" });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const { session, user, profile } = await authService.login({ email, password });
      
      res.json({
        message: "Connexion réussie",
        token: session.access_token,
        user: {
            id: user.id,
            email: user.email,
            ...profile
        }
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ error: error.message || "Erreur lors de la connexion" });
    }
  },

  async logout(req, res) {
    res.status(200).json({ message: "Logged out successfully" });
  }
};
