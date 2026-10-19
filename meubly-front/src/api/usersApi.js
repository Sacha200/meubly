import API_BASE from "./apiBase";
import { authFetch } from "./authHeaders";

/**
 * Liste paginee des comptes (admin).
 * @param {{ q?: string, page?: number, limit?: number }} [params]
 */
export function listUsers({ q, page, limit } = {}) {
  const url = new URL(`${API_BASE}/users`);
  if (q) url.searchParams.set("q", q);
  if (page) url.searchParams.set("page", String(page));
  if (limit) url.searchParams.set("limit", String(limit));
  return authFetch(url.toString());
}

export const blockUser = (id) => authFetch(`${API_BASE}/users/${id}/block`, { method: "POST" });

export const unblockUser = (id) => authFetch(`${API_BASE}/users/${id}/unblock`, { method: "POST" });

export const deleteUser = (id) => authFetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
