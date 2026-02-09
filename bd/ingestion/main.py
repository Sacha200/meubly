import argparse
import json
import os
import re
import time
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

import requests
from supabase import create_client


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_title(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"[^a-z0-9àâçéèêëîïôûùüÿñæœ -]", "", s)
    return s


def env_required(name: str) -> str:
    v = os.getenv(name)
    if not v:
        raise RuntimeError(f"Missing required env var: {name}")
    return v


def get_supabase():
    url = env_required("SUPABASE_URL")
    key = env_required("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)


def wait_for_kong(supabase_url: str, timeout_s: int = 120) -> None:
    """
    Attendre que Kong/REST soit joignable. On ping /rest/v1/ avec une clé (service role).
    """
    deadline = time.time() + timeout_s
    while True:
        try:
            r = requests.get(f"{supabase_url.rstrip('/')}/rest/v1/", timeout=5)
            # Même si 401/404, l'important est que le gateway répond.
            if r.status_code in (200, 401, 404):
                return
        except Exception:
            pass

        if time.time() > deadline:
            raise RuntimeError("Supabase gateway not reachable (timeout)")
        time.sleep(2)


def ensure_app_schema(supabase) -> None:
    """
    Vérifie que les tables applicatives nécessaires existent.
    Sur une DB déjà initialisée avant l'ajout des scripts SQL, il faut exécuter la migration
    (ou repartir sur une DB fraîche).
    """
    try:
        supabase.table("PartnerProduct").select("partner_product_id").limit(1).execute()
    except Exception as e:
        msg = str(getattr(e, "message", "")) or str(e)
        if "PGRST205" in msg or "Could not find the table" in msg or "PartnerProduct" in msg:
            raise RuntimeError(
                "Schéma manquant: table 'PartnerProduct' introuvable.\n"
                "- Option 1 (recommandé en local): `docker compose down -v` puis relancer la stack.\n"
                "- Option 2: exécuter `bd/supabase/migrations/001_partner_product.sql` dans Supabase Studio (SQL Editor)."
            ) from e
        raise


def upsert_partner(supabase, *, name: str, website_base_url: Optional[str], logo_url: Optional[str]) -> Dict[str, Any]:
    res = (
        supabase.table("Partner")
        .upsert(
            {
                "name": name,
                "website_base_url": website_base_url,
                "logo_url": logo_url,
                "is_active": True,
            },
            on_conflict="name",
        )
        .execute()
    )
    # Some Supabase responses return list
    data = res.data
    if isinstance(data, list) and data:
        return data[0]

    # fallback: select
    sel = supabase.table("Partner").select("*").eq("name", name).single().execute()
    return sel.data


def get_or_create_partner_by_name(supabase, name: str, website_base_url: Optional[str] = None, logo_url: Optional[str] = None) -> Dict[str, Any]:
    sel = supabase.table("Partner").select("*").eq("name", name).execute()
    if sel.data:
        return sel.data[0]
    ins = supabase.table("Partner").insert(
        {"name": name, "website_base_url": website_base_url, "logo_url": logo_url, "is_active": True}
    ).execute()
    return ins.data[0]


def upsert_partner_product(
    supabase,
    *,
    partner_id: str,
    external_id: str,
    external_url: Optional[str],
    external_title: Optional[str],
    raw_payload: Dict[str, Any],
    furniture_id: Optional[str],
) -> Dict[str, Any]:
    payload = {
        "partner_id": partner_id,
        "external_id": external_id,
        "external_url": external_url,
        "external_title": external_title,
        "raw_payload": raw_payload,
        "furniture_id": furniture_id,
        "last_seen_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    }
    res = supabase.table("PartnerProduct").upsert(payload, on_conflict="partner_id,external_id").execute()
    if isinstance(res.data, list) and res.data:
        return res.data[0]
    # fallback: select
    sel = (
        supabase.table("PartnerProduct")
        .select("*")
        .eq("partner_id", partner_id)
        .eq("external_id", external_id)
        .single()
        .execute()
    )
    return sel.data


def find_furniture_by_normalized_title(supabase, normalized: str) -> Optional[Dict[str, Any]]:
    # naive: fetch a few and compare; for small datasets this is ok. Later replace by a computed column/index.
    res = supabase.table("Furniture").select("*").limit(200).execute()
    for row in res.data or []:
        if normalize_title(row.get("title", "")) == normalized:
            return row
    return None


def create_furniture_from_partner(
    supabase,
    *,
    title: str,
    description: Optional[str],
    cover_url: Optional[str],
    size_width: Optional[float] = None,
    size_height: Optional[float] = None,
    size_depth: Optional[float] = None,
    cached_min_price: Optional[float] = None,
    cached_nb_offers: Optional[int] = None,
) -> Dict[str, Any]:
    data = {
        "title": title,
        "description": description,
        "cover_url": cover_url,
        "size_width": size_width,
        "size_height": size_height,
        "size_depth": size_depth,
        "cached_min_price": cached_min_price,
        "cached_nb_offers": cached_nb_offers or 0,
        "created_at": utc_now_iso(),
    }
    res = supabase.table("Furniture").insert(data).execute()
    return res.data[0]


def upsert_offer(
    supabase,
    *,
    partner_id: str,
    furniture_id: str,
    external_title: Optional[str],
    url_website: Optional[str],
    price: Optional[float],
    is_active: bool = True,
) -> None:
    # We don't have a stable unique constraint in offers; we upsert by (partner_id, furniture_id, url_website) best-effort.
    payload = {
        "partner_id": partner_id,
        "furniture_id": furniture_id,
        "external_title": external_title,
        "url_website": url_website,
        "price": price,
        "is_active": is_active,
        "updated_at": utc_now_iso(),
    }
    try:
        if url_website:
            existing = (
                supabase.table("offers")
                .select("offer_id")
                .eq("partner_id", partner_id)
                .eq("furniture_id", furniture_id)
                .eq("url_website", url_website)
                .limit(1)
                .execute()
            )
            if existing.data:
                offer_id = existing.data[0]["offer_id"]
                supabase.table("offers").update(payload).eq("offer_id", offer_id).execute()
                return
    except Exception:
        # fallback to insert if select/update fails for any reason
        pass

    supabase.table("offers").insert(payload).execute()


def mock_catalog() -> List[Dict[str, Any]]:
    return [
        {
            "external_id": "mock-001",
            "title": "Chaise Scandinave Mock",
            "description": "Chaise en bois clair, style scandinave (source mock).",
            "cover_url": "https://images.unsplash.com/photo-1503602642458-232111445657",
            "price": 79.90,
            "url": "https://example.com/mock/chaise-scandinave",
            "dimensions": {"width": 45, "height": 80, "depth": 50},
        },
        {
            "external_id": "mock-002",
            "title": "Table Basse Mock",
            "description": "Table basse minimaliste (source mock).",
            "cover_url": "https://images.unsplash.com/photo-1549497538-303791108f95",
            "price": 119.0,
            "url": "https://example.com/mock/table-basse",
            "dimensions": {"width": 90, "height": 40, "depth": 55},
        },
    ]


def ingest_mock(supabase) -> Tuple[int, int]:
    partner = get_or_create_partner_by_name(
        supabase,
        "MockPartner",
        website_base_url="https://example.com",
        logo_url="https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg",
    )
    partner_id = partner["partner_id"]

    inserted_furn = 0
    inserted_pp = 0
    for item in mock_catalog():
        title = item["title"]
        norm = normalize_title(title)
        furniture = find_furniture_by_normalized_title(supabase, norm)
        if not furniture:
            dims = item.get("dimensions") or {}
            furniture = create_furniture_from_partner(
                supabase,
                title=title,
                description=item.get("description"),
                cover_url=item.get("cover_url"),
                size_width=dims.get("width"),
                size_height=dims.get("height"),
                size_depth=dims.get("depth"),
                cached_min_price=item.get("price"),
                cached_nb_offers=1,
            )
            inserted_furn += 1

        upsert_partner_product(
            supabase,
            partner_id=partner_id,
            external_id=item["external_id"],
            external_url=item.get("url"),
            external_title=title,
            raw_payload=item,
            furniture_id=furniture["furniture_id"],
        )
        inserted_pp += 1

        upsert_offer(
            supabase,
            partner_id=partner_id,
            furniture_id=furniture["furniture_id"],
            external_title=title,
            url_website=item.get("url"),
            price=item.get("price"),
            is_active=True,
        )

    return inserted_pp, inserted_furn


def ingest_ikea_best_effort(supabase) -> Tuple[int, int]:
    """
    Best effort IKEA ingestion using ikea_api. Non-official API, may break.
    We keep it resilient: if it fails, we log and continue.
    """
    try:
        import ikea_api  # type: ignore
    except Exception as e:
        print(f"[ikea] ikea_api import failed: {e}")
        return 0, 0

    country = os.getenv("IKEA_COUNTRY", "fr")
    language = os.getenv("IKEA_LANGUAGE", "fr")
    terms_raw = os.getenv("IKEA_SEARCH_TERMS", "canapé,bureau,chaise")
    terms = [t.strip() for t in terms_raw.split(",") if t.strip()]
    limit = int(os.getenv("IKEA_SEARCH_LIMIT", "10"))
    debug = (os.getenv("IKEA_DEBUG", "") or "").lower() in ("1", "true", "yes")
    token_env = (os.getenv("IKEA_TOKEN") or "").strip()  # token/cookie copied from ikea.com (see docs)
    if token_env:
        print(f"[ikea] IKEA_TOKEN fourni (longueur {len(token_env)})")

    partner = get_or_create_partner_by_name(
        supabase,
        "Ikea",
        website_base_url="https://www.ikea.com",
        logo_url="https://upload.wikimedia.org/wikipedia/commons/c/c5/Ikea_logo.svg",
    )
    partner_id = partner["partner_id"]

    constants = ikea_api.Constants(country=country, language=language)

    # guest token (some endpoints require it)
    token = token_env or None
    if token_env:
        if debug:
            print("[ikea] using IKEA_TOKEN from env")
    else:
        try:
            token = ikea_api.run(ikea_api.Auth(constants).get_guest_token())
        except Exception as e:
            print(f"[ikea] guest token failed (continuing): {e}")
            print(
                "[ikea] Astuce: tu peux copier un token depuis les cookies ikea.com et le fournir via IKEA_TOKEN "
                "(cf. doc ikea_api : token guest stocké dans les cookies)."
            )

    # En ikea_api 2.x, Search() n'accepte pas token. On récupère le RequestInfo depuis le generator
    # (ikea_api.abc) et on envoie la requête nous-mêmes avec le header Authorization.
    search = ikea_api.Search(constants)

    runner_used_token = [False]  # list pour pouvoir modifier dans le closure
    logged_request_sent = [False]  # pour n'afficher qu'une fois "requête avec token envoyée"

    def run_with_token(ep):
        if not token:
            return ikea_api.run(ep)
        try:
            from ikea_api.executors import requests as ikea_requests_executor
            # ep est un EndpointInfo: ep.func() est un generator qui yield RequestInfo
            gen = ep.func()
            req_info = next(gen)
            # Log du type pour diagnostiquer (parfois on reçoit un autre type que RequestInfo)
            req_info_type = type(req_info).__name__
            while True:
                # URL complète comme dans executors/requests: base_url + url
                base = (req_info.session_info.base_url or "").rstrip("/")
                path = (req_info.url or "").lstrip("/")
                full_url = f"{base}/{path}" if path else base
                if not full_url.startswith("http"):
                    print("[ikea] token fourni mais URL invalide → ikea_api.run() (sans token)")
                    print(f"[ikea]   (req_info type={req_info_type} base_url={bool(base)} path={bool(path)} path_debut={repr(path[:60]) if path else ''})")
                    return ikea_api.run(ep)
                if debug and not logged_request_sent[0]:
                    logged_request_sent[0] = True
                    # Afficher le domaine uniquement (pas la requête complète)
                    from urllib.parse import urlparse
                    try:
                        domain = urlparse(full_url).netloc or full_url[:50]
                    except Exception:
                        domain = full_url[:50]
                    print(f"[ikea] envoi requête avec token vers {domain}")
                headers = {**(req_info.session_info.headers or {}), **(req_info.headers or {}), "Authorization": f"Bearer {token}"}
                resp = requests.request(
                    method=req_info.method,
                    url=full_url,
                    params=req_info.params,
                    headers=headers,
                    json=req_info.json,
                    data=req_info.data,
                    timeout=30,
                )
                resp.raise_for_status()
                response_info = ikea_requests_executor.RequestsResponseInfo(response=resp)
                try:
                    req_info = gen.send(response_info)
                except StopIteration as e:
                    runner_used_token[0] = True
                    return e.value
        except Exception as e:
            print(f"[ikea] run_with_token erreur: {e} → fallback sans token")
            return ikea_api.run(ep)

    inserted_pp = 0
    inserted_furn = 0
    logged_empty_structure = False
    def coerce_to_dict(obj: Any) -> Optional[Dict[str, Any]]:
        if isinstance(obj, dict):
            return obj
        # pydantic v2
        if hasattr(obj, "model_dump"):
            try:
                d = obj.model_dump()  # type: ignore[attr-defined]
                return d if isinstance(d, dict) else None
            except Exception:
                pass
        # pydantic v1 / common pattern
        if hasattr(obj, "dict"):
            try:
                d = obj.dict()  # type: ignore[attr-defined]
                return d if isinstance(d, dict) else None
            except Exception:
                pass
        # dataclass / simple objects
        try:
            d = vars(obj)
            return d if isinstance(d, dict) else None
        except Exception:
            return None
    def list_has_dictlike_items(lst: Any) -> bool:
        if not isinstance(lst, list) or not lst:
            return False
        # true si au moins un élément ressemble à un objet produit (dict / convertible en dict)
        for it in lst[:10]:
            if coerce_to_dict(it):
                return True
        return False
    def extract_dimensions_from_obj(d: Dict[str, Any]) -> Tuple[Optional[float], Optional[float], Optional[float]]:
        """
        Best-effort extraction des dimensions (cm) depuis différentes structures possibles.
        """
        def to_float(x: Any) -> Optional[float]:
            try:
                if x is None or x == "":
                    return None
                return float(x)
            except Exception:
                return None

        # 1) dictionnaires imbriqués classiques
        for key in ("dimensions", "measurements", "size", "productDimensions"):
            v = d.get(key)
            if isinstance(v, dict):
                w = to_float(v.get("width") or v.get("size_width") or v.get("w"))
                h = to_float(v.get("height") or v.get("size_height") or v.get("h"))
                dep = to_float(v.get("depth") or v.get("size_depth") or v.get("d"))
                if w or h or dep:
                    return w, h, dep

        # 2) champs plats éventuels
        w = to_float(d.get("size_width") or d.get("width"))
        h = to_float(d.get("size_height") or d.get("height"))
        dep = to_float(d.get("size_depth") or d.get("depth"))
        if w or h or dep:
            return w, h, dep

        # 3) string type "80x60x40" ou "80 x 60 x 40"
        dim_str = d.get("dimensions") if isinstance(d.get("dimensions"), str) else d.get("dimension") if isinstance(d.get("dimension"), str) else None
        if isinstance(dim_str, str) and dim_str:
            m = re.findall(r"(\\d+(?:[\\.,]\\d+)?)", dim_str)
            if len(m) >= 3:
                w = to_float(m[0].replace(",", "."))
                h = to_float(m[1].replace(",", "."))
                dep = to_float(m[2].replace(",", "."))
                return w, h, dep

        return None, None, None

    def extract_cover_url_from_obj(d: Dict[str, Any]) -> Optional[str]:
        v = (
            d.get("mainImageUrl")
            or d.get("imageUrl")
            or d.get("thumbnailUrl")
            or d.get("image")
            or d.get("contextualImageUrl")
        )
        if isinstance(v, str) and v.strip():
            return v.strip()
        pic = d.get("picture")
        if isinstance(pic, dict):
            u = pic.get("url")
            if isinstance(u, str) and u.strip():
                return u.strip()
        imgs = d.get("allProductImage") or d.get("images")
        if isinstance(imgs, list) and imgs:
            first = imgs[0]
            if isinstance(first, dict):
                u = first.get("url") or first.get("src") or first.get("imageUrl")
                if isinstance(u, str) and u.strip():
                    return u.strip()
        return None

    def extract_price_from_obj(d: Dict[str, Any]) -> Optional[float]:
        """
        Best-effort extraction d'un prix numérique depuis différentes structures IKEA.
        """
        def to_float(x: Any) -> Optional[float]:
            try:
                if x is None or x == "":
                    return None
                if isinstance(x, str):
                    x = x.replace(",", ".").strip()
                return float(x)
            except Exception:
                return None

        # champs directs possibles
        for k in ("price", "salesPrice", "unitPrice", "currentPrice", "retailPrice", "regularPrice", "normalPrice"):
            v = d.get(k)
            if isinstance(v, (int, float, str)):
                f = to_float(v)
                if f is not None:
                    return f
            if isinstance(v, dict):
                # IKEA search retourne souvent des dicts avec 'numeral'
                for kk in ("numeral", "current", "value", "amount", "localized"):
                    f = to_float(v.get(kk))
                    if f is not None:
                        return f
                # current peut lui-même être un dict
                cur = v.get("current")
                if isinstance(cur, dict):
                    for kk in ("numeral", "value", "amount"):
                        f = to_float(cur.get(kk))
                        if f is not None:
                            return f

        return None

    print(f"[ikea] recherche pour {len(terms)} terme(s): {terms[:5]}{'...' if len(terms) > 5 else ''}")

    for term in terms:
        try:
            endpoint = search.search(term, limit=limit)
            result = run_with_token(endpoint)
        except Exception as e:
            print(f"[ikea] search failed for '{term}': {e}")
            continue

        if result is None:
            print(f"[ikea] terme '{term}' → réponse None (run_with_token a peut-être renvoyé None)")
            continue

        # Extraction des produits depuis la réponse IKEA (doc: ikea-api-client Search)
        # La réponse contient souvent searchResultPage avec la liste des produits
        products: List[Dict[str, Any]] = []
        products_source: Optional[str] = None
        if isinstance(result, dict):
            # 1) Clés racine
            for key in ("results", "items", "products", "productList", "searchResult"):
                val = result.get(key)
                if isinstance(val, list) and list_has_dictlike_items(val):
                    products = val
                    break
            # 2) searchResultPage (structure réelle de l'API IKEA) — clé "products" confirmée dans les logs
            if not products:
                srp = result.get("searchResultPage")
                if isinstance(srp, dict):
                    for key in ("products", "productList", "results", "items", "searchResultProducts"):
                        val = srp.get(key)
                        if isinstance(val, list) and list_has_dictlike_items(val):
                            products = val
                            break
                        # NOTE: "searchResultPage.products" peut être un dict complexe (badge/filters/main/shelves).
                        # On ne tente pas de faire list(val.values()) ici car ça mélange des sous-structures non-produits.
                    # Cas explicite: searchResultPage.products.main.items (API search IKEA)
                    if not products:
                        srp_products = srp.get("products")
                        if isinstance(srp_products, dict):
                            main = srp_products.get("main")
                            if isinstance(main, dict):
                                items = main.get("items")
                                if isinstance(items, list) and list_has_dictlike_items(items):
                                    products = items
                                    products_source = "searchResultPage.products.main.items"
                            if not products:
                                shelves = srp_products.get("shelves")
                                # shelves est souvent une liste de sections, chacune pouvant contenir une liste d'items
                                if isinstance(shelves, list):
                                    for sh in shelves[:10]:
                                        shd = coerce_to_dict(sh) or (sh if isinstance(sh, dict) else None)
                                        if isinstance(shd, dict):
                                            sh_items = shd.get("items") or shd.get("products")
                                            if isinstance(sh_items, list) and list_has_dictlike_items(sh_items):
                                                products = sh_items
                                                products_source = "searchResultPage.products.shelves[*].items"
                                                break
                    # searchResultPage.content peut contenir la liste (APIs IKEA)
                    if not products:
                        content = srp.get("content")
                        if isinstance(content, list) and list_has_dictlike_items(content):
                            products = content
                        elif isinstance(content, dict):
                            for ck in ("products", "productList", "items", "results"):
                                v = content.get(ck)
                                if isinstance(v, list) and list_has_dictlike_items(v):
                                    products = v
                                    break
                    # parfois imbriqué: searchResultPage.productListPage.productViews
                    if not products:
                        plp = srp.get("productListPage") or srp.get("productList")
                        if isinstance(plp, dict):
                            for key in ("productViews", "products", "items", "results"):
                                val = plp.get(key)
                                if isinstance(val, list) and list_has_dictlike_items(val):
                                    products = val
                                    break
                elif isinstance(srp, list):
                    if list_has_dictlike_items(srp):
                        products = srp
            # 3) searchResult (objet imbriqué)
            if not products:
                sr = result.get("searchResult")
                if isinstance(sr, dict):
                    for key in ("products", "items", "results"):
                        val = sr.get(key)
                        if isinstance(val, list) and list_has_dictlike_items(val):
                            products = val
                            break
            if debug:
                if not products:
                    try:
                        print(f"[ikea][debug] term='{term}' top_keys={list(result.keys())[:30]}")
                        if result.get("searchResultPage"):
                            s = result["searchResultPage"]
                            print(f"[ikea][debug] searchResultPage type={type(s).__name__} keys={list(s.keys())[:20] if isinstance(s, dict) else 'n/a'}")
                    except Exception:
                        pass
                else:
                    print(f"[ikea][debug] term='{term}' products_count={len(products)} first_keys={list(products[0].keys())[:15] if products and isinstance(products[0], dict) else 'n/a'}")
        if not products and isinstance(result, list):
            if list_has_dictlike_items(result):
                products = result
        # Si la liste extraite est non exploitable (ex: IDs/facettes), on l'ignore.
        if products and not list_has_dictlike_items(products):
            if debug:
                try:
                    t0 = type(products[0]).__name__
                except Exception:
                    t0 = "n/a"
                print(f"[ikea][debug] liste de produits ignorée (élément type={t0})")
            products = []

        # Une ligne par terme : toujours afficher le résultat du parsing
        if products:
            print(f"[ikea] terme '{term}' → {len(products)} produit(s) extrait(s)")
        else:
            res_type = type(result).__name__
            if isinstance(result, dict):
                keys = list(result.keys())[:12]
                print(f"[ikea] terme '{term}' → 0 produit — réponse type={res_type} clés={keys}")
            else:
                print(f"[ikea] terme '{term}' → 0 produit — réponse type={res_type}")

        # Si token fourni mais 0 produits, afficher une fois la structure détaillée pour diagnostiquer
        if token and not products and isinstance(result, dict) and not logged_empty_structure:
            logged_empty_structure = True
            try:
                print("[ikea] Token utilisé mais 0 produits extraits. Structure de la réponse:")
                print(f"  clés racine: {list(result.keys())[:25]}")
                srp = result.get("searchResultPage")
                if srp is not None and isinstance(srp, dict):
                    print(f"  searchResultPage clés={list(srp.keys())[:25]}")
                    raw_products = srp.get("products")
                    if raw_products is not None:
                        print(f"  searchResultPage.products type={type(raw_products).__name__} len={len(raw_products) if isinstance(raw_products, (list, dict)) else 'n/a'}")
                        if isinstance(raw_products, dict):
                            print(f"  products (dict) ex. clés={list(raw_products.keys())[:10]}")
                    if "productListPage" in srp:
                        plp = srp["productListPage"]
                        print(f"  productListPage clés={list(plp.keys())[:25] if isinstance(plp, dict) else 'n/a'}")
            except Exception as e:
                print(f"[ikea] (log structure: {e})")

        inserted_pp_before_term = inserted_pp
        inserted_furn_before_term = inserted_furn

        for p in products[:limit]:
            p_dict = coerce_to_dict(p)
            if not p_dict:
                continue

            raw_p: Dict[str, Any] = p_dict

            # Certaines réponses renvoient un wrapper (ex: {"product": {...}}).
            p_obj: Dict[str, Any] = raw_p
            for wrapper_key in ("product", "productData", "productView", "item", "productSummary"):
                v = p_obj.get(wrapper_key)
                if isinstance(v, dict):
                    p_obj = v
                    break

            # IDs possibles (ikea_api: itemNo, productId, id)
            candidate_id = (
                p_obj.get("id")
                or p_obj.get("productId")
                or p_obj.get("itemNo")
                or p_obj.get("item_code")
                or p_obj.get("itemCode")
                or p_obj.get("goodsNumber")
                or p_obj.get("productNumber")
            )
            if isinstance(candidate_id, dict):
                candidate_id = (
                    candidate_id.get("value")
                    or candidate_id.get("id")
                    or candidate_id.get("itemNo")
                    or candidate_id.get("productId")
                )
            external_id = str(candidate_id or "").strip()

            # Fallback: extraire un numéro IKEA depuis une URL type /p/...-12345678/
            if not external_id:
                import re

                url_candidate = (
                    p_obj.get("pipUrl")
                    or p_obj.get("url")
                    or p_obj.get("productUrl")
                    or p_obj.get("permalink")
                    or p_obj.get("link")
                )
                if isinstance(url_candidate, str) and url_candidate:
                    m = re.search(r"(\d{8})", url_candidate)
                    if m:
                        external_id = m.group(1)
            if not external_id:
                continue
            # IKEA itemNo / product number est très souvent un identifiant numérique sur 8 chiffres.
            # On ignore les éléments qui ressemblent à des filtres (ex: "TYPE", "COLOR", etc.).
            import re
            if not re.fullmatch(r"\d{8}", external_id):
                continue

            # Titre (productName, name, title, displayName)
            title = (
                p_obj.get("productName")
                or p_obj.get("name")
                or p_obj.get("title")
                or p_obj.get("displayName")
                or p_obj.get("label")
                or f"IKEA {external_id}"
            )
            external_url = (
                p_obj.get("pipUrl")
                or p_obj.get("url")
                or p_obj.get("productUrl")
                or p_obj.get("permalink")
                or p_obj.get("link")
            )
            # Image (image, mainImageUrl, imageUrl, thumbnailUrl, picture)
            cover_url = (
                p_obj.get("image")
                or p_obj.get("mainImageUrl")
                or p_obj.get("imageUrl")
                or p_obj.get("thumbnailUrl")
                or (p_obj.get("picture") or {}).get("url") if isinstance(p_obj.get("picture"), dict) else None
            )
            if not cover_url:
                cover_url = extract_cover_url_from_obj(p_obj)
            description = p_obj.get("description") or p_obj.get("productDescription")
            dim_w, dim_h, dim_d = extract_dimensions_from_obj(p_obj)
            price = extract_price_from_obj(p_obj)

            norm = normalize_title(str(title))
            furniture = find_furniture_by_normalized_title(supabase, norm)
            if not furniture:
                furniture = create_furniture_from_partner(
                    supabase,
                    title=str(title),
                    description=description,
                    cover_url=cover_url,
                    size_width=dim_w,
                    size_height=dim_h,
                    size_depth=dim_d,
                    cached_min_price=price,
                    cached_nb_offers=1,
                )
                inserted_furn += 1
            else:
                # Si le meuble existe déjà, on complète les champs manquants (utile pour afficher image/description en page produit)
                patch: Dict[str, Any] = {}
                if (not furniture.get("cover_url")) and cover_url:
                    patch["cover_url"] = cover_url
                if (not furniture.get("description")) and description:
                    patch["description"] = description
                if furniture.get("size_width") is None and dim_w is not None:
                    patch["size_width"] = dim_w
                if furniture.get("size_height") is None and dim_h is not None:
                    patch["size_height"] = dim_h
                if furniture.get("size_depth") is None and dim_d is not None:
                    patch["size_depth"] = dim_d
                if furniture.get("cached_min_price") is None and price is not None:
                    patch["cached_min_price"] = price
                if not furniture.get("cached_nb_offers"):
                    patch["cached_nb_offers"] = 1
                if patch:
                    try:
                        supabase.table("Furniture").update(patch).eq("furniture_id", furniture["furniture_id"]).execute()
                        furniture.update(patch)
                    except Exception:
                        # best effort: on n'échoue pas l'ingestion pour ça
                        pass

            upsert_partner_product(
                supabase,
                partner_id=partner_id,
                external_id=external_id,
                external_url=external_url,
                external_title=str(title),
                raw_payload=raw_p,
                furniture_id=furniture["furniture_id"],
            )
            inserted_pp += 1

            upsert_offer(
                supabase,
                partner_id=partner_id,
                furniture_id=furniture["furniture_id"],
                external_title=str(title),
                url_website=external_url,
                price=price,
                is_active=True,
            )

        ins_pp = inserted_pp - inserted_pp_before_term
        ins_furn = inserted_furn - inserted_furn_before_term
        print(f"[ikea] terme '{term}' → insérés: partner_products={ins_pp} furnitures_created={ins_furn}")

    # Backfill: si certains meubles (déjà reliés via PartnerProduct) ont encore cover_url/prix null,
    # on peut les compléter à partir de PartnerProduct.raw_payload sans refaire des appels réseau.
    try:
        rows = (
            supabase.table("PartnerProduct")
            .select("furniture_id, raw_payload")
            .eq("partner_id", partner_id)
            .limit(200)
            .execute()
            .data
            or []
        )
        patched = 0
        for r in rows:
            fid = r.get("furniture_id")
            if not fid:
                continue
            furn = (
                supabase.table("Furniture")
                .select("furniture_id, cover_url, description, cached_min_price, cached_nb_offers, size_width, size_height, size_depth")
                .eq("furniture_id", fid)
                .single()
                .execute()
                .data
            )
            if not isinstance(furn, dict):
                continue
            rp = r.get("raw_payload")
            prod = rp.get("product") if isinstance(rp, dict) and isinstance(rp.get("product"), dict) else None
            if not isinstance(prod, dict):
                continue
            patch: Dict[str, Any] = {}
            if (not furn.get("cover_url")):
                cu = extract_cover_url_from_obj(prod)
                if cu:
                    patch["cover_url"] = cu
            if furn.get("cached_min_price") is None:
                p = extract_price_from_obj(prod)
                if p is not None:
                    patch["cached_min_price"] = p
            if not furn.get("cached_nb_offers"):
                patch["cached_nb_offers"] = 1
            if patch:
                supabase.table("Furniture").update(patch).eq("furniture_id", fid).execute()
                patched += 1
        if patched:
            print(f"[ikea] backfill Furniture depuis PartnerProduct: {patched} meuble(s) mis à jour")
    except Exception:
        pass

    if token and not runner_used_token[0]:
        print("[ikea] Le token n'a pas été envoyé (endpoint sans URL exploitable). Résultat: 0 produit IKEA.")
    elif token and runner_used_token[0]:
        print("[ikea] token utilisé pour les requêtes (succès)")
    return inserted_pp, inserted_furn


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Run ingestion once and exit")
    args = parser.parse_args()

    supabase_url = env_required("SUPABASE_URL")
    wait_for_kong(supabase_url)

    supabase = get_supabase()
    ensure_app_schema(supabase)

    print(f"[ingestion] start {utc_now_iso()}")

    pp_mock, furn_mock = ingest_mock(supabase)
    print(f"[mock] partner_products={pp_mock} furnitures_created={furn_mock}")

    pp_ikea, furn_ikea = ingest_ikea_best_effort(supabase)
    print(f"[ikea] partner_products={pp_ikea} furnitures_created={furn_ikea}")

    print(f"[ingestion] done {utc_now_iso()}")

    if args.once:
        return


if __name__ == "__main__":
    main()

