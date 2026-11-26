// Marques comparables d'un marchand a l'autre : meme nom une fois normalise et ramene a son alias.
import { normText } from "./text.js";

/** Ecarts de nom releves entre Connox, Fleux et Nordic Nest (tache 0). */
export const BRAND_ALIASES = {
  "audo copenhagen": "audo",
  "and tradition": "tradition",
  fermliving: "ferm living",
  "hay denmark": "hay",
};

/**
 * Nom de marque canonique : normalise, sans "The " initial, alias applique.
 * @param {string} name
 * @returns {string}
 */
export function canonicalBrand(name) {
  const brand = normText(name).replace(/^the /, "");
  return BRAND_ALIASES[brand] ?? brand;
}

/**
 * Marques presentes chez au moins deux marchands.
 * @param {Set<string>[]} sets  marques de chaque marchand
 * @returns {Set<string>}  noms canoniques
 */
export function commonBrands(sets) {
  const counts = new Map();
  for (const set of sets) {
    for (const brand of new Set([...set].map(canonicalBrand))) {
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }
  }
  return new Set([...counts].filter(([, count]) => count >= 2).map(([brand]) => brand));
}
