import { supabase } from "../supabase.js";

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const { data: userData, error } = await supabase
      .from("User")
      .select("role")
      .eq("user_id", req.user.id)
      .single();

    if (error || !userData) {
      return res.status(403).json({ error: "Impossible de vérifier les droits" });
    }

    // Check if role is admin (flexible check for 'admin', 'ADMIN', etc.)
    const role = (userData.role || "").toLowerCase();
    
    if (role !== "admin") {
      return res.status(403).json({ error: "Accès refusé : Droits administrateur requis" });
    }

    next();
  } catch (error) {
    console.error("Role Middleware Error:", error);
    res.status(500).json({ error: "Erreur serveur lors de la vérification des droits" });
  }
};
