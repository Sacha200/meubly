#!/usr/bin/env bash
# Applique des migrations SQL sur la base Supabase LOCALE (conteneur supabase-db).
# Usage : bash bd/supabase/apply-local.sh bd/supabase/migrations/006_x.sql [...]
# S'arrete au premier echec. Ne vise jamais la base cloud.
set -euo pipefail

CONTAINER="${SUPABASE_DB_CONTAINER:-supabase-db}"
# supabase_admin : proprietaire des tables dans l'image self-hosted (postgres n'y est pas superuser).
DB_USER="${SUPABASE_DB_USER:-supabase_admin}"

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <migration.sql>..." >&2
  exit 2
fi

for file in "$@"; do
  echo "-> $file"
  docker exec -i "$CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -q < "$file"
done
