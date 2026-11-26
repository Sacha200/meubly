// Adaptateurs de collecte, choisis par partner.adapter. Tous respectent le contrat ci-dessous.
import { shopify } from "./shopify.js";

/**
 * @typedef {Object} ScrapedItem
 * @property {string} externalId      identifiant de la variante chez le marchand
 * @property {string} pageId          identifiant de la page produit chez le marchand
 * @property {string|null} pageUpdatedAt  date de modification de la page, si le marchand la donne
 * @property {string} url             URL publique de la variante
 * @property {string} brand
 * @property {string} productTitle    sans la marque ni la variante
 * @property {string} variantLabel    "" si variante unique
 * @property {string|null} gtin       EAN valide ou null
 * @property {string|null} manufacturerRef
 * @property {number} price           euros TTC
 * @property {"in_stock"|"out_of_stock"|"unknown"} availability
 * @property {string[]} images        6 au plus, image de la variante en premier
 * @property {string|null} description  900 caracteres au plus, sans HTML
 * @property {Record<string, string|number>} attributes
 * @property {number|null} weightKg
 * @property {string|null} categoryHint  type ou rayon annonce par le marchand
 */

/**
 * @typedef {Object} AdapterCtx
 * @property {object} config                              partner.adapter_config
 * @property {(url: string) => Promise<string>} fetchText  en pratique createPoliteFetch()
 * @property {Map<string, { updatedAt: string, gtins: Record<string, string|null> }>} [knownPages]
 */

/**
 * @typedef {Object} Adapter
 * @property {(ctx: AdapterCtx) => Promise<Set<string>>} listBrands  marques normalisees (normText)
 * @property {(ctx: AdapterCtx, brands: Set<string>) => AsyncGenerator<ScrapedItem>} listItems
 */

export const adapters = { shopify };
