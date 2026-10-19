import { userRepository } from "../repositories/userRepository.js";

/**
 * Autorise uniquement les comptes dont `profile.role` vaut `ADMIN`. A placer apres `requireAuth`.
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentification requise" });
    }
    const role = await userRepository.findRoleByUserId(req.user.id);
    if (role !== "ADMIN") {
      return res.status(403).json({ error: "Acces reserve aux administrateurs" });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
