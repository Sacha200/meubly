-- 1. Mise à jour de la table Furniture
ALTER TABLE "Furniture" RENAME COLUMN "name" TO "title";
ALTER TABLE "Furniture" RENAME COLUMN "price" TO "cached_min_price";
ALTER TABLE "Furniture" RENAME COLUMN "nb_offers" TO "cached_nb_offers";
ALTER TABLE "Furniture" ADD COLUMN IF NOT EXISTS "size_width" DECIMAL;
ALTER TABLE "Furniture" ADD COLUMN IF NOT EXISTS "size_height" DECIMAL;
ALTER TABLE "Furniture" ADD COLUMN IF NOT EXISTS "size_depth" DECIMAL;

-- 2. Mise à jour de la table Category
-- Note: Le code actuel utilisait 'title', le diagramme demande 'label'
ALTER TABLE "Category" RENAME COLUMN "title" TO "label";
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "parent_id" UUID REFERENCES "Category"("category_id");

-- 3. Création de la table Partner
CREATE TABLE IF NOT EXISTS "Partner" (
  "partner_id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" TEXT NOT NULL,
  "website_base_url" TEXT,
  "logo_url" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "api_key_hash" TEXT
);

-- 4. Mise à jour de la table Offer (offers)
-- Renommage pour cohérence (singulier)
ALTER TABLE "offers" RENAME COLUMN "furnitures_id" TO "furniture_id";
-- Ajout des nouvelles colonnes
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "partner_id" UUID REFERENCES "Partner"("partner_id");
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "external_title" TEXT;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 5. Création de la table FurnitureCategory (Relation N:N)
CREATE TABLE IF NOT EXISTS "FurnitureCategory" (
  "furniture_id" UUID REFERENCES "Furniture"("furniture_id") ON DELETE CASCADE,
  "category_id" UUID REFERENCES "Category"("category_id") ON DELETE CASCADE,
  PRIMARY KEY ("furniture_id", "category_id")
);

-- 6. Création de la table Favorite (si elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS "Favorite" (
  "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "furniture_id" UUID REFERENCES "Furniture"("furniture_id") ON DELETE CASCADE,
  "added_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY ("user_id", "furniture_id")
);
