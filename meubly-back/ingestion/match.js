// Rapprochement d'un article marchand avec le catalogue (spec 6.4) : l'EAN decide, sinon un admin.
import { isGtin } from "./gtin.js";

/**
 * @param {import("./adapters/index.js").ScrapedItem} item
 * @param {{
 *   furnitureByGtin: (gtin: string) => Promise<{ furniture_id: string, product_id: string|null }|null>,
 *   similar: (brand: string, title: string) => Promise<{ furniture_id: string, score: number }[]>,
 * }} lookup
 * @returns {Promise<{ action: "attach", furnitureId: string } | { action: "create" }
 *   | { action: "candidate", candidates: { furniture_id: string, score: number }[] } | { action: "skip" }>}
 */
export async function decide(item, { furnitureByGtin, similar }) {
  if (isGtin(item.gtin)) {
    const known = await furnitureByGtin(item.gtin);
    return known ? { action: "attach", furnitureId: known.furniture_id } : { action: "create" };
  }
  const candidates = await similar(item.brand, item.productTitle);
  return candidates.length ? { action: "candidate", candidates } : { action: "skip" };
}
