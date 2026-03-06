/**
 * Script de correction des images meubles via Unsplash Search API.
 *
 * Usage:
 *   node scripts/fix_furniture_images.js              -> corrige tous les meubles
 *   node scripts/fix_furniture_images.js --force       -> force même ceux déjà enrichis
 *   node scripts/fix_furniture_images.js --id <uuid>   -> corrige un meuble spécifique
 *   node scripts/fix_furniture_images.js --dry-run     -> affiche sans modifier la base
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8000';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

const DELAY_MS = 1200; // 1.2s entre requêtes (max 50 req/h sur le plan demo)

// ─── Mots-clés par catégorie pour des recherches précises ─────────────────────

const CATEGORY_KEYWORDS = {
  'Canapés':     'sofa couch living room',
  'Tables':      'dining table wood interior',
  'Chaises':     'chair furniture design',
  'Lits':        'bed bedroom interior',
  'Armoires':    'wardrobe closet bedroom furniture',
  'Bureaux':     'desk office furniture',
  'Étagères':    'bookshelf shelving furniture',
  'Fauteuils':   'armchair lounge chair',
  'Luminaires':  'lamp light interior',
  'Tapis':       'rug carpet interior',
  'Déco':        'home decor interior',
  'Autre':       'furniture interior design',
};

// ─── Args CLI ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const specificId = (() => {
  const idx = args.indexOf('--id');
  return idx !== -1 ? args[idx + 1] : null;
})();

// ─── Validation ───────────────────────────────────────────────────────────────

if (!SUPABASE_KEY) { console.error('[Images] SUPABASE_SERVICE_ROLE_KEY manquante'); process.exit(1); }
if (!UNSPLASH_KEY) { console.error('[Images] UNSPLASH_ACCESS_KEY manquante'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Recherche Unsplash ───────────────────────────────────────────────────────

async function searchUnsplash(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&content_filter=high`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Unsplash ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const results = data.results || [];

  if (results.length === 0) return null;

  // Prend une photo aléatoire parmi les 5 premiers résultats (plus de variété)
  const pick = results[Math.floor(Math.random() * Math.min(3, results.length))];
  return `${pick.urls.raw}&w=800&h=600&fit=crop&q=80`;
}

// ─── Construction de la requête de recherche ─────────────────────────────────

function buildSearchQuery(furniture) {
  const { title, ai_category_suggestion, ai_material, ai_style } = furniture;

  // Priorité 1 : catégorie enrichie + matière/style
  if (ai_category_suggestion && ai_category_suggestion !== 'Autre') {
    const base = CATEGORY_KEYWORDS[ai_category_suggestion] || ai_category_suggestion;
    const extra = [ai_material, ai_style].filter(Boolean).join(' ');
    return extra ? `${base} ${extra}` : base;
  }

  // Priorité 2 : titre simplifié (premiers mots significatifs)
  const cleaned = title
    .toLowerCase()
    .replace(/\b(cm|mm|x|\d+)\b/g, '')
    .replace(/[^a-zàâéèêëîïôùûüç\s]/gi, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ');

  return `${cleaned} furniture interior`;
}

// ─── Récupération des meubles ─────────────────────────────────────────────────

async function getFurnitures() {
  if (specificId) {
    const { data, error } = await supabase
      .from('Furniture')
      .select('furniture_id, title, cover_url, ai_category_suggestion, ai_material, ai_style')
      .eq('furniture_id', specificId);
    if (error) throw error;
    return data || [];
  }

  const { data, error } = await supabase
    .from('Furniture')
    .select('furniture_id, title, cover_url, ai_category_suggestion, ai_material, ai_style')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[Images] Correction des images via Unsplash${DRY_RUN ? ' (DRY RUN)' : ''}...`);

  const furnitures = await getFurnitures();
  console.log(`[Images] ${furnitures.length} meuble(s) à traiter`);

  let updated = 0;
  let failed = 0;

  for (const furniture of furnitures) {
    const { furniture_id, title } = furniture;
    const query = buildSearchQuery(furniture);

    try {
      const newUrl = await searchUnsplash(query);

      if (!newUrl) {
        console.log(`[Images] ~ "${title}" — aucun résultat pour "${query}"`);
        failed++;
      } else if (DRY_RUN) {
        console.log(`[Images] 🔍 "${title}"\n         query: "${query}"\n         url: ${newUrl}`);
        updated++;
      } else {
        const { error } = await supabase
          .from('Furniture')
          .update({ cover_url: newUrl })
          .eq('furniture_id', furniture_id);

        if (error) throw error;
        console.log(`[Images] ✓ "${title}" — query: "${query}"`);
        updated++;
      }
    } catch (err) {
      console.error(`[Images] ✗ "${title}": ${err.message}`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n[Images] Terminé — ${updated} ${DRY_RUN ? 'prévisualisé(s)' : 'mis à jour'}, ${failed} erreur(s)`);
}

main().catch(err => {
  console.error('[Images] Erreur fatale:', err);
  process.exit(1);
});
