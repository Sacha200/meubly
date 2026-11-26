// Adaptateur Shopify (Connox, Fleux) : catalogue par /products.json, detail par /products/<handle>.js.
import { pickGtin } from "../gtin.js";
import { normText } from "../text.js";

const MAX_PAGES = 200; // garde-fou : 50 000 produits
const MAX_IMAGES = 6;
const MAX_DESCRIPTION = 900;
const AVAILABILITY = { true: "in_stock", false: "out_of_stock" };
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Pages de /products.json, jusqu'a la premiere vide. */
async function* catalogPages({ config, fetchText }) {
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${config.baseUrl}/products.json?limit=250&page=${page}`;
    const { products } = JSON.parse(await fetchText(url));
    if (!products.length) return;
    yield products;
  }
}

/** Fiche /products/<handle>.js : prix en centimes, barcode present. */
function fromDetail(product, updatedAt) {
  return {
    ...product,
    updatedAt,
    variants: product.variants.map((v) => ({
      ...v,
      priceCents: v.price,
      grams: v.weight,
      image: v.featured_image?.src,
    })),
  };
}

/** Resume /products.json : prix en euros (texte), pas de barcode. */
function fromSummary(product) {
  return {
    ...product,
    type: product.product_type,
    description: product.body_html,
    updatedAt: product.updated_at,
    images: product.images.map((image) => image.src),
    variants: product.variants.map((v) => ({
      ...v,
      priceCents: Math.round(Number(v.price) * 100),
      image: v.featured_image?.src,
    })),
  };
}

/** EAN-13, 14 ou 12 avant EAN-8 : une reference de 8 chiffres passe la cle 1 fois sur 10. */
function findGtin(...candidates) {
  const long = candidates.filter((candidate) => String(candidate ?? "").trim().length >= 12);
  return pickGtin(...long) ?? pickGtin(...candidates);
}

function stripBrandPrefix(title, brand) {
  const prefix = `${brand} - `.toLowerCase();
  return title.toLowerCase().startsWith(prefix) ? title.slice(prefix.length) : title;
}

const absolute = (src) => (src.startsWith("//") ? `https:${src}` : src);

/** Texte brut : balises retirees, entites decodees, espaces reduits. */
function plainText(html) {
  // shortcut: entites courantes et decimales seulement, ajouter &#x..; si un marchand en sert
  const text = String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#\d+|[a-z]+);/gi, (match, entity) =>
      entity.startsWith("#")
        ? String.fromCodePoint(Number(entity.slice(1)))
        : (ENTITIES[entity.toLowerCase()] ?? match)
    )
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.slice(0, MAX_DESCRIPTION) : null;
}

/** Une page produit normalisee -> un ScrapedItem par variante. */
function* toItems(config, page, knownGtins) {
  for (const variant of page.variants) {
    const externalId = String(variant.id);
    const barcode = String(variant.barcode ?? "").trim();
    const gtin = knownGtins ? (knownGtins[externalId] ?? null) : findGtin(barcode, variant.sku);
    yield {
      externalId,
      pageId: String(page.id),
      pageUpdatedAt: page.updatedAt ?? null,
      url: `${config.baseUrl}/products/${page.handle}?variant=${externalId}`,
      brand: page.vendor,
      productTitle: config.stripBrandPrefix
        ? stripBrandPrefix(page.title, page.vendor)
        : page.title,
      variantLabel: variant.title === "Default Title" ? "" : variant.title,
      gtin,
      manufacturerRef: barcode && barcode !== gtin ? barcode : null,
      price: variant.priceCents / 100,
      availability: AVAILABILITY[variant.available] ?? "unknown",
      images: [...new Set([variant.image, ...page.images].filter(Boolean).map(absolute))].slice(
        0,
        MAX_IMAGES
      ),
      description: plainText(page.description),
      attributes: {},
      weightKg: variant.grams > 0 ? variant.grams / 1000 : null,
      categoryHint: page.type || null,
    };
  }
}

/** @type {import("./index.js").Adapter} */
export const shopify = {
  async listBrands(ctx) {
    const brands = new Set();
    for await (const products of catalogPages(ctx)) {
      for (const product of products) if (product.vendor) brands.add(normText(product.vendor));
    }
    return brands;
  },

  async *listItems(ctx, brands) {
    for await (const products of catalogPages(ctx)) {
      for (const summary of products) {
        if (!brands.has(normText(summary.vendor ?? ""))) continue;
        const known = ctx.knownPages?.get(String(summary.id));
        if (known?.updatedAt === summary.updated_at) {
          // shortcut: sans le .js, pas de barcode, donc manufacturerRef reste null sur une page inchangee
          yield* toItems(ctx.config, fromSummary(summary), known.gtins);
          continue;
        }
        const url = `${ctx.config.baseUrl}/products/${summary.handle}.js`;
        yield* toItems(
          ctx.config,
          fromDetail(JSON.parse(await ctx.fetchText(url)), summary.updated_at)
        );
      }
    }
  },
};
