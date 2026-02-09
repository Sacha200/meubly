-- Create PartnerProduct mapping table
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

CREATE INDEX IF NOT EXISTS "idx_partnerproduct_partner" ON "PartnerProduct" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_partnerproduct_furniture" ON "PartnerProduct" ("furniture_id");
