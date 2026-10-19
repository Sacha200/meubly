import API_BASE from "./apiBase";
import { authFetch } from "./authHeaders";

/** Champs acceptes par le back pour un partenaire (contrat `/providers`). */
function toPayload({ name, url, logoUrl, isActive }) {
  const payload = { name, url, logoUrl, isActive };
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

async function publicJson(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Erreur HTTP: ${response.status}`);
  return body;
}

export const listProviders = () => publicJson(`${API_BASE}/providers`);

export const getProvider = (id) => publicJson(`${API_BASE}/providers/${id}`);

const jsonInit = (method, dto) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(toPayload(dto)),
});

export const createProvider = (dto) => authFetch(`${API_BASE}/providers`, jsonInit("POST", dto));

export const updateProvider = (id, dto) =>
  authFetch(`${API_BASE}/providers/${id}`, jsonInit("PATCH", dto));

export const deleteProvider = (id) =>
  authFetch(`${API_BASE}/providers/${id}`, { method: "DELETE" });
