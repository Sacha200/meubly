/**
 * Erreur metier portant un statut HTTP, rendue telle quelle par `errorHandler` (4xx).
 * @param {number} statusCode
 * @param {string} message message destine au client (ne jamais y mettre une erreur Supabase brute)
 * @returns {Error & { statusCode: number }}
 */
export function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
