import axios from "axios";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PUBLIC_URL ||
  process.env.API_EXTERNAL_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Erreur: variables Supabase manquantes (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const API_BASE_URL = (
  process.env.EXTERNAL_FURNITURE_API_BASE_URL ||
  "https://funiture-store-api.up.railway.app"
).replace(/\/+$/, "");

const SOURCE_PARTNER_NAME =
  process.env.EXTERNAL_FURNITURE_PARTNER_NAME || "Funiture Store API (GitHub)";

function toNumberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeLabel(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

async function getOrCreateSourcePartner() {
  const { data: existing, error: existingError } = await supabase
    .from("Partner")
    .select("partner_id, name")
    .eq("name", SOURCE_PARTNER_NAME)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing;

  const { data: created, error: createError } = await supabase
    .from("Partner")
    .insert([
      {
        name: SOURCE_PARTNER_NAME,
        website_base_url: API_BASE_URL,
        is_active: true,
      },
    ])
    .select("partner_id, name")
    .single();
  if (createError) throw createError;
  return created;
}

async function ensureCategoryByLabel(label, cache) {
  const normalized = normalizeLabel(label);
  if (!normalized) return null;

  if (cache.has(normalized.toLowerCase())) {
    return cache.get(normalized.toLowerCase());
  }

  const { data: existing, error: existingError } = await supabase
    .from("Category")
    .select("category_id, label")
    .ilike("label", normalized)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    cache.set(normalized.toLowerCase(), existing.category_id);
    return existing.category_id;
  }

  const { data: created, error: createError } = await supabase
    .from("Category")
    .insert([{ label: normalized }])
    .select("category_id, label")
    .single();
  if (createError) throw createError;

  cache.set(normalized.toLowerCase(), created.category_id);
  return created.category_id;
}

const LOCAL_JSON_PATH = path.resolve(
  __dirname,
  process.env.EXTERNAL_FURNITURE_JSON_FILE || "external_furniture_data.json"
);

async function loadLocalJsonFallback() {
  const raw = await fs.readFile(LOCAL_JSON_PATH, "utf-8");
  return JSON.parse(raw);
}

async function resolveDataSource() {
  const candidates = Array.from(
    new Set([
      API_BASE_URL,
      `${API_BASE_URL}/api`,
      `${API_BASE_URL}/api/v1`,
    ])
  );

  for (const candidate of candidates) {
    try {
      const { data } = await axios.get(`${candidate}/products`, { timeout: 8000 });
      if (Array.isArray(data)) {
        console.log(`API live detectee: ${candidate}`);
        return { mode: "api", apiBaseUrl: candidate };
      }
    } catch {
      // continue
    }
  }

  console.log(`Aucune API live disponible — utilisation du fichier JSON local: ${LOCAL_JSON_PATH}`);
  const jsonData = await loadLocalJsonFallback();
  return { mode: "json", jsonData };
}

async function fetchCategories(apiBaseUrl) {
  try {
    const { data } = await axios.get(`${apiBaseUrl}/categories`, { timeout: 15000 });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchProducts(apiBaseUrl) {
  const { data } = await axios.get(`${apiBaseUrl}/products`, { timeout: 20000 });
  return Array.isArray(data) ? data : [];
}

async function fetchProductDetail(apiBaseUrl, id) {
  const { data } = await axios.get(`${apiBaseUrl}/products/${id}`, { timeout: 20000 });
  return data || null;
}

async function findFurnitureByExternalId(partnerId, externalId) {
  const { data, error } = await supabase
    .from("PartnerProduct")
    .select("partner_product_id, furniture_id")
    .eq("partner_id", partnerId)
    .eq("external_id", externalId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function upsertFurniture(baseProduct, detailProduct) {
  const merged = { ...baseProduct, ...(detailProduct || {}) };
  const title = normalizeLabel(merged.title);
  if (!title) {
    throw new Error("Produit externe ignoré: title manquant.");
  }

  const updatePayload = {
    title,
    description: merged.description || null,
    cover_url: merged.image_url || null,
    cached_min_price: toNumberOrNull(merged.price),
    cached_nb_offers: toNumberOrNull(merged.price) != null ? 1 : 0,
  };

  const { data: existingByTitle, error: existingError } = await supabase
    .from("Furniture")
    .select("furniture_id")
    .eq("title", title)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existingByTitle) {
    const { data: updated, error: updateError } = await supabase
      .from("Furniture")
      .update(updatePayload)
      .eq("furniture_id", existingByTitle.furniture_id)
      .select("furniture_id, title")
      .single();
    if (updateError) throw updateError;
    return updated;
  }

  const { data: created, error: createError } = await supabase
    .from("Furniture")
    .insert([updatePayload])
    .select("furniture_id, title")
    .single();
  if (createError) throw createError;
  return created;
}

async function upsertExternalLink({
  apiBaseUrl,
  partnerId,
  externalId,
  furnitureId,
  payload,
  title,
}) {
  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("PartnerProduct").upsert(
    {
      partner_id: partnerId,
      external_id: externalId,
      furniture_id: furnitureId,
      external_url: `${apiBaseUrl}/products/${externalId}`,
      external_title: title || null,
      raw_payload: payload,
      last_seen_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "partner_id,external_id" }
  );
  if (error) throw error;
}

async function linkFurnitureCategory(furnitureId, categoryId) {
  if (!furnitureId || !categoryId) return;
  const { error } = await supabase
    .from("FurnitureCategory")
    .upsert(
      { furniture_id: furnitureId, category_id: categoryId },
      { onConflict: "furniture_id,category_id" }
    );
  if (error) throw error;
}

async function getOrCreatePartnerByName(name, partnerCache) {
  const key = name.trim().toLowerCase();
  if (partnerCache.has(key)) return partnerCache.get(key);

  const { data: existing } = await supabase
    .from("Partner")
    .select("partner_id, name")
    .eq("name", name.trim())
    .maybeSingle();

  if (existing) {
    partnerCache.set(key, existing.partner_id);
    return existing.partner_id;
  }

  const { data: created, error } = await supabase
    .from("Partner")
    .insert([{ name: name.trim(), is_active: true }])
    .select("partner_id")
    .single();
  if (error) throw error;

  partnerCache.set(key, created.partner_id);
  return created.partner_id;
}

async function upsertOffer({ furnitureId, partnerId, title, url, price }) {
  const nowIso = new Date().toISOString();

  const { data: existing } = await supabase
    .from("offers")
    .select("offer_id")
    .eq("furniture_id", furnitureId)
    .eq("partner_id", partnerId)
    .eq("url_website", url)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("offers")
      .update({
        external_title: title || null,
        price: toNumberOrNull(price),
        is_active: true,
        updated_at: nowIso,
      })
      .eq("offer_id", existing.offer_id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("offers")
      .insert([{
        furniture_id: furnitureId,
        partner_id: partnerId,
        external_title: title || null,
        url_website: url,
        price: toNumberOrNull(price),
        is_active: true,
        updated_at: nowIso,
      }]);
    if (error) throw error;
  }
}

async function recomputeFurnitureCache(furnitureId) {
  const { data: offers, error } = await supabase
    .from("offers")
    .select("price")
    .eq("furniture_id", furnitureId)
    .eq("is_active", true);
  if (error) throw error;

  const prices = (offers || [])
    .map((o) => toNumberOrNull(o.price))
    .filter((n) => typeof n === "number");

  const cached_nb_offers = prices.length;
  const cached_min_price = cached_nb_offers > 0 ? Math.min(...prices) : null;

  const { error: updateError } = await supabase
    .from("Furniture")
    .update({ cached_nb_offers, cached_min_price })
    .eq("furniture_id", furnitureId);
  if (updateError) throw updateError;
}

async function run() {
  console.log("Debut import...");

  const source = await resolveDataSource();

  const sourcePartner = await getOrCreateSourcePartner();
  const categoryCache = new Map();

  let products = [];

  if (source.mode === "api") {
    const externalCategories = await fetchCategories(source.apiBaseUrl);
    for (const category of externalCategories) {
      if (category?.name) {
        await ensureCategoryByLabel(category.name, categoryCache);
      }
    }
    products = await fetchProducts(source.apiBaseUrl);
  } else {
    const { categories = [], products: jsonProducts = [] } = source.jsonData;
    for (const category of categories) {
      if (category?.name) {
        await ensureCategoryByLabel(category.name, categoryCache);
      }
    }
    products = jsonProducts;
  }

  console.log(`Produits a importer: ${products.length}`);

  const partnerCache = new Map();

  const stats = {
    total: products.length,
    createdOrUpdated: 0,
    linkedCategory: 0,
    offersImported: 0,
    enrichedByDetail: 0,
    failed: 0,
  };

  for (const product of products) {
    try {
      const externalId = String(product?.id ?? "");
      if (!externalId) {
        stats.failed += 1;
        continue;
      }

      let detail = null;
      if (source.mode === "api") {
        try {
          detail = await fetchProductDetail(source.apiBaseUrl, externalId);
          if (detail) stats.enrichedByDetail += 1;
        } catch (detailError) {
          console.warn(`Detail indisponible pour product ${externalId}: ${detailError.message}`);
        }
      }

      const existingExternalLink = await findFurnitureByExternalId(
        sourcePartner.partner_id,
        externalId
      );

      let furniture = null;
      if (existingExternalLink?.furniture_id) {
        const merged = { ...product, ...(detail || {}) };
        const updatePayload = {
          title: normalizeLabel(merged.title),
          description: merged.description || null,
          cover_url: merged.image_url || null,
          cached_min_price: toNumberOrNull(merged.price),
          cached_nb_offers: toNumberOrNull(merged.price) != null ? 1 : 0,
        };
        const { data: updated, error: updateError } = await supabase
          .from("Furniture")
          .update(updatePayload)
          .eq("furniture_id", existingExternalLink.furniture_id)
          .select("furniture_id, title")
          .single();
        if (updateError) throw updateError;
        furniture = updated;
      } else {
        furniture = await upsertFurniture(product, detail);
      }

      const resolvedApiUrl = source.mode === "api" ? source.apiBaseUrl : API_BASE_URL;
      await upsertExternalLink({
        apiBaseUrl: resolvedApiUrl,
        partnerId: sourcePartner.partner_id,
        externalId,
        furnitureId: furniture.furniture_id,
        payload: detail || product,
        title: furniture.title,
      });

      const categoryLabel =
        detail?.category?.name || product?.category?.name || null;
      if (categoryLabel) {
        const categoryId = await ensureCategoryByLabel(categoryLabel, categoryCache);
        await linkFurnitureCategory(furniture.furniture_id, categoryId);
        stats.linkedCategory += 1;
      }

      // Import des offres (présentes dans le JSON local ou dans le détail API)
      const offersList = product?.offers || detail?.offers || [];
      for (const offer of offersList) {
        try {
          const partnerId = await getOrCreatePartnerByName(offer.partner, partnerCache);
          await upsertOffer({
            furnitureId: furniture.furniture_id,
            partnerId,
            title: offer.title || null,
            url: offer.url,
            price: offer.price,
          });
          stats.offersImported += 1;
        } catch (offerError) {
          console.warn(`Offre ignoree pour ${furniture.title} / ${offer.partner}: ${offerError.message}`);
        }
      }

      // Recalcul du cache prix/nb offres si des offres ont été importées
      if (offersList.length > 0) {
        await recomputeFurnitureCache(furniture.furniture_id);
      }

      stats.createdOrUpdated += 1;
    } catch (error) {
      stats.failed += 1;
      console.error(`Erreur import produit ${product?.id ?? "unknown"}:`, error.message);
    }
  }

  console.log("Import termine.");
  console.log(stats);
}

run().catch((error) => {
  console.error("Echec import API externe:", error);
  process.exit(1);
});
