-- Full Schema Model based on the latest Class Diagram
-- This file represents the target structure of the database.

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. profile Table (Public profile linked to auth.users)
-- Note: Named "profile" to avoid conflict with PostgreSQL reserved keyword "user"
CREATE TABLE IF NOT EXISTS profile (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT,
    role TEXT DEFAULT 'user',
    email TEXT UNIQUE,
    password_hash TEXT,
    data_encrypted TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. partner Table
CREATE TABLE IF NOT EXISTS partner (
    partner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    website_base_url TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true
);

-- 4. category Table (Self-referencing for hierarchy)
CREATE TABLE IF NOT EXISTS category (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL,
    cover_url TEXT,
    parent_id UUID REFERENCES category(category_id) ON DELETE SET NULL
);

-- 5. furniture Table
CREATE TABLE IF NOT EXISTS furniture (
    furniture_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    size_width DECIMAL,
    size_height DECIMAL,
    size_depth DECIMAL,
    cached_min_price DECIMAL,
    cached_nb_offers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. furniture_category Table (Many-to-Many relation)
CREATE TABLE IF NOT EXISTS furniture_category (
    furniture_id UUID REFERENCES furniture(furniture_id) ON DELETE CASCADE,
    category_id UUID REFERENCES category(category_id) ON DELETE CASCADE,
    PRIMARY KEY (furniture_id, category_id)
);

-- 7. offer Table
CREATE TABLE IF NOT EXISTS offer (
    offer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_title TEXT,
    url_website TEXT,
    price DECIMAL,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    furniture_id UUID REFERENCES furniture(furniture_id) ON DELETE CASCADE,
    partner_id UUID REFERENCES partner(partner_id) ON DELETE CASCADE
);

-- 8. favorite Table
CREATE TABLE IF NOT EXISTS favorite (
    user_id UUID REFERENCES profile(user_id) ON DELETE CASCADE,
    furniture_id UUID REFERENCES furniture(furniture_id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, furniture_id)
);

-- 9. partner_product Table (Partner external catalog mapping)
CREATE TABLE IF NOT EXISTS partner_product (
    partner_product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partner(partner_id) ON DELETE CASCADE,
    external_id TEXT NOT NULL,
    external_url TEXT,
    external_title TEXT,
    raw_payload JSONB,
    furniture_id UUID REFERENCES furniture(furniture_id) ON DELETE SET NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE (partner_id, external_id)
);

-- 10. furniture_image Table (galerie multi-images par meuble)
CREATE TABLE IF NOT EXISTS furniture_image (
    image_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    furniture_id UUID NOT NULL REFERENCES furniture(furniture_id) ON DELETE CASCADE,
    url          TEXT NOT NULL,
    alt_text     TEXT,
    type         TEXT,
    position     INTEGER NOT NULL DEFAULT 0,
    source       TEXT DEFAULT 'ikea',
    is_cover     BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 11. review Table
CREATE TABLE IF NOT EXISTS review (
    review_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES furniture(furniture_id) ON DELETE CASCADE,
    user_id    UUID REFERENCES profile(user_id) ON DELETE SET NULL,
    rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    author_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_furniture_title ON furniture (title);
CREATE INDEX IF NOT EXISTS idx_offer_furniture ON offer (furniture_id);
CREATE INDEX IF NOT EXISTS idx_offer_price ON offer (price);
CREATE INDEX IF NOT EXISTS idx_partner_product_partner ON partner_product (partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_product_furniture ON partner_product (furniture_id);
CREATE INDEX IF NOT EXISTS idx_furniture_image_furniture_id ON furniture_image (furniture_id, position);
CREATE UNIQUE INDEX IF NOT EXISTS idx_furniture_image_cover ON furniture_image (furniture_id) WHERE is_cover = true;
