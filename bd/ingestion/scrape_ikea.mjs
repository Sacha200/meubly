/**
 * scrape_ikea.mjs
 * 
 * Scrape les produits IKEA France via leur API non-documentée et génère un fichier SQL
 * prêt à être importé dans la base de données Meubly.
 * 
 * Usage:
 *   node scrape_ikea.mjs                    # toutes les catégories meubles
 *   node scrape_ikea.mjs --cats fu003,fu002  # catégories spécifiques
 *   node scrape_ikea.mjs --limit 50          # max 50 produits par catégorie
 *   node scrape_ikea.mjs --dry-run           # affiche sans écrire
 * 
 * Sortie: ikea_seed.sql (inserts pour Partner, Category, Furniture, FurnitureCategory, offers)
 */

import { writeFileSync } from 'fs';

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = 'https://sik.search.blue.cdtapps.com/fr/fr';
const IKEA_PARTNER_ID = '8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1'; // ID existant dans le seed
const PAGE_SIZE = 1000; // l'API accepte jusqu'à 1000 produits par requête
const DELAY_MS = 400;  // délai entre requêtes (politesse)

// Parse les arguments CLI
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const MAX_PER_CAT = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;
const catsArg = args.find(a => a.startsWith('--cats='));

// ── Catégories IKEA France (meubles & maison) ─────────────────────────────────
const ALL_CATEGORIES = [
  { id: 'fu003', label: 'Canapés & fauteuils',             parent: null },
  { id: 'fu002', label: 'Tables & chaises',                parent: null },
  { id: 'fu004', label: 'Bureaux & chaises de bureau',     parent: null },
  { id: 'st002', label: 'Bibliothèques & étagères',        parent: null },
  { id: 'bm003', label: 'Lits',                            parent: null },
  { id: 'od003', label: 'Mobilier de jardin',              parent: null },
  { id: 'st004', label: 'Commodes & caissons à tiroirs',   parent: null },
  { id: 'st003', label: 'Rangements bureau & salon',       parent: null },
  { id: 'ba001', label: 'Salle de bain',                   parent: null },
  { id: 'li001', label: 'Luminaires & éclairage',          parent: null },
  { id: 'de001', label: 'Décoration',                      parent: null },
  { id: 'tl001', label: 'Linge de maison & textile',       parent: null },
  { id: 'tl004', label: 'Linge de lit',                    parent: 'tl001' },
  { id: 'tl002', label: 'Rideaux, tringles & stores',      parent: 'tl001' },
  { id: 'ka001', label: 'Cuisine & électroménager',        parent: null },
  { id: 'kt001', label: 'Arts de la table & vaisselle',    parent: 'ka001' },
  { id: 'bc001', label: 'Bébé & enfant',                   parent: null },
  { id: 'od001', label: 'Mobilier & accessoires extérieur',parent: 'od003' },
  { id: 'pp001', label: 'Plantes & pots',                  parent: 'de001' },
  { id: 'bm002', label: 'Matelas',                         parent: 'bm003' },
  { id: 'fu005', label: 'Dessertes & îlots',               parent: 'fu002' },
];

const SELECTED_CATS = catsArg
  ? ALL_CATEGORIES.filter(c => catsArg.split('=')[1].split(',').includes(c.id))
  : ALL_CATEGORIES;

// ── Utilitaires ───────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    const items = val.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',');
    return `ARRAY[${items}]`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function insert(table, row) {
  const cols = Object.keys(row).map(c => `"${c}"`).join(', ');
  const vals = Object.values(row).map(escapeSql).join(', ');
  return `INSERT INTO public."${table}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;`;
}

