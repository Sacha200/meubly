import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Script simplifié : Crée des offres pour TOUS les meubles en utilisant les données des fournisseurs
 * Stratégie : Pour chaque meuble, on cherche des produits similaires chez les fournisseurs (même catégorie)
 */

async function syncAllOffers() {
    console.log('🔄 Synchronisation simplifiée des offres...\n');
    
    const providers = [
        { table: 'Amazon', website: 'Amazon' },
        { table: 'Ikea', website: 'IKEA' },
        { table: 'Manomano', website: 'ManoMano' },
        { table: 'But', website: 'But' }
    ];
    
    let totalInserted = 0;
    
    // 1. Récupérer tous les meubles
    console.log('📦 Récupération des meubles...');
    const { data: furnitures } = await supabase
        .from('Furniture')
        .select('furniture_id, name, category_id');
    
    console.log(`✅ ${furnitures.length} meubles trouvés\n`);
    
    // 2. Pour chaque fournisseur
    for (const provider of providers) {
        console.log(`\n📊 Traitement de ${provider.website}...`);
        
        // Récupérer tous les produits du fournisseur
        const { data: products } = await supabase
            .from(provider.table)
            .select('*');
        
        if (!products || products.length === 0) {
            console.log(`   ⚠️  Aucun produit trouvé`);
            continue;
        }
        
        console.log(`   📦 ${products.length} produits disponibles`);
        
        // Grouper les produits par catégorie
        const productsByCategory = {};
        products.forEach(p => {
            if (!productsByCategory[p.category_id]) {
                productsByCategory[p.category_id] = [];
            }
            productsByCategory[p.category_id].push(p);
        });
        
        let inserted = 0;
        
        // 3. Pour chaque meuble, créer une offre avec un produit de la même catégorie
        for (const furniture of furnitures) {
            const categoryProducts = productsByCategory[furniture.category_id] || [];
            
            if (categoryProducts.length === 0) {
                continue; // Pas de produit dans cette catégorie
            }
            
            // Prendre un produit aléatoire de la même catégorie
            const randomProduct = categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
            
            // Vérifier si l'offre existe déjà
            const { data: existing } = await supabase
                .from('offers')
                .select('id')
                .eq('furnitures_id', furniture.furniture_id)
                .eq('website', provider.website)
                .maybeSingle();
            
            if (existing) {
                continue; // Offre déjà existante
            }
            
            // Créer l'offre
            const offer = {
                furnitures_id: furniture.furniture_id,
                price: parseFloat(randomProduct.price),
                name_furniture: randomProduct.description || furniture.name,
                website: provider.website,
                logo_website: randomProduct.logo || null,
                url_website: randomProduct.url_website || `https://${provider.website.toLowerCase()}.fr/product/${furniture.furniture_id}`,
                created_at: new Date().toISOString().split('T')[0]
            };
            
            const { error } = await supabase
                .from('offers')
                .insert([offer]);
            
            if (!error) {
                inserted++;
            }
        }
        
        console.log(`   ✅ ${inserted} offres créées pour ${provider.website}`);
        totalInserted += inserted;
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ TOTAL: ${totalInserted} offres créées`);
    console.log('='.repeat(60));
}

syncAllOffers()
    .then(() => {
        console.log('\n✅ Synchronisation terminée !');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erreur:', error);
        process.exit(1);
    });
