import { supabase } from "../supabase.js";

/**
 * Middleware to protect routes Authentication
 * Verifies the Bearer token in the Authorization header via Supabase
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authentification requise (Header manquant)" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: "Token invalide ou expiré" });
    }

    // Attach user to request for downstream use
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'authentification" });
  }
};
