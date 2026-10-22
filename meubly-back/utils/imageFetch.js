import axios from "axios";
import { httpError } from "./httpError.js";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const LOCAL_HOSTS = new Set(["localhost", "kong"]);

/**
 * Developpement local explicite (`NODE_ENV=development`, pose par docker-compose.dev.yml).
 * Toute autre valeur, absente comprise, applique les regles de production.
 * @returns {boolean}
 */
export function isLocalDev() {
  return process.env.NODE_ENV === "development";
}

/**
 * Hotes d'images que le serveur a le droit de telecharger (anti-SSRF).
 * `AI_IMAGE_HOSTS` (separes par des virgules) remplace la liste par defaut.
 * Une entree commencant par "." autorise ce domaine et ses sous-domaines.
 * @returns {string[]}
 */
export function getAllowedImageHosts() {
  if (process.env.AI_IMAGE_HOSTS) {
    return process.env.AI_IMAGE_HOSTS.split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);
  }
  const hosts = ["www.ikea.com", "images.unsplash.com"];
  try {
    hosts.push(new URL(process.env.SUPABASE_URL).hostname);
  } catch {
    // SUPABASE_URL absente : pas d'hote Storage autorise.
  }
  return hosts;
}

function isAllowedHost(hostname, allowedHosts) {
  return allowedHosts.some((entry) =>
    entry.startsWith(".")
      ? hostname.endsWith(entry) || hostname === entry.slice(1)
      : hostname === entry
  );
}

/**
 * Telecharge une image uniquement depuis un hote autorise, sans suivre de redirection,
 * avec une taille maximale et un type `image/*`.
 * @param {string} url
 * @param {{ allowedHosts: string[], maxBytes?: number }} options
 * @returns {Promise<Buffer>}
 * @throws {Error & { statusCode: number }} 400 source refusee, 502 telechargement impossible
 */
export async function fetchAllowedImage(url, { allowedHosts, maxBytes = MAX_IMAGE_BYTES }) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw httpError(400, "Image source non autorisee");
  }

  const hostname = parsed.hostname.toLowerCase();
  const localDev = isLocalDev() && LOCAL_HOSTS.has(hostname);
  const protocolOk = parsed.protocol === "https:" || (localDev && parsed.protocol === "http:");
  if (!protocolOk || (!localDev && !isAllowedHost(hostname, allowedHosts))) {
    throw httpError(400, "Image source non autorisee");
  }

  let response;
  try {
    response = await axios.get(parsed.toString(), {
      responseType: "arraybuffer",
      maxRedirects: 0,
      maxContentLength: maxBytes,
      timeout: 15000,
    });
  } catch {
    throw httpError(502, "Image source indisponible");
  }

  const contentType = String(response.headers?.["content-type"] || "");
  if (!contentType.startsWith("image/")) {
    throw httpError(400, "La source n'est pas une image");
  }
  return Buffer.from(response.data);
}
