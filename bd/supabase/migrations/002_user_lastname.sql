-- Add lastname column to User profile table (used by frontend signup)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "lastname" TEXT;

