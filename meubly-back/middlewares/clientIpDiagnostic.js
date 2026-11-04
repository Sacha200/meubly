/**
 * DIAGNOSTIC TEMPORAIRE (fix/rate-limit-client-ip) : a retirer dans la meme PR que la correction.
 *
 * Sert a choisir le bon reglage `trust proxy` sur Render (Cloudflare + proxy Render devant l'app).
 * Ne logge AUCUNE adresse IP (donnee personnelle) : seulement des comptes et des booleens.
 * - xffCount : nombre d'entrees dans X-Forwarded-For
 * - cfIndexFromRight : position de CF-Connecting-IP dans X-Forwarded-For, comptee depuis la droite
 *   (0 = derniere entree). `trust proxy` = cfIndexFromRight + 1 ferait de req.ip l'IP vue par
 *   Cloudflare. -1 si absente.
 * - reqIpIsCf : req.ip (reglage actuel) vaut deja CF-Connecting-IP
 */
export const clientIpDiagnostic = (req, res, next) => {
  const xff = (req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const cf = req.headers["cf-connecting-ip"];
  const fromLeft = cf ? xff.lastIndexOf(cf) : -1;

  const data = {
    xffCount: xff.length,
    cfIndexFromRight: fromLeft === -1 ? -1 : xff.length - 1 - fromLeft,
    hasCfConnectingIp: Boolean(cf),
    hasTrueClientIp: Boolean(req.headers["true-client-ip"]),
    hasXRealIp: Boolean(req.headers["x-real-ip"]),
    reqIpIsCf: Boolean(cf) && req.ip === cf,
  };
  console.log(`[client-ip] ${JSON.stringify(data)}`);
  next();
};
