-- Migration 003: AI enrichment fields for Furniture table
-- Adds Gemini-generated enrichment data per furniture item

ALTER TABLE "Furniture"
  ADD COLUMN IF NOT EXISTS ai_description        TEXT,
  ADD COLUMN IF NOT EXISTS ai_tags               TEXT[],
  ADD COLUMN IF NOT EXISTS ai_style              TEXT,
  ADD COLUMN IF NOT EXISTS ai_material           TEXT,
  ADD COLUMN IF NOT EXISTS ai_category_suggestion TEXT,
  ADD COLUMN IF NOT EXISTS ai_scene_prompt        TEXT,
  ADD COLUMN IF NOT EXISTS ai_enriched_at         TIMESTAMPTZ;

-- Index for quickly finding un-enriched furniture
CREATE INDEX IF NOT EXISTS idx_furniture_ai_enriched_at
  ON "Furniture" (ai_enriched_at)
  WHERE ai_enriched_at IS NULL;
