/**
 * Script d'enrichissement IA des fiches meubles via OpenRouter.
 *
 * Usage:
 *   node scripts/enrich_furnitures.js              -> enrichit tous les meubles non encore enrichis
 *   node scripts/enrich_furnitures.js --force       -> re-enrichit tous les meubles (même déjà enrichis)
 *   node scripts/enrich_furnitures.js --id <uuid>   -> enrichit un meuble spécifique
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8000';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const OPENROUTER_MODEL = 'google/gemma-3-12b-it:free';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const BATCH_SIZE = 1;    // Séquentiel pour éviter le rate limit
const DELAY_MS = 10000;  // 10s entre chaque requête (max 6 RPM, limite à 8)

// ─── Args CLI ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const specificId = (() => {
  const idx = args.indexOf('--id');
  return idx !== -1 ? args[idx + 1] : null;
})();

// ─── Init clients ─────────────────────────────────────────────────────────────

if (!SUPABASE_KEY) {
  console.error('[Enrich] SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

if (!OPENROUTER_API_KEY) {
  console.error('[Enrich] OPENROUTER_API_KEY manquante. Ajoutez-la dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(title, description) {
  return `Tu es un expert en mobilier et décoration d'intérieur. Voici un meuble :

Nom : ${title}
Description brute : ${description || 'Aucune description disponible.'}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans texte autour) avec exactement ces champs :
{
  "ai_description": "Description marketing de 2-3 phrases en français, engageante et précise",
  "ai_tags": ["tag1", "tag2", "tag3", "tag4"],
  "ai_style": "Style déco principal (ex: scandinave, industriel, classique, bohème, contemporain)",
  "ai_material": "Matière principale (ex: chêne massif, métal laqué, velours, rotin)",
  "ai_category_suggestion": "Catégorie parmi: Canapés, Tables, Chaises, Lits, Armoires, Bureaux, Étagères, Fauteuils, Luminaires, Tapis, Déco, Autre",
  "ai_scene_prompt": "Courte description en anglais d'un décor idéal pour ce meuble (ex: bright Scandinavian living room, oak floor)"
}`;
}

// ─── Appel OpenRouter ─────────────────────────────────────────────────────────

async function callOpenRouter(prompt) {
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://meubly.fr',
      'X-Title': 'Meubly Enrichissement',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${errBody.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Réponse OpenRouter vide');
  return text;
}

// ─── Enrichissement d'un meuble ───────────────────────────────────────────────

async function enrichOne(furniture) {
  const { furniture_id, title, description } = furniture;

  try {
    const prompt = buildPrompt(title, description);
    const text = await callOpenRouter(prompt);

    // Nettoyer le JSON (le modèle peut ajouter des backticks)
    const jsonText = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const enriched = JSON.parse(jsonText);

    const { error } = await supabase
      .from('Furniture')
      .update({
        ai_description: enriched.ai_description || null,
        ai_tags: enriched.ai_tags || null,
        ai_style: enriched.ai_style || null,
        ai_material: enriched.ai_material || null,
        ai_category_suggestion: enriched.ai_category_suggestion || null,
        ai_scene_prompt: enriched.ai_scene_prompt || null,
        ai_enriched_at: new Date().toISOString(),
      })
      .eq('furniture_id', furniture_id);

    if (error) throw error;

    console.log(`[Enrich] ✓ "${title}"`);
    return { success: true, id: furniture_id };
  } catch (err) {
    console.error(`[Enrich] ✗ "${title}": ${err.message}`);
    return { success: false, id: furniture_id, error: err.message };
  }
}

// ─── Récupération des meubles à enrichir ──────────────────────────────────────

async function getFurnituresToEnrich() {
  if (specificId) {
    const { data, error } = await supabase
      .from('Furniture')
      .select('furniture_id, title, description')
      .eq('furniture_id', specificId);
    if (error) throw error;
    return data || [];
  }

  let query = supabase
    .from('Furniture')
    .select('furniture_id, title, description')
    .order('created_at', { ascending: false });

  if (!FORCE) {
    query = query.is('ai_enriched_at', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[Enrich] Démarrage via OpenRouter...');
  console.log(`[Enrich] Modèle: ${OPENROUTER_MODEL}`);
  console.log(`[Enrich] Mode: ${FORCE ? 'FORCE (tous)' : specificId ? `ID: ${specificId}` : 'Nouveaux seulement'}`);

  const furnitures = await getFurnituresToEnrich();

  if (furnitures.length === 0) {
    console.log('[Enrich] Aucun meuble à enrichir.');
    return;
  }

  console.log(`[Enrich] ${furnitures.length} meuble(s) à enrichir`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < furnitures.length; i += BATCH_SIZE) {
    const batch = furnitures.slice(i, i + BATCH_SIZE);
    console.log(`[Enrich] Batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(furnitures.length / BATCH_SIZE)}`);

    const results = await Promise.all(batch.map(enrichOne));

    successCount += results.filter(r => r.success).length;
    failCount += results.filter(r => !r.success).length;

    if (i + BATCH_SIZE < furnitures.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n[Enrich] Terminé — ${successCount} enrichi(s), ${failCount} erreur(s)`);
}

main().catch(err => {
  console.error('[Enrich] Erreur fatale:', err);
  process.exit(1);
});
