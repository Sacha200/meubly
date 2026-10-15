import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPABASE_URL = 'http://localhost:8000';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY manquante (voir .env.example)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function escape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    const items = val.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',');
    return `ARRAY[${items}]`;
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function rowToInsert(table, row) {
  const cols = Object.keys(row).map(c => `"${c}"`).join(', ');
  const vals = Object.values(row).map(escape).join(', ');
  return `INSERT INTO public."${table}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;`;
}

async function fetchAll(table) {
  const { data, error } = await supabase.from(table).select('*');
  if (error) { console.error(`Erreur ${table}:`, error.message); return []; }
  return data || [];
}

async function main() {
  const tables = ['Partner', 'Category', 'Furniture', 'FurnitureCategory', 'offers'];
  let sql = `-- Seed généré depuis Supabase local\n-- ${new Date().toISOString()}\n\n`;
  sql += `SET session_replication_role = replica; -- désactive les FK checks temporairement\n\n`;

  for (const table of tables) {
    const rows = await fetchAll(table);
    console.log(`${table}: ${rows.length} lignes`);
    if (rows.length === 0) continue;
    sql += `-- Table: ${table} (${rows.length} lignes)\n`;
    sql += rows.map(r => rowToInsert(table, r)).join('\n');
    sql += '\n\n';
  }

  sql += `SET session_replication_role = DEFAULT;\n`;
  writeFileSync('./seed_cloud.sql', sql, 'utf8');
  console.log('\n✓ seed_cloud.sql généré avec succès !');
}

main();
