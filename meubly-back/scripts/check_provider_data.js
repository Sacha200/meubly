import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔑 Utilisation de la clé SERVICE_ROLE pour bypasser RLS...\n');

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkProviderTables() {
    const tables = ['amazon', 'ikea', 'manomano', 'but'];
    
    for (const table of tables) {
        console.log(`\n📦 Table: ${table}`);
        console.log('─'.repeat(50));
        
        const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
            .limit(3);
        
        if (error) {
            console.log(`❌ Erreur: ${error.message}`);
        } else {
            console.log(`✅ Nombre de lignes: ${count}`);
            if (data && data.length > 0) {
                console.log(`📝 Colonnes: ${Object.keys(data[0]).join(', ')}`);
                console.log(`\n📄 Exemples (${Math.min(3, data.length)} premiers):`);
                data.forEach((row, idx) => {
                    console.log(`\n   ${idx + 1}. ${JSON.stringify(row, null, 2).split('\n').join('\n   ')}`);
                });
            }
        }
    }
}

checkProviderTables().then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
});
