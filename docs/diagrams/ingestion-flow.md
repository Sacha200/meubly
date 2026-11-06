# Flux d'ingestion cible (phase 3)

Cible, pas encore implementee : les scripts actuels de `bd/ingestion/` sont geles depuis la
phase 2 et incompatibles avec le schema (ils ecrivent `offer.is_active`, supprimee, et les caches
du meuble, desormais maintenus par trigger). Ils seront reecrits selon ce flux.

```mermaid
flowchart TD
    RUN["ingestion_run<br/>status = running"] --> ADP
    ADP["Adaptateur du partenaire<br/>fetch + normalisation"] --> PP["Upsert partner_product<br/>(external_id, raw_payload, last_seen_at)"]
    PP --> MATCH{"Rapprochement<br/>GTIN / ref fabricant,<br/>sinon titre + dimensions + marque"}
    MATCH -->|"score suffisant"| OFF["Upsert offer<br/>status = active, last_seen_at = now()"]
    MATCH -->|"score faible"| QUEUE["File de validation admin"]
    MATCH -->|"nouveau produit"| FUR["Creation furniture"] --> OFF
    OFF --> TRG["Triggers base<br/>price_history si prix change<br/>cached_min_price / cached_nb_offers"]
    OFF --> STALE["Offres non revues de ce partenaire<br/>-> stale, puis removed"]
    STALE --> TRG
    TRG --> END["ingestion_run<br/>finished_at, compteurs, errors<br/>status = succeeded / partial / failed"]
    QUEUE --> END
```

Points de conception retenus en phase 2 :
- l'ingestion n'ecrit jamais `cached_min_price` / `cached_nb_offers` ni `price_history` : la base s'en charge ;
- une offre revue sans changement de prix ne cree pas de ligne d'historique ;
- `ingestion_run` et `click_out` ne sont accessibles qu'au service role.
