import { supabase } from "../supabase.js";

const UNAUTHENTICATED = { error: "Authentification requise" };

/**
 * Verifie le jeton Bearer aupres de Supabase Auth et place l'utilisateur dans `req.user`.
 * - 401 : header absent, schema autre que Bearer, jeton refuse ou expire ;
 * - 403 : compte bloque (`banned_until` dans le futur), verifie a chaque requete pour qu'un
 *   blocage prenne effet sans attendre l'expiration du jeton.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const [scheme, token] = (req.headers.authorization || "").split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json(UNAUTHENTICATED);
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json(UNAUTHENTICATED);
    }

    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      return res.status(403).json({ error: "Compte bloque" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
