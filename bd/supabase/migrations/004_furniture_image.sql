-- Migration 004: Table FurnitureImage
-- Stocke les images multiples par meuble avec métadonnées

CREATE TABLE IF NOT EXISTS "FurnitureImage" (
    "image_id"     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "furniture_id" UUID NOT NULL REFERENCES "Furniture"("furniture_id") ON DELETE CASCADE,
    "url"          TEXT NOT NULL,
    "alt_text"     TEXT,
    -- Type IKEA : MAIN_PRODUCT_IMAGE | CONTEXT_PRODUCT_IMAGE | FUNCTIONAL_PRODUCT_IMAGE | QUALITY_PRODUCT_IMAGE
    -- ou 'unsplash', 'ai-generated' pour les autres sources
    "type"         TEXT,
    "position"     INTEGER NOT NULL DEFAULT 0,  -- ordre d'affichage (0 = première)
    "source"       TEXT DEFAULT 'ikea',         -- 'ikea' | 'unsplash' | 'ai-generated'
    "is_cover"     BOOLEAN NOT NULL DEFAULT false,
    "created_at"   TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Index pour récupérer rapidement les images d'un meuble triées par position
CREATE INDEX IF NOT EXISTS idx_furniture_image_furniture_id
    ON "FurnitureImage" (furniture_id, position);