// ── Fetch avec retry ──────────────────────────────────────────────────────────
// L'API IKEA ne supporte pas de pagination par offset.
// On utilise size=1000 pour tout récupérer en une requête (max 1000/catégorie).
async function fetchProducts(categoryId) {
  const url = `${API_BASE}/product-list-page?category=${categoryId}&size=${PAGE_SIZE}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
      return r.json();
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(1000 * (attempt + 1));
    }
  }
}

// ── Transformation produit IKEA → Furniture + offer + images ─────────────────
function transformProduct(p, categoryId) {
  const furnitureId = uuidv4();
  
  // Titre complet
  const title = [p.name, p.typeName, p.validDesignText]
    .filter(Boolean)
    .join(' – ')
    .slice(0, 200);
  
  // Dimensions (souvent absentes dans l'API liste, à 0 par défaut)
  const width = p.itemMeasureReferenceText?.match(/(\d+)\s*cm\s*[Ll]/)?.[1] ?? null;
  const depth = p.itemMeasureReferenceText?.match(/[×x]\s*(\d+)\s*cm/)?.[1] ?? null;
  const height = null;
  
  // Prix
  const price = p.salesPrice?.numeral ?? null;
  
  const furniture = {
    furniture_id: furnitureId,
    title,
    description: p.mainImageAlt ?? null,
    cover_url: p.mainImageUrl ?? null,
    size_width: width ? parseFloat(width) : null,
    size_height: height,
    size_depth: depth ? parseFloat(depth) : null,
    cached_min_price: price,
    cached_nb_offers: 1,
    created_at: new Date().toISOString(),
    ai_description: null,
    ai_tags: null,
    ai_style: null,
    ai_material: null,
    ai_category_suggestion: null,
    ai_scene_prompt: null,
    ai_enriched_at: null,
  };
  
  const offer = {
    offer_id: uuidv4(),
    external_title: title,
    url_website: p.pipUrl ?? null,
    price,
    is_active: true,
    updated_at: new Date().toISOString(),
    furniture_id: furnitureId,
    partner_id: IKEA_PARTNER_ID,
  };
  
  const partnerProduct = {
    partner_product_id: uuidv4(),
    partner_id: IKEA_PARTNER_ID,
    external_id: p.id ?? p.itemNo,
    external_url: p.pipUrl ?? null,
    external_title: title,
    furniture_id: furnitureId,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Images multiples depuis allProductImage
  // Ordre d'affichage : MAIN → CONTEXT → FUNCTIONAL → QUALITY
  const TYPE_ORDER = {
    MAIN_PRODUCT_IMAGE: 0,
    CONTEXT_PRODUCT_IMAGE: 1,
    FUNCTIONAL_PRODUCT_IMAGE: 2,
    QUALITY_PRODUCT_IMAGE: 3,
  };

  const rawImages = Array.isArray(p.allProductImage) ? p.allProductImage : [];
  // Dédoublonnage par URL
  const seen = new Set();
  const images = rawImages
    .filter(img => img?.url && !seen.has(img.url) && seen.add(img.url))
    .sort((a, b) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9))
    .map((img, idx) => ({
      image_id: uuidv4(),
      furniture_id: furnitureId,
      url: img.url,
      alt_text: img.altText ?? null,
      type: img.type ?? null,
      position: idx,
      source: 'ikea',
      is_cover: img.type === 'MAIN_PRODUCT_IMAGE' || idx === 0,
      created_at: new Date().toISOString(),
    }));
  
  return { furniture, offer, partnerProduct, images };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🛋️  Scraper IKEA France`);
  console.log(`   ${SELECTED_CATS.length} catégories | max ${MAX_PER_CAT === Infinity ? '∞' : MAX_PER_CAT} produits/cat`);
  console.log(`   Mode: ${isDryRun ? 'dry-run (pas d\'écriture)' : 'production'}\n`);
  
  // UUIDs des catégories (génération stable basée sur l'ID IKEA)
  const catUuids = {};
  for (const cat of SELECTED_CATS) {
    catUuids[cat.id] = uuidv4();
  }
  
  let sqlLines = [
    `-- Seed IKEA généré par scrape_ikea.mjs`,
    `-- ${new Date().toISOString()}`,
    `-- ${SELECTED_CATS.length} catégories`,
    ``,
    `SET session_replication_role = replica;`,
    ``,
    `-- ═══════════════════════════════════════`,
    `-- CATÉGORIES IKEA`,
    `-- ═══════════════════════════════════════`,
  ];
  
  // Inserts des catégories
  for (const cat of SELECTED_CATS) {
    const parentUuid = cat.parent ? catUuids[cat.parent] ?? null : null;
    sqlLines.push(insert('Category', {
      category_id: catUuids[cat.id],
      label: cat.label,
      cover_url: null,
      parent_id: parentUuid,
    }));
  }
  
  sqlLines.push(``, `-- ═══════════════════════════════════════`);
  sqlLines.push(`-- PRODUITS, OFFRES & PARTENARIAT`);
  sqlLines.push(`-- ═══════════════════════════════════════`);
  
  let totalProducts = 0;
  let totalErrors = 0;
  
  for (const cat of SELECTED_CATS) {
    console.log(`\n📂 ${cat.label} (${cat.id})`);
    
    let catTotal = 0;
    
    sqlLines.push(``, `-- Catégorie: ${cat.label} (${cat.id})`);
    
    try {
      const data = await fetchProducts(cat.id);
      const products = data.productListPage?.productWindow ?? [];
      const total = data.productListPage?.productCount ?? 0;
      
      console.log(`   Total disponible: ${total} produits (récupérés: ${products.length})`);
      
      const toInsert = MAX_PER_CAT === Infinity ? products : products.slice(0, MAX_PER_CAT);
      
      for (const p of toInsert) {
        const { furniture, offer, partnerProduct, images } = transformProduct(p, cat.id);
        
        sqlLines.push(insert('Furniture', furniture));
        sqlLines.push(insert('FurnitureCategory', {
          furniture_id: furniture.furniture_id,
          category_id: catUuids[cat.id],
        }));
        sqlLines.push(insert('offers', offer));
        sqlLines.push(insert('PartnerProduct', partnerProduct));

        // Images multiples
        for (const img of images) {
          sqlLines.push(insert('FurnitureImage', img));
        }
        
        catTotal++;
      }
      
    } catch (e) {
      console.error(`\n   ❌ Erreur:`, e.message);
      totalErrors++;
    }
    
    console.log(`\n   ✓ ${catTotal} produits insérés`);
    totalProducts += catTotal;
  }
  
  sqlLines.push(``, `SET session_replication_role = DEFAULT;`);
  sqlLines.push(``, `-- Fin du seed IKEA`);
  sqlLines.push(`-- Total: ${totalProducts} produits, ${totalErrors} erreurs`);
  
  const sql = sqlLines.join('\n');
  
  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Total: ${totalProducts} produits scrappés`);
  if (totalErrors > 0) console.log(`⚠️  Erreurs: ${totalErrors}`);
  
  if (!isDryRun) {
    const outFile = './bd/ingestion/ikea_seed.sql';
    writeFileSync(outFile, sql, 'utf8');
    console.log(`📄 Fichier généré: ${outFile} (${(sql.length / 1024).toFixed(0)} Ko)`);
  } else {
    console.log(`\n[dry-run] SQL non écrit. Aperçu:\n`);
    console.log(sqlLines.slice(0, 30).join('\n'));
  }
}

main().catch(e => { console.error('Erreur fatale:', e); process.exit(1); });
