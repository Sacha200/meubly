/**
 * import_sql.mjs
 * Importe un fichier SQL dans Supabase via Node.js (pas besoin de psql)
 * 
 * Usage: node bd/ingestion/import_sql.mjs <fichier.sql> <connection_string>
 * Exemple:
 *   node bd/ingestion/import_sql.mjs bd/ingestion/ikea_seed.sql "postgresql://postgres.xxx:password@host:5432/postgres"
 */

import { readFileSync } from 'fs';
import pg from 'pg';

const [,, sqlFile, connectionString] = process.argv;

if (!sqlFile || !connectionString) {
  console.error('Usage: node import_sql.mjs <fichier.sql> "<connection_string>"');
  process.exit(1);
}

const sql = readFileSync(sqlFile, 'utf8');

// Découpe en statements individuels (séparés par ;\n)
const statements = sql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📄 ${sqlFile}`);
console.log(`   ${statements.length} statements à exécuter\n`);

// SSL : activé pour les connexions cloud (*.supabase.com), désactivé en local
const isCloud = connectionString.includes('supabase.com');
const client = new pg.Client({
  connectionString,
  ssl: isCloud ? { rejectUnauthorized: false } : false,
});

try {
  await client.connect();
  console.log('✓ Connecté à Supabase\n');

  const BATCH = 500;
  let done = 0;
  let errors = 0;

  // Exécuter en batches avec une transaction par batch
  for (let i = 0; i < statements.length; i += BATCH) {
    const batch = statements.slice(i, i + BATCH);
    try {
      await client.query('BEGIN');
      for (const stmt of batch) {
        await client.query(stmt);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      // Essayer statement par statement pour identifier le problème
      for (const stmt of batch) {
        try {
          await client.query(stmt);
        } catch (e2) {
          errors++;
          if (errors <= 5) console.error(`  ⚠️  Erreur: ${e2.message.slice(0, 80)}`);
        }
      }
    }
    done += batch.length;
    process.stdout.write(`\r   Progression: ${done}/${statements.length} (${errors} erreurs)`);
  }

  console.log(`\n\n✅ Import terminé ! ${done - errors} réussis, ${errors} erreurs`);

} finally {
  await client.end();
}
