/**
 * cloud_to_local.mjs
 * Synchronise les données catalogue depuis le Supabase LOCAL vers le cloud Supabase.
 *
 * Prérequis :
 *   1. Avoir appliqué cloud_migration.sql dans le SQL Editor du dashboard Supabase cloud
 *   2. Le Supabase local doit tourner (docker compose up)
 *
 * Usage :
 *   CLOUD_URL=https://xxx.supabase.co \
 *   CLOUD_SERVICE_ROLE_KEY=eyJ... \
 *   node cloud_to_local.mjs
 *
 * Pour obtenir le service_role key :
 *   Supabase dashboard > Settings > API > "service_role" (secret)
 */

import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

// ── Configuration ────────────────────────────────────────────────────────────
const LOCAL_DB_URL = process.env.LOCAL_DB_URL
  || 'postgresql://postgres:postgres@localhost:5432/postgres';

const CLOUD_URL = process.env.CLOUD_URL;
const CLOUD_SERVICE_ROLE_KEY = process.env.CLOUD_SERVICE_ROLE_KEY;

if (!CLOUD_URL || !CLOUD_SERVICE_ROLE_KEY) {
  console.error('❌  Variables manquantes. Exemple d\'utilisation :');
  console.error('');
  console.error('  CLOUD_URL=https://rlxyptqvtpdhrdpdoiwy.supabase.co \\');
  console.error('  CLOUD_SERVICE_ROLE_KEY=eyJ... \\');
  console.error('  node cloud_to_local.mjs');
  console.error('');
  console.error('  (service_role key : Supabase dashboard > Settings > API)');
  process.exit(1);
}

const BATCH_SIZE = 200;

const supabase = createClient(CLOUD_URL, CLOUD_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Ordre d'insertion (respect des FK) ───────────────────────────────────────
const TABLES = [
  { local: 'category',          cloud: 'category',          pk: 'category_id' },
  { local: 'partner',           cloud: 'partner',           pk: 'partner_id' },
  { local: 'furniture',         cloud: 'furniture',         pk: 'furniture_id' },
  { local: 'offer',             cloud: 'offer',             pk: 'offer_id' },
  { local: 'furniture_category',cloud: 'furniture_category',pk: ['furniture_id','category_id'] },
  { local: 'furniture_image',   cloud: 'furniture_image',   pk: 'image_id' },
  { local: 'partner_product',   cloud: 'partner_product',   pk: 'partner_product_id' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function fetchAll(client, table) {
  const res = await client.query(`SELECT * FROM "${table}"`);
  return res.rows;
}

async function upsertBatch(table, rows, pk) {
  if (rows.length === 0) return;
  const onConflict = Array.isArray(pk) ? pk.join(',') : pk;
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict, ignoreDuplicates: false });
  if (error) throw new Error(`[${table}] ${error.message}`);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  console.log('✅  Connecté à la base locale');

  for (const { local, cloud, pk } of TABLES) {
    process.stdout.write(`⏳  ${local} ... `);
    let rows;
    try {
      rows = await fetchAll(client, local);
    } catch (e) {
      console.log(`⚠️   table locale "${local}" introuvable, ignorée.`);
      continue;
    }

    if (rows.length === 0) {
      console.log('(vide)');
      continue;
    }

    const batches = chunk(rows, BATCH_SIZE);
    for (let i = 0; i < batches.length; i++) {
      process.stdout.write(`\r⏳  ${local} ... batch ${i + 1}/${batches.length}`);
      await upsertBatch(cloud, batches[i], pk);
    }
    console.log(`\r✅  ${local} — ${rows.length} lignes importées       `);
  }

  await client.end();
  console.log('\n🎉  Import terminé !');
}

main().catch(err => {
  console.error('\n❌  Erreur :', err.message);
  process.exit(1);
});
