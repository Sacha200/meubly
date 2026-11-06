# Modele de donnees (schema `public`)

Etat a la fin de la phase 2 (2026-11-06). Source de verite : `supabase/migrations/` ; ce diagramme
en est le reflet (verifie par `db diff` local vs prod). Les colonnes `ai_*` de `furniture`
(enrichissement IA) sont omises pour la lisibilite.

```mermaid
erDiagram
    AUTH_USERS ||--|| profile : "user_id (cascade)"
    AUTH_USERS ||--o{ favorite : "user_id (cascade)"
    AUTH_USERS |o--o{ click_out : "user_id (set null)"
    profile ||--o{ review : "user_id (cascade)"

    category |o--o{ category : "parent_id"
    category ||--o{ furniture_category : "category_id (cascade)"
    furniture ||--o{ furniture_category : "furniture_id (cascade)"
    furniture ||--o{ furniture_image : "furniture_id (cascade)"
    furniture ||--o{ favorite : "furniture_id (cascade)"
    furniture ||--o{ review : "furniture_id (cascade)"
    furniture ||--o{ offer : "furniture_id (cascade)"
    furniture |o--o{ partner_product : "furniture_id (set null)"

    partner ||--o{ offer : "partner_id (cascade)"
    partner ||--o{ partner_product : "partner_id (cascade)"
    partner ||--o{ ingestion_run : "partner_id"

    offer ||--o{ price_history : "offer_id (cascade)"
    offer ||--o{ click_out : "offer_id (cascade)"

    furniture {
        uuid furniture_id PK
        text title "index trigram"
        text description
        text cover_url
        numeric size_width "cm, > 0"
        numeric size_height "cm, > 0"
        numeric size_depth "cm, > 0"
        text brand
        text gtin "8/12/13/14 chiffres, unique"
        text manufacturer_ref
        numeric weight_kg "> 0"
        jsonb attributes "objet"
        numeric cached_min_price "trigger"
        integer cached_nb_offers "trigger"
        timestamptz created_at
    }

    offer {
        uuid offer_id PK
        uuid furniture_id FK "NOT NULL"
        uuid partner_id FK "NOT NULL"
        offer_status status "active | stale | removed"
        text external_title
        text url_website
        numeric price "TTC, >= 0"
        numeric shipping_cost "NULL = inconnu"
        numeric total_price "genere : price + shipping_cost"
        numeric eco_fee "<= price"
        offer_availability availability
        integer delivery_min_days
        integer delivery_max_days
        delivery_mode delivery_mode
        boolean assembly_included
        integer return_days
        offer_condition condition "new | used | refurbished"
        text seller_name "marketplace"
        timestamptz last_seen_at
        timestamptz created_at
        timestamptz updated_at "trigger"
    }

    price_history {
        bigint price_history_id PK
        uuid offer_id FK
        numeric price
        numeric shipping_cost
        timestamptz observed_at
    }

    partner {
        uuid partner_id PK
        text name
        text website_base_url
        text logo_url
        boolean is_active
        boolean is_affiliate
        text api_key_hash
        timestamptz created_at
    }

    partner_product {
        uuid partner_product_id PK
        uuid partner_id FK
        uuid furniture_id FK "rapprochement"
        text external_id
        text external_url
        text external_title
        jsonb raw_payload
        timestamptz last_seen_at
        timestamptz updated_at "trigger"
    }

    click_out {
        bigint click_out_id PK
        uuid offer_id FK
        uuid user_id FK "NULL si anonyme"
        timestamptz clicked_at
    }

    ingestion_run {
        bigint ingestion_run_id PK
        uuid partner_id FK
        ingestion_status status "running | succeeded | failed | partial"
        timestamptz started_at
        timestamptz finished_at
        integer seen_count
        integer created_count
        integer updated_count
        integer error_count
        jsonb errors
    }

    category {
        uuid category_id PK
        uuid parent_id FK
        text label
        text cover_url
    }

    furniture_category {
        uuid furniture_id PK, FK
        uuid category_id PK, FK
    }

    furniture_image {
        uuid image_id PK
        uuid furniture_id FK
        text url
        boolean is_cover
        integer position
    }

    profile {
        uuid user_id PK, FK
        text username
        varchar email
        text role "USER | ADMIN"
    }

    favorite {
        uuid user_id PK, FK
        uuid furniture_id PK, FK
        timestamptz added_at
    }

    review {
        uuid review_id PK
        uuid furniture_id FK
        uuid user_id FK
        smallint rating "1 a 5"
        text comment "<= 1000"
        timestamptz updated_at "trigger"
    }
```

## Regles portees par la base

- **Unicite d'une annonce** : `offer_unique_listing UNIQUE NULLS NOT DISTINCT (furniture_id, partner_id, seller_name, condition)`.
- **Caches du meuble** : `refresh_furniture_offer_cache()` recalcule `cached_min_price` (prix article minimum) et `cached_nb_offers` sur les offres `active`, a chaque insertion, suppression, ou changement de `furniture_id`, `price` ou `status`.
- **Historique** : `record_price_history()` ajoute une ligne a la creation de l'offre et a chaque changement effectif de `price` ou `shipping_cost`.
- **Horodatage** : `set_updated_at()` sur `offer`, `partner_product`, `review`.
- **Droits** : voir `docs/security-matrix.md`.
