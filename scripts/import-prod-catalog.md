# Importer le catalogue prod dans la base locale

Optionnel : par defaut la base locale ne contient que le seed synthetique (`supabase/seed.sql`).
Cette procedure copie le **catalogue** prod (pas les comptes, favoris ni avis) dans la stack CLI locale.
Sens unique : prod -> local. Rien n'est ecrit en prod.

> Ne PAS utiliser `bd/ingestion/cloud_to_local.mjs` : malgre son nom, il ecrit du LOCAL vers le CLOUD.

Prerequis : Docker Desktop lance, `npx supabase@2.122.1 start`, projet lie (`supabase link`).

```bash
# 1. Export des donnees catalogue (fichier hors git : data/ est ignore)
npx supabase@2.122.1 db dump --linked --data-only \
  -x public.profile -x public.favorite -x public.review \
  -f data/prod-catalog.sql

# 2. Repartir d'une base locale vide de catalogue
npx supabase@2.122.1 db reset        # schema + seed
docker exec -i supabase_db_meubly psql -U postgres -d postgres -c \
  "TRUNCATE public.offer, public.partner_product, public.furniture_image, public.furniture_category, public.furniture, public.partner, public.category CASCADE;"

# 3. Import
docker exec -i supabase_db_meubly psql -U postgres -d postgres -v ON_ERROR_STOP=1 < data/prod-catalog.sql
```

Tables catalogue : `category`, `furniture`, `furniture_category`, `furniture_image`, `partner`, `offer`, `partner_product`.
Supprimer `data/prod-catalog.sql` apres usage s'il n'est plus utile.
