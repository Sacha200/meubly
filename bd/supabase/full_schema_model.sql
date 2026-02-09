-- Full Schema Model based on the latest Class Diagram
-- This file represents the target structure of the database.

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Table (Public profile linked to auth.users if needed, or standalone)
-- Note: In Supabase, usually users are in auth.users. This table likely extends it.
CREATE TABLE IF NOT EXISTS "User" (
    "user_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "username" TEXT,
    "role" TEXT DEFAULT 'user',
    "email" TEXT UNIQUE, -- Added for consistency with diagram
    "password_hash" TEXT, -- managed by auth usually, but included per diagram
    "data_encrypted" TEXT,
    "last_login" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Partner Table
CREATE TABLE IF NOT EXISTS "Partner" (
    "partner_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "website_base_url" TEXT,
    "logo_url" TEXT,
    "is_active" BOOLEAN DEFAULT true
);

-- 4. Category Table (Self-referencing for hierarchy)
CREATE TABLE IF NOT EXISTS "Category" (
    "category_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "label" TEXT NOT NULL,
    "cover_url" TEXT,
    "parent_id" UUID REFERENCES "Category"("category_id") ON DELETE SET NULL
);

-- 5. Furniture Table
CREATE TABLE IF NOT EXISTS "Furniture" (
    "furniture_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_url" TEXT,
    "size_width" DECIMAL,
    "size_height" DECIMAL,
    "size_depth" DECIMAL,
    "cached_min_price" DECIMAL,
    "cached_nb_offers" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. FurnitureCategory Table (Many-to-Many relation)
CREATE TABLE IF NOT EXISTS "FurnitureCategory" (
    "furniture_id" UUID REFERENCES "Furniture"("furniture_id") ON DELETE CASCADE,
    "category_id" UUID REFERENCES "Category"("category_id") ON DELETE CASCADE,
    PRIMARY KEY ("furniture_id", "category_id")
);

-- 7. Offer Table (Links Furniture and Partner)
CREATE TABLE IF NOT EXISTS "offers" ( -- keeping 'offers' lowercase as seen in repository code
    "offer_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "external_title" TEXT,
    "url_website" TEXT,
    "price" DECIMAL,
    "is_active" BOOLEAN DEFAULT true,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "furniture_id" UUID REFERENCES "Furniture"("furniture_id") ON DELETE CASCADE,
    "partner_id" UUID REFERENCES "Partner"("partner_id") ON DELETE CASCADE
);

-- 8. Favorite Table
CREATE TABLE IF NOT EXISTS "Favorite" (
    "user_id" UUID REFERENCES "User"("user_id") ON DELETE CASCADE, -- Or auth.users(id)
    "furniture_id" UUID REFERENCES "Furniture"("furniture_id") ON DELETE CASCADE,
    "added_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY ("user_id", "furniture_id")
);

-- 9. PartnerProduct (Partner external catalog mapping)
CREATE TABLE IF NOT EXISTS "PartnerProduct" (
    "partner_product_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "partner_id" UUID NOT NULL REFERENCES "Partner"("partner_id") ON DELETE CASCADE,
    "external_id" TEXT NOT NULL,
    "external_url" TEXT,
    "external_title" TEXT,
    "raw_payload" JSONB,
    "furniture_id" UUID REFERENCES "Furniture"("furniture_id") ON DELETE SET NULL,
    "last_seen_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE ("partner_id", "external_id")
);

-- Indexes for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS "idx_furniture_title" ON "Furniture" ("title");
CREATE INDEX IF NOT EXISTS "idx_offer_furniture" ON "offers" ("furniture_id");
CREATE INDEX IF NOT EXISTS "idx_offer_price" ON "offers" ("price");
CREATE INDEX IF NOT EXISTS "idx_partnerproduct_partner" ON "PartnerProduct" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_partnerproduct_furniture" ON "PartnerProduct" ("furniture_id");
