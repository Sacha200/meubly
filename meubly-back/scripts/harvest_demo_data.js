import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// ATTENTION : Utiliser la SERVICE_ROLE_KEY pour écrire sans restriction
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// CATALOGUE DE DONNÉES RÉALISTES
// ==========================================

const PARTNERS_DATA = [
    { name: 'Ikea', url: 'https://www.ikea.com', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Ikea_logo.svg' },
    { name: 'Maisons du Monde', url: 'https://www.maisonsdumonde.com', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Maisons_du_Monde_logo.svg' },
    { name: 'Amazon', url: 'https://www.amazon.fr', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
    { name: 'La Redoute', url: 'https://www.laredoute.fr', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/La_Redoute_logo.svg' },
    { name: 'Conforama', url: 'https://www.conforama.fr', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Conforama_logo.svg' }
];

const CATALOG = [
    {
        title: "Canapé d'angle convertible FRIHETEN",
        description: "Ce canapé se transforme rapidement et facilement en un lit spacieux. Il suffit de soulever et tirer l'assise vers soi et de rabattre le dossier.",
        cover_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop", // Canapé vert style scandinave
        category: "Canapés",
        dims: { w: 230, h: 66, d: 151 },
        offers: [
            { partner: 'Ikea', price: 499.00, title: "FRIHETEN Canapé d'angle convertible", link: "https://www.ikea.com/fr/fr/p/friheten" },
            { partner: 'Amazon', price: 549.99, title: "Canapé d'angle tissu gris", link: "https://www.amazon.fr/s?k=canape" }
        ]
    },
    {
        title: "Lit double MALM avec rangements",
        description: "Un lit épuré avec placage bois, offrant des rangements astucieux sous le sommier.",
        cover_url: "https://images.unsplash.com/photo-1505693416388-b0346efee749?q=80&w=1000&auto=format&fit=crop", // Lit moderne
        category: "Lits",
        dims: { w: 160, h: 100, d: 200 },
        offers: [
            { partner: 'Ikea', price: 299.00, title: "MALM structure de lit", link: "https://www.ikea.com" },
            { partner: 'Conforama', price: 310.00, title: "Lit adulte 160x200", link: "https://www.conforama.fr" }
        ]
    },
    {
        title: "Bureau style industriel FJÄLLBO",
        description: "Table pour ordinateur portable. Le métal et le bois massif donnent un style unique.",
        cover_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1000&auto=format&fit=crop", // Bureau industriel
        category: "Bureaux",
        dims: { w: 100, h: 75, d: 36 },
        offers: [
            { partner: 'Ikea', price: 69.99, title: "FJÄLLBO Bureau", link: "https://www.ikea.com" },
            { partner: 'Maisons du Monde', price: 89.99, title: "Bureau indus métal/bois", link: "https://www.maisonsdumonde.com" },
            { partner: 'Amazon', price: 65.00, title: "Bureau Informatique Industriel", link: "https://www.amazon.fr" }
        ]
    },
    {
        title: "Chaise scandinave NORDMYRA",
        description: "Chaise en bois massif, blanc/bouleau. Dossier incurvé pour un meilleur confort.",
        cover_url: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=1000&auto=format&fit=crop", // Chaise bois design
        category: "Chaises",
        dims: { w: 46, h: 78, d: 48 },
        offers: [
            { partner: 'Ikea', price: 49.99, title: "NORDMYRA Chaise", link: "https://www.ikea.com" },
            { partner: 'La Redoute', price: 99.00, title: "Lot de 2 chaises", link: "https://www.laredoute.fr" }
        ]
    },
    {
        title: "Armoire penderie PAX",
        description: "Armoire-penderie grand volume. Idéale pour tout ranger.",
        cover_url: "https://images.unsplash.com/photo-1551133988-ad26c02243e2?q=80&w=1000&auto=format&fit=crop", // Dressing/Armoire
        category: "Armoires",
        dims: { w: 100, h: 201, d: 58 },
        offers: [
            { partner: 'Ikea', price: 100.00, title: "PAX Caisson armoire", link: "https://www.ikea.com" },
            { partner: 'But', price: 89.99, title: "Armoire 2 portes", link: "https://www.but.fr" }
        ]
    },
    {
        title: "Bibliothèque BILLY",
        description: "La bibliothèque la plus populaire au monde. Moderne, efficace et indémodable.",
        cover_url: "https://images.unsplash.com/photo-1594620302200-9a762244a156?q=80&w=1000&auto=format&fit=crop", // Bibliothèque remplie
        category: "Bibliothèques",
        dims: { w: 80, h: 202, d: 28 },
        offers: [
            { partner: 'Ikea', price: 55.00, title: "BILLY Bibliothèque", link: "https://www.ikea.com" },
            { partner: 'Amazon', price: 59.90, title: "Bibliothèque étagère", link: "https://www.amazon.fr" },
            { partner: 'Conforama', price: 49.99, title: "Bibliothèque 5 niveaux", link: "https://www.conforama.fr" }
        ]
    },
    {
        title: "Table basse LACK",
        description: "Facile à monter, légère et facile à déplacer. Prix imbattable.",
        cover_url: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=1000&auto=format&fit=crop", // Table basse minimaliste
        category: "Tables Basses",
        dims: { w: 90, h: 45, d: 55 },
        offers: [
            { partner: 'Ikea', price: 14.99, title: "LACK Table basse", link: "https://www.ikea.com" },
            { partner: 'But', price: 19.99, title: "Table basse rectangulaire", link: "https://www.but.fr" }
        ]
    },
    {
        title: "Fauteuil STRANDMON à oreilles",
        description: "Détendez-vous dans ce fauteuil à haut dossier qui offre un soutien optimal.",
        cover_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop", // Fauteuil confortable
        category: "Fauteuils",
        dims: { w: 82, h: 101, d: 96 },
        offers: [
            { partner: 'Ikea', price: 249.00, title: "STRANDMON Fauteuil", link: "https://www.ikea.com" },
            { partner: 'La Redoute', price: 299.00, title: "Fauteuil bergère", link: "https://www.laredoute.fr" }
        ]
    },
     {
        title: "Commode 3 tiroirs MALM",
        description: "Une commode épurée qui s'intègre partout, dans la chambre ou ailleurs.",
        cover_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1000&auto=format&fit=crop", // Commode blanche
        category: "Commodes",
        dims: { w: 80, h: 78, d: 48 },
        offers: [
            { partner: 'Ikea', price: 89.99, title: "MALM Commode 3 tiroirs", link: "https://www.ikea.com" },
            { partner: 'Maisons du Monde', price: 129.00, title: "Commode scandinave", link: "https://www.maisonsdumonde.com" }
        ]
    },
    {
        title: "Table à manger JOKKMOKK",
        description: "Ensemble table et 4 chaises en pin massif, un matériau naturel qui vieillit bien.",
        cover_url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1000&auto=format&fit=crop", // Table bois
        category: "Tables à manger",
        dims: { w: 118, h: 74, d: 74 },
        offers: [
            { partner: 'Ikea', price: 169.00, title: "JOKKMOKK Ensemble", link: "https://www.ikea.com" }
        ]
    }
];

// ==========================================
// SCRIPT
// ==========================================

async function run() {
    console.log('🚀 Démarrage de l\'injection de données réalistes...\n');

    // 1. PARTENAIRES
    console.log('🛠 Gestion des partenaires...');
    const partnersMap = {};
    for (const pData of PARTNERS_DATA) {
        // Upsert partner (basé sur le nom pour éviter doublons via logique applicative si contrainte manquante)
        // Ici on check si existe
        let { data: existing } = await supabase.from('Partner').select('partner_id').eq('name', pData.name).maybeSingle();
        
        if (!existing) {
            const { data: created, error } = await supabase.from('Partner').insert([
                { name: pData.name, website_base_url: pData.url, logo_url: pData.logo }
            ]).select().single();
            if (error) { console.error('Err Partner:', error); continue; }
            partnersMap[pData.name] = created.partner_id;
        } else {
            partnersMap[pData.name] = existing.partner_id;
        }
    }
    console.log(`✅ ${Object.keys(partnersMap).length} partenaires prêts.`);

    // 2. CATÉGORIES & MEUBLES
    console.log('\n📦 Traitement du catalogue...');
    for (const item of CATALOG) {
        // A. Catégorie
        let catId = null;
        const { data: existCat } = await supabase.from('Category').select('category_id').eq('label', item.category).maybeSingle();
        
        if (existCat) {
            catId = existCat.category_id;
        } else {
            const { data: newCat } = await supabase.from('Category').insert([{ label: item.category }]).select().single();
            catId = newCat ? newCat.category_id : null;
        }

        if (!catId) { console.error(`Impossible de créer cat ${item.category}`); continue; }

        // B. Meuble
        // On check par titre si existe déjà
        const { data: existFurn } = await supabase.from('Furniture').select('furniture_id').eq('title', item.title).maybeSingle();
        let furnitureId = existFurn ? existFurn.furniture_id : null;

        if (!furnitureId) {
            // Calculer stat cache
            const minPrice = Math.min(...item.offers.map(o => o.price));
            
            const { data: newFurn, error: errF } = await supabase.from('Furniture').insert([{
                title: item.title,
                description: item.description,
                cover_url: item.cover_url,
                size_width: item.dims.w,
                size_height: item.dims.h,
                size_depth: item.dims.d,
                cached_min_price: minPrice,
                cached_nb_offers: item.offers.length
            }]).select().single();

            if (errF) { console.error('Err Furniture:', errF); continue; }
            furnitureId = newFurn.furniture_id;
            console.log(`   + Meuble créé: ${item.title}`);
        } else {
            console.log(`   ↻ Mise à jour du meuble existant: ${item.title}`);
            // Force la mise à jour de l'image et de la description
            await supabase.from('Furniture').update({
                cover_url: item.cover_url,
                description: item.description,
                cached_min_price: Math.min(...item.offers.map(o => o.price))
            }).eq('furniture_id', furnitureId);
        }

        // C. Liaison Category
        await supabase.from('FurnitureCategory').upsert({ furniture_id: furnitureId, category_id: catId }, { onConflict: 'furniture_id, category_id' });

        // D. Offres
        for (const off of item.offers) {
            const partnerId = partnersMap[off.partner];
            if (!partnerId) continue;

            const { error: errOff } = await supabase.from('offers').insert([{
                furniture_id: furnitureId,
                partner_id: partnerId,
                external_title: off.title,
                price: off.price,
                url_website: off.link,
                is_active: true
            }]);
            
            if (errOff) console.error('Err Offer:', errOff);
        }
    }

    console.log('\n✅ Injection terminée avec succès !');
}

run().catch(console.error);
