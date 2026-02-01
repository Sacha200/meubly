import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Charger les variables d'environnement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Utiliser la clé SERVICE_ROLE pour contourner RLS si besoin

if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Démarrage du seed (remplissage de données)...');

  // 1. Créer les Partenaires
  console.log('Creating Partners...');
  const { data: partners, error: pError } = await supabase
    .from('Partner')
    .insert([
      { name: 'Ikea', website_base_url: 'https://www.ikea.com', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Ikea_logo.svg' },
      { name: 'Maisons du Monde', website_base_url: 'https://www.maisonsdumonde.com', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Maisons_du_Monde_logo.svg' }
    ])
    .select();

  if (pError) throw pError;
  const ikea = partners.find(p => p.name === 'Ikea');
  const mdm = partners.find(p => p.name === 'Maisons du Monde');

  // 2. Créer les Catégories
  console.log('Creating Categories...');
  const { data: categories, error: cError } = await supabase
    .from('Category')
    .insert([
      { label: 'Salon', cover_url: 'https://images.unsplash.com/photo-1567016432779-094069958ea5' },
      { label: 'Bureau', cover_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd' }
    ])
    .select();

  if (cError) throw cError;
  const salon = categories.find(c => c.label === 'Salon');
  const bureau = categories.find(c => c.label === 'Bureau');

  // 2b. Sous-catégorie
  const { data: subCats, error: scError } = await supabase
    .from('Category')
    .insert([
      { label: 'Canapés', parent_id: salon.category_id, cover_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc' }
    ])
    .select();
  if (scError) throw scError;
  const canapeCat = subCats[0];


  // 3. Créer des Meubles
  console.log('Creating Furniture...');
  const { data: furnitures, error: fError } = await supabase
    .from('Furniture')
    .insert([
      { 
        title: 'Canapé Friheten', 
        description: 'Canapé convertible 3 places avec rangement.', 
        cover_url: 'https://www.ikea.com/fr/fr/images/products/friheten-canape-convertible-3-places-skiftebo-gris-fonce__0833831_pe778125_s5.jpg',
        cached_min_price: 499.00,
        cached_nb_offers: 1
      },
      { 
        title: 'Bureau Style Industriel', 
        description: 'Bureau en bois massif et métal noir.', 
        cover_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd',
        cached_min_price: 159.99,
        cached_nb_offers: 2,
        size_width: 120,
        size_depth: 60
      }
    ])
    .select();

  if (fError) throw fError;
  const fFriheten = furnitures.find(f => f.title === 'Canapé Friheten');
  const fBureau = furnitures.find(f => f.title === 'Bureau Style Industriel');

  // 4. Lier Meubles <-> Catégories
  console.log('Linking Furniture to Categories...');
  await supabase.from('FurnitureCategory').insert([
    { furniture_id: fFriheten.furniture_id, category_id: salon.category_id }, // Friheten -> Salon
    { furniture_id: fFriheten.furniture_id, category_id: canapeCat.category_id }, // Friheten -> Canapé
    { furniture_id: fBureau.furniture_id, category_id: bureau.category_id } // Bureau -> Bureau
  ]);

  // 5. Créer des Offres
  console.log('Creating Offers...');
  await supabase.from('offers').insert([
    {
      furniture_id: fFriheten.furniture_id,
      partner_id: ikea.partner_id,
      external_title: 'FRIHETEN Canapé convertible',
      url_website: 'https://www.ikea.com/fr/fr/p/friheten',
      price: 499.00,
      is_active: true
    },
    {
      furniture_id: fBureau.furniture_id,
      partner_id: mdm.partner_id,
      external_title: 'Bureau Wayne',
      url_website: 'https://www.maisonsdumonde.com/FR/fr/p/bureau',
      price: 189.00,
      is_active: true
    },
    {
      furniture_id: fBureau.furniture_id,
      partner_id: ikea.partner_id,
      external_title: 'Bureau Similaire Ikea',
      url_website: 'https://www.ikea.com/bureau',
      price: 159.99,
      is_active: true
    }
  ]);

  console.log('✅ Base de données peuplée avec succès !');
}

seed().catch(e => console.error(e));
