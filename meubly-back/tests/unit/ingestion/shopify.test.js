import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { adapters } from "../../../ingestion/adapters/index.js";
import { shopify } from "../../../ingestion/adapters/shopify.js";

const BASE = "https://shop.test";
const HAY_JS = `${BASE}/products/hay-pouf-planar.js`;
const fixture = (name) =>
  readFileSync(new URL(`../../fixtures/ingestion/shopify/${name}`, import.meta.url), "utf8");
const ROUTES = {
  [`${BASE}/products.json?limit=250&page=1`]: "products-page1.json",
  [`${BASE}/products.json?limit=250&page=2`]: "products-page2.json",
  [HAY_JS]: "product-connox.js.json",
  [`${BASE}/products/thonet-s-285-1-bureau.js`]: "product-connox-default.js.json",
  [`${BASE}/products/lampe-de-table-apex.js`]: "product-fleux.js.json",
};

/** Contexte d'adaptateur dont le reseau sert les fixtures ; `override` remplace une reponse. */
function makeCtx({ config = {}, override = {}, knownPages } = {}) {
  const fetchText = vi.fn(async (url) => {
    if (url in override) return JSON.stringify(override[url]);
    if (!ROUTES[url]) throw new Error(`URL inattendue : ${url}`);
    return fixture(ROUTES[url]);
  });
  return {
    config: { baseUrl: BASE, stripBrandPrefix: true, ...config },
    fetchText,
    knownPages,
  };
}

async function collect(ctx, brands) {
  const items = [];
  for await (const item of shopify.listItems(ctx, new Set(brands))) items.push(item);
  return items;
}

const item = (items, externalId) => items.find((i) => i.externalId === externalId);
const jsCalls = (ctx) =>
  ctx.fetchText.mock.calls.map(([url]) => url).filter((u) => u.endsWith(".js"));

/** Fiche Connox HAY modifiee pour un cas limite */
function hayWith(changeVariant) {
  const detail = JSON.parse(fixture("product-connox.js.json"));
  changeVariant(detail.variants[0]);
  return { [HAY_JS]: detail };
}

describe("adaptateur shopify", () => {
  it("est enregistre sous la cle shopify", () => {
    expect(adapters.shopify).toBe(shopify);
  });

  it("listBrands lit le catalogue jusqu'a une page vide et normalise les marques", async () => {
    const ctx = makeCtx();
    expect(await shopify.listBrands(ctx)).toEqual(new Set(["hay", "thonet", "liewood"]));
    expect(ctx.fetchText).toHaveBeenCalledTimes(2);
  });

  it("ne lit en .js que les produits des marques demandees", async () => {
    const ctx = makeCtx();
    const items = await collect(ctx, ["hay"]);
    expect(jsCalls(ctx)).toEqual([HAY_JS, `${BASE}/products/lampe-de-table-apex.js`]);
    expect(items).toHaveLength(5);
  });

  it("produit Connox : titre sans marque, prix en euros, EAN du barcode", async () => {
    const sable = item(await collect(makeCtx(), ["hay"]), "57814168338776");
    expect(sable).toMatchObject({
      pageId: "15899599700312",
      url: `${BASE}/products/hay-pouf-planar?variant=57814168338776`,
      brand: "HAY",
      productTitle: "Pouf Planar",
      variantLabel: "sable",
      gtin: "5710441309116",
      manufacturerRef: null,
      price: 239,
      availability: "in_stock",
      weightKg: 4.2,
      categoryHint: "Möbel",
    });
    expect(sable.images[0]).toMatch(/sand\.jpg/);
    expect(sable.images.every((src) => src.startsWith("https://"))).toBe(true);
    expect(sable.description).toContain("chambre d'enfant");
    expect(sable.description).not.toMatch(/[<>]/);
  });

  it("variante unique : libelle vide, prix barre absent", async () => {
    const [bureau] = await collect(makeCtx(), ["thonet"]);
    expect(bureau.variantLabel).toBe("");
    expect(bureau.price).toBe(5553.05);
    expect(Object.keys(bureau).filter((key) => /compare/i.test(key))).toEqual([]);
  });

  it("produit Fleux : EAN dans sku, reference fabricant dans barcode", async () => {
    const items = await collect(makeCtx({ config: { stripBrandPrefix: false } }), ["hay"]);
    expect(item(items, "47561977528654")).toMatchObject({
      productTitle: "Lampe de table Apex",
      gtin: "5710441326304",
      manufacturerRef: "AD343-A687",
      price: 125,
    });
  });

  it("refuse un barcode de 13 chiffres a cle fausse", async () => {
    const override = hayWith((v) => (v.barcode = "5710441309117"));
    const items = await collect(makeCtx({ override }), ["hay"]);
    expect(item(items, "57814168338776").gtin).toBeNull();
  });

  it("prefere un EAN-13 a un code de 8 chiffres valide par hasard", async () => {
    const override = hayWith((v) => {
      v.barcode = "96385074";
      v.sku = "5710441309116";
    });
    const sable = item(await collect(makeCtx({ override }), ["hay"]), "57814168338776");
    expect(sable).toMatchObject({ gtin: "5710441309116", manufacturerRef: "96385074" });
  });

  it("marque une variante indisponible", async () => {
    const override = hayWith((v) => (v.available = false));
    const items = await collect(makeCtx({ override }), ["hay"]);
    expect(item(items, "57814168338776").availability).toBe("out_of_stock");
  });

  it("page inchangee : pas de .js, EAN repris de knownPages", async () => {
    const knownPages = new Map([
      [
        "15899599700312",
        {
          updatedAt: "2026-11-20T10:00:00+01:00",
          gtins: { 57814168338776: "5710441309116", 57814168469848: null },
        },
      ],
    ]);
    const ctx = makeCtx({ knownPages });
    const items = await collect(ctx, ["hay"]);
    expect(jsCalls(ctx)).not.toContain(HAY_JS);
    expect(item(items, "57814168338776")).toMatchObject({ gtin: "5710441309116", price: 239 });
    expect(item(items, "57814168469848").gtin).toBeNull();
  });
});
