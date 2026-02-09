import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Charger les variables d'environnement
// - Docker: injectées par docker-compose
// - Local: on tente d'abord .env dans le cwd (meubly-back), puis .env à la racine du repo
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Compat env:
// - supabase-js attends l'URL du projet (Kong en local): http://localhost:8000
// - clés: SERVICE_ROLE_KEY (stack supabase) ou SUPABASE_SERVICE_ROLE_KEY (naming app)
const supabaseUrl =
  process.env.SUPABASE_URL
  || process.env.SUPABASE_PUBLIC_URL
  || process.env.API_EXTERNAL_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SERVICE_ROLE_KEY; // Utiliser la clé SERVICE_ROLE pour contourner RLS si besoin

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Erreur: variables Supabase manquantes. Attendu:\n'
    + '- URL: SUPABASE_URL (ou SUPABASE_PUBLIC_URL / API_EXTERNAL_URL)\n'
    + '- KEY: SUPABASE_SERVICE_ROLE_KEY (ou SERVICE_ROLE_KEY)\n'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function toNumberOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function readSeedFile() {
  const seedFile =
    process.env.SEED_OFFERS_FILE
    || path.resolve(__dirname, 'seed_offers.json');

  const fallbackFile = path.resolve(__dirname, 'seed_offers.example.json');

  try {
    const raw = await fs.readFile(seedFile, 'utf-8');
    return { seed: JSON.parse(raw), seedFile };
  } catch {
    const raw = await fs.readFile(fallbackFile, 'utf-8');
    return { seed: JSON.parse(raw), seedFile: fallbackFile };
  }
}

