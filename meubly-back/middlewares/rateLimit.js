import { rateLimit } from "express-rate-limit";

const HOUR = 60 * 60 * 1000;
const TOO_MANY = { error: "Trop de requetes, reessayez plus tard" };
const common = { standardHeaders: "draft-8", legacyHeaders: false, message: TOO_MANY };

/**
 * Limite globale par IP sur /api/v1 (le health check de Render n'est jamais limite).
 * Store memoire : suffisant tant que le back tourne sur une seule instance.
 */
export const globalLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  skip: (req) => req.path === "/health",
});

/** Par utilisateur connecte : a placer apres requireAuth. */
const perUser = (limit) =>
  rateLimit({ ...common, windowMs: HOUR, limit, keyGenerator: (req) => `user:${req.user.id}` });

/** Generation de scene : chaque appel coute un credit Replicate. */
export const aiLimiter = perUser(5);

/** Creation, modification et suppression d'avis. */
export const reviewWriteLimiter = perUser(20);
