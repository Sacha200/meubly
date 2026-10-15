/**
 * enrich_furniture_images.mjs
 *
 * Enrichit les meubles IKEA déjà en base avec leurs images multiples.
 * Ne crée PAS de nouveaux meubles — insère uniquement dans FurnitureImage.
 *
 * Fonctionnement :
 *  1. Charge tous les PartnerProducts IKEA (external_id → furniture_id)
 *  2. Pour chaque catégorie IKEA, récupère les produits via l'API
 *  3. Pour chaque produit dont l'external_id existe en base, insère les images
 *  4. Ignore les meubles qui ont déjà des images (sauf si --force)
 *
 * Usage :
 *   node bd/ingestion/enrich_furniture_images.mjs
 *   node bd/ingestion/enrich_furniture_images.mjs --force     # réécrit même si images existantes
 *   node bd/ingestion/enrich_furniture_images.mjs --cats=bm003,fu003
 *   node bd/ingestion/enrich_furniture_images.mjs --dry-run   # affiche sans insérer
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Charge le .env manuellement (pas de dotenv dans ce package) ───────────────
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../../.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env optionnel
  }
}
loadEnv();

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.SUPABASE_URL || process.env.API_EXTERNAL_URL || 'http://localhost:8000';
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const IKEA_API_BASE = 'https://sik.search.blue.cdtapps.com/fr/fr';
const IKEA_PARTNER_ID = '8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1';
const PAGE_SIZE   = 1000;
const DELAY_MS    = 500; // politesse envers l'API IKEA

if (!SUPABASE_KEY) {
  console.error('[Images] SUPABASE_SERVICE_ROLE_KEY manquante dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Args CLI ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FORCE   = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const catsArg = args.find(a => a.startsWith('--cats='));

const ALL_CATEGORIES = [
  'fu003', 'fu002', 'fu004', 'st002', 'bm003', 'od003',
  'st004', 'st003', 'ba001', 'li001', 'de001', 'tl001',
  'tl004', 'tl002', 'ka001', 'kt001', 'bc001', 'od001',
  'pp001', 'bm002', 'fu005',
];

const SELECTED_CATS = catsArg
  ? catsArg.replace('--cats=', '').split(',').map(s => s.trim())
  : ALL_CATEGORIES;

// ── Ordre d'affichage par type IKEA ──────────────────────────────────────────
const TYPE_ORDER = {
  MAIN_PRODUCT_IMAGE:      0,
  CONTEXT_PRODUCT_IMAGE:   1,
  FUNCTIONAL_PRODUCT_IMAGE: 2,
  QUALITY_PRODUCT_IMAGE:   3,
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ── Charge le mapping external_id → furniture_id depuis la BDD ───────────────
async function loadIkeaPartnerProducts() {
  const map = new Map(); // external_id (string) → furniture_id (uuid)
  let from = 0;
  const BATCH = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('PartnerProduct')
      .select('external_id, furniture_id')
      .eq('partner_id', IKEA_PARTNER_ID)
      .not('furniture_id', 'is', null)
      .range(from, from + BATCH - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row.external_id && row.furniture_id) {
        map.set(String(row.external_id), row.furniture_id);
      }
    }

    if (data.length < BATCH) break;
    from += BATCH;
  }

  return map;
}

// ── Charge les furniture_id qui ont déjà des images ──────────────────────────
async function loadFurnitureWithImages() {
  const set = new Set();
  let from = 0;
  const BATCH = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('FurnitureImage')
      .select('furniture_id')
      .range(from, from + BATCH - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) set.add(row.furniture_id);
    if (data.length < BATCH) break;
    from += BATCH;
  }

  return set;
}

// ── Récupère les produits d'une catégorie IKEA ────────────────────────────────
async function fetchIkeaCategory(categoryId) {
  const url = `${IKEA_API_BASE}/product-list-page?category=${categoryId}&size=${PAGE_SIZE}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      return json.productListPage?.productWindow ?? [];
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(1000 * (attempt + 1));
    }
  }
  return [];
}

// ── Construit les lignes FurnitureImage à partir d'un produit IKEA ────────────
function buildImages(furnitureId, ikeaProduct) {
  const raw = Array.isArray(ikeaProduct.allProductImage) ? ikeaProduct.allProductImage : [];
  const seen = new Set();

  return raw
    .filter(img => img?.url && !seen.has(img.url) && seen.add(img.url))
    .sort((a, b) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9))
    .map((img, idx) => ({
      image_id:     uuidv4(),
      furniture_id: furnitureId,
      url:          img.url,
      alt_text:     img.altText ?? null,
      type:         img.type ?? null,
      position:     idx,
      source:       'ikea',
      is_cover:     img.type === 'MAIN_PRODUCT_IMAGE' || idx === 0,
      created_at:   new Date().toISOString(),
    }));
}

// ── Insère un batch d'images dans Supabase ────────────────────────────────────
async function insertImages(images) {
  if (!images.length) return;
  // insert simple (pas upsert) — on a déjà filtré les doublons en amont
  const { error } = await supabase
    .from('FurnitureImage')
    .insert(images);
  if (error) throw error;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🖼️  Enrichissement images IKEA${DRY_RUN ? ' (DRY RUN)' : ''}${FORCE ? ' (FORCE)' : ''}`);
  console.log(`   ${SELECTED_CATS.length} catégorie(s) à traiter\n`);

  console.log('⏳ Chargement du catalogue en base...');
  const partnerMap = await loadIkeaPartnerProducts();
  console.log(`   → ${partnerMap.size} produits IKEA en base\n`);

  let alreadyHasImages = new Set();
  if (!FORCE) {
    alreadyHasImages = await loadFurnitureWithImages();
    console.log(`   → ${alreadyHasImages.size} meubles ont déjà des images (ignorés, utilisez --force pour réécrire)\n`);
  }

  const stats = { total: 0, inserted: 0, skipped: 0, notInDb: 0, errors: 0 };

  // Mémorise les furniture_id déjà traités dans CE run (évite les doublons
  // quand un même meuble apparaît dans plusieurs catégories IKEA)
  const processedThisRun = new Set();

  for (const catId of SELECTED_CATS) {
    process.stdout.write(`📂 Catégorie ${catId}... `);

    let products;
    try {
      products = await fetchIkeaCategory(catId);
    } catch (e) {
      console.error(`\n   ❌ Erreur fetch: ${e.message}`);
      stats.errors++;
      await sleep(DELAY_MS);
      continue;
    }

    console.log(`${products.length} produits IKEA`);

    const imageBatch = [];

    for (const p of products) {
      stats.total++;
      const externalId = String(p.id ?? p.itemNo ?? '');
      const furnitureId = partnerMap.get(externalId);

      if (!furnitureId) {
        stats.notInDb++;
        continue;
      }

      // Déjà traité dans ce run (même meuble, autre catégorie IKEA)
      if (processedThisRun.has(furnitureId)) {
        stats.skipped++;
        continue;
      }

      // Déjà enrichi en base (sauf --force)
      if (!FORCE && alreadyHasImages.has(furnitureId)) {
        stats.skipped++;
        continue;
      }

      const images = buildImages(furnitureId, p);
      imageBatch.push(...images);
      processedThisRun.add(furnitureId);
    }

    if (!DRY_RUN && imageBatch.length > 0) {
      let catInserted = 0;
      let catErrors = 0;
      // Insère par tranches de 100 pour rester sous les limites Supabase
      for (let i = 0; i < imageBatch.length; i += 100) {
        try {
          await insertImages(imageBatch.slice(i, i + 100));
          catInserted += Math.min(100, imageBatch.length - i);
        } catch (e) {
          catErrors++;
          if (catErrors <= 2) console.error(`\n   ❌ Erreur batch ${i}-${i+100}: ${e.message.slice(0, 100)}`);
          stats.errors++;
        }
      }
      stats.inserted += catInserted;
      if (catInserted > 0) console.log(`   ✓ ${catInserted} images insérées${catErrors > 0 ? ` (${catErrors} batch(s) en erreur)` : ''}`);
    } else if (DRY_RUN) {
      stats.inserted += imageBatch.length;
      console.log(`   🔍 ${imageBatch.length} images (dry-run, non insérées)`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Terminé`);
  console.log(`   Produits IKEA vus    : ${stats.total}`);
  console.log(`   Pas en base          : ${stats.notInDb}`);
  console.log(`   Déjà enrichis        : ${stats.skipped}`);
  console.log(`   Images ${DRY_RUN ? 'prévues  ' : 'insérées '}: ${stats.inserted}`);
  if (stats.errors > 0) console.log(`   Erreurs              : ${stats.errors}`);
}

main().catch(e => {
  console.error('\n[Images] Erreur fatale:', e);
  process.exit(1);
});
