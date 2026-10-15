const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "kong", "host.docker.internal"]);

/**
 * Empeche les tests DB (qui creent des utilisateurs) de viser une base distante.
 * @param {string | undefined} url
 */
export function assertLocalSupabase(url) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error("Tests DB : SUPABASE_URL absente ou invalide, base locale requise.");
  }
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`Tests DB : hote "${host}" refuse, base locale requise.`);
  }
}