async function getOrCreatePartner(partner) {
  const seedPartnerId = partner.partner_id ?? null;

  const byId = seedPartnerId
    ? await supabase
      .from('Partner')
      .select('*')
      .eq('partner_id', seedPartnerId)
      .limit(1)
      .maybeSingle()
    : { data: null, error: null };
  if (byId.error) throw byId.error;

  const byName = !byId.data
    ? await supabase
      .from('Partner')
      .select('*')
      .eq('name', partner.name)
      .limit(1)
      .maybeSingle()
    : { data: null, error: null };
  if (byName.error) throw byName.error;

  const existing = byId.data || byName.data;
  // Important: ne JAMAIS tenter de modifier une PK existante (FK offers_partner_id_fkey).
  const updatePayload = {
    name: partner.name,
    website_base_url: partner.website_base_url ?? null,
    logo_url: partner.logo_url ?? null,
    is_active: partner.is_active ?? true,
  };
  const insertPayload = {
    ...(seedPartnerId ? { partner_id: seedPartnerId } : {}),
    ...updatePayload,
  };

  if (existing) {
    // Si la seed fournit un partner_id différent de celui déjà en base, on garde l'existant.
    const { data, error } = await supabase
      .from('Partner')
      .update(updatePayload)
      .eq('partner_id', existing.partner_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('Partner')
    .insert([insertPayload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getOrCreateFurniture(furniture) {
  const seedFurnitureId = furniture.furniture_id ?? null;

  const byId = seedFurnitureId
    ? await supabase
      .from('Furniture')
      .select('*')
      .eq('furniture_id', seedFurnitureId)
      .limit(1)
      .maybeSingle()
    : { data: null, error: null };
  if (byId.error) throw byId.error;

  const byTitle = !byId.data
    ? await supabase
      .from('Furniture')
      .select('*')
      .eq('title', furniture.title)
      .limit(1)
      .maybeSingle()
    : { data: null, error: null };
  if (byTitle.error) throw byTitle.error;

  const existing = byId.data || byTitle.data;
  // Important: ne JAMAIS tenter de modifier une PK existante (FK offers_furniture_id_fkey).
  const updatePayload = {
    title: furniture.title,
    description: furniture.description ?? null,
    cover_url: furniture.cover_url ?? null,
    size_width: toNumberOrNull(furniture.size_width),
    size_height: toNumberOrNull(furniture.size_height),
    size_depth: toNumberOrNull(furniture.size_depth),
    cached_min_price: furniture.cached_min_price ?? null,
    cached_nb_offers: furniture.cached_nb_offers ?? 0,
  };
  const insertPayload = {
    ...(seedFurnitureId ? { furniture_id: seedFurnitureId } : {}),
    ...updatePayload,
  };

  if (existing) {
    const { data, error } = await supabase
      .from('Furniture')
      .update(updatePayload)
      .eq('furniture_id', existing.furniture_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('Furniture')
    .insert([insertPayload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function upsertOffer({
  offer_id,
  furniture_id,
  partner_id,
  external_title,
  url_website,
  price,
  is_active,
  updated_at,
}) {
  if (!url_website) {
    throw new Error('Offer.url_website est requis (URL de la page partenaire).');
  }

  const existingById = offer_id
    ? await supabase
      .from('offers')
      .select('*')
      .eq('offer_id', offer_id)
      .limit(1)
      .maybeSingle()
    : { data: null, error: null };
  if (existingById.error) throw existingById.error;

  const existingByComposite = !existingById.data
    ? await supabase
      .from('offers')
      .select('*')
      .eq('furniture_id', furniture_id)
      .eq('partner_id', partner_id)
      .eq('url_website', url_website)
      .limit(1)
      .maybeSingle()
    : { data: null, error: null };
  if (existingByComposite.error) throw existingByComposite.error;

  const existing = existingById.data || existingByComposite.data;

  // Important: ne JAMAIS tenter de modifier une PK existante.
  const updatePayload = {
    external_title: external_title ?? null,
    url_website,
    price: toNumberOrNull(price),
    is_active: is_active ?? true,
    updated_at: updated_at ?? new Date().toISOString(),
    furniture_id,
    partner_id,
  };
  const insertPayload = {
    ...(offer_id ? { offer_id } : {}),
    ...updatePayload,
  };

  if (existing) {
    const { data, error } = await supabase
      .from('offers')
      .update(updatePayload)
      .eq('offer_id', existing.offer_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('offers')
    .insert([insertPayload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function recomputeFurnitureCache(furnitureId) {
  const { data: offers, error } = await supabase
    .from('offers')
    .select('price')
    .eq('furniture_id', furnitureId)
    .eq('is_active', true);
  if (error) throw error;

  const prices = (offers || [])
    .map(o => toNumberOrNull(o.price))
    .filter(n => typeof n === 'number');

  const cached_nb_offers = prices.length;
  const cached_min_price = cached_nb_offers > 0 ? Math.min(...prices) : null;

  const { error: uErr } = await supabase
    .from('Furniture')
    .update({ cached_nb_offers, cached_min_price })
    .eq('furniture_id', furnitureId);
  if (uErr) throw uErr;
}

async function seed() {
  const { seed: seedData, seedFile } = await readSeedFile();
  console.log(`🌱 Démarrage du seed (offres) depuis: ${seedFile}`);

  // Format attendu: clés alignées sur les tables (Partner, Furniture, offers).
  // Par tolérance, on supporte encore l'ancien format (partners/furnitures + offers avec partner_name/furniture_title).
  const partnerRows = seedData.Partner || seedData.partners || [];
  const furnitureRows = seedData.Furniture || seedData.furnitures || [];
  const offerRows = seedData.offers || [];

  // Mapping "seed UUID" -> "UUID réel en base" (utile si la base contient déjà d'autres UUID)
  const partnerIdMap = new Map();
  const furnitureIdMap = new Map();

  const partnersById = new Map();
  const partnersByName = new Map();
  for (const p of partnerRows) {
    const created = await getOrCreatePartner(p);
    partnersByName.set(created.name, created);
    partnersById.set(created.partner_id, created);
    if (p.partner_id) {
      partnerIdMap.set(p.partner_id, created.partner_id);
    }
  }

  const furnituresById = new Map();
  const furnituresByTitle = new Map();
  for (const f of furnitureRows) {
    const created = await getOrCreateFurniture(f);
    furnituresByTitle.set(created.title, created);
    furnituresById.set(created.furniture_id, created);
    if (f.furniture_id) {
      furnitureIdMap.set(f.furniture_id, created.furniture_id);
    }
  }

  const touchedFurnitureIds = new Set();

  console.log('Creating/Updating offers...');
  for (const o of offerRows) {
    // Nouveau format (schema-only): o contient furniture_id + partner_id
    // Ancien format: o contient furniture_title + partner_name
    let furnitureId = o.furniture_id ? (furnitureIdMap.get(o.furniture_id) || o.furniture_id) : null;
    let partnerId = o.partner_id ? (partnerIdMap.get(o.partner_id) || o.partner_id) : null;

    if (!furnitureId && o.furniture_title) {
      const f = furnituresByTitle.get(o.furniture_title) || await getOrCreateFurniture({ title: o.furniture_title });
      furnituresByTitle.set(f.title, f);
      furnituresById.set(f.furniture_id, f);
      furnitureId = f.furniture_id;
    }
    if (!partnerId && o.partner_name) {
      const p = partnersByName.get(o.partner_name) || await getOrCreatePartner({ name: o.partner_name });
      partnersByName.set(p.name, p);
      partnersById.set(p.partner_id, p);
      partnerId = p.partner_id;
    }

    if (!furnitureId || !partnerId) {
      throw new Error(
        'Format seed invalide pour une offre. Requis (schema-only): furniture_id + partner_id. '
        + 'Ou (legacy): furniture_title + partner_name.'
      );
    }

    await upsertOffer({
      offer_id: o.offer_id,
      furniture_id: furnitureId,
      partner_id: partnerId,
      external_title: o.external_title,
      url_website: o.url_website,
      price: o.price,
      is_active: o.is_active ?? true,
      updated_at: o.updated_at,
    });

    touchedFurnitureIds.add(furnitureId);
  }

  console.log('Recalcul des caches (min_price / nb_offers)...');
  for (const furnitureId of touchedFurnitureIds) {
    await recomputeFurnitureCache(furnitureId);
  }

  console.log('✅ Seed terminé avec succès !');
}

seed().catch(e => console.error(e));
