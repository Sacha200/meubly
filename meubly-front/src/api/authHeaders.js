import { supabase } from "../supabase";

/**
 * En-tete d'autorisation du compte connecte, pour les appels a l'API back.
 * @returns {Promise<{ Authorization: string }>}
 * @throws {Error} si aucune session n'est ouverte
 */
export async function authHeaders() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) throw new Error("Utilisateur non connecte");
  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * Appel authentifie a l'API : leve une Error portant le message du back en cas d'echec.
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<any>} corps JSON, ou null pour une reponse 204
 */
export async function authFetch(url, init = {}) {
  const headers = { ...(await authHeaders()), ...(init.headers || {}) };
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.errors?.[0]?.msg || `Erreur HTTP: ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}
