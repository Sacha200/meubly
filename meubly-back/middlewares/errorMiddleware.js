/**
 * Gestionnaire d'erreurs global.
 * - 4xx (erreur levee par notre code via `httpError`) : message renvoye au client ;
 * - 5xx ou statut absent (dont toute erreur Supabase) : message generique, detail en log seulement ;
 * - `stack` uniquement en developpement.
 */
export const errorHandler = (err, req, res, next) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Corps de requete JSON invalide" });
  }

  const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  if (statusCode >= 500) {
    console.error("Erreur serveur:", err);
  }

  const body = { error: statusCode >= 500 ? "Erreur interne du serveur" : err.message };
  if (process.env.NODE_ENV === "development" && err?.stack) {
    body.stack = err.stack;
  }
  return res.status(statusCode).json(body);
};
