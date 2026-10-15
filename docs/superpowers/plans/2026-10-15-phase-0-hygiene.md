# Phase 0 : Hygiene - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le depot modifiable en confiance : tests verts et deterministes, lint + format actifs, CI sur chaque PR, plus de code mort ni de secret dans les fichiers a versionner.

**Architecture:** Aucun changement fonctionnel pour l'utilisateur final. On supprime les effets de bord a l'import (serveur qui ecoute, appel Storage), on isole les tests qui touchent une vraie base derriere un garde-fou, on ajoute ESLint (flat config) + Prettier separes (Prettier = formatage, ESLint = qualite), puis une CI GitHub Actions.

**Tech Stack:** Node 22, Express 4, Vitest 3.2, supertest 6, Vue 3, ESLint 10 flat config, eslint-plugin-vue 10, Prettier 3, GitHub Actions (checkout v7, setup-node v7).

**Spec:** `docs/ROADMAP.md` (Phase 0) + audit du 2026-10-15 (memoire projet).

## Global Constraints

- Branche : `chore/phase-0-hygiene` depuis `master`. Jamais de commit direct sur `master`.
- Aucun appel a la base Supabase cloud `rlxyptqvtpdhrdpdoiwy` pendant les tests.
- Aucun secret en clair dans un fichier commite. Ne jamais lire ni afficher `.env`.
- Messages de commit conventionnels, termines par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Ne pas modifier le comportement metier (routes, reponses JSON) sauf ajout de `GET /api/v1/health`.
- Les corrections de securite (auth des routes, RLS, password_hash, bcrypt) sont HORS PERIMETRE : phase 1.
- Prettier back : `.prettierrc` existant (double quotes, semi, width 100). Front : meme fichier copie.
- Les commits de reformatage Prettier sont isoles (aucun changement de logique dedans).

## Review Focus

1. Demarrage en production : `npm start`, `Dockerfile`, `render.yaml`, `docker-compose` doivent tous lancer `server.js`. Un oubli = Render casse au deploiement. Test : Task 1 step "smoke".
2. Test DB lance par erreur contre la prod : `test:db` doit refuser toute URL Supabase non locale. Test : Task 2.
3. Bucket IA : apres le passage en lazy, le premier appel a `generateScene` doit toujours creer le bucket ; un echec ne doit pas etre memorise. Test : Task 1.
4. Reformatage Prettier qui casse un template Vue ou une regex : le build front et toute la suite doivent passer apres le commit de format. Test : Task 4 step build.
5. Suppression d'Auth0 : aucun composant ne doit encore appeler `useAuth0` (verifie : seul `src/main.js` l'importe). Test : build front Task 5.

---

## File Structure

| Fichier | Responsabilite |
|---|---|
| `meubly-back/app.js` (modifie) | Construit et exporte l'app Express, sans `listen` |
| `meubly-back/server.js` (cree) | Point d'entree process : `app.listen(PORT)` |
| `meubly-back/routes/v1/health.js` (cree) | `GET /health` pour sonde Render / tests |
| `meubly-back/controllers/aiController.js` (modifie) | `ensureBucket` memoise, appele a la demande |
| `meubly-back/tests/unit/app.test.js` (cree) | Import sans effet de bord + health |
| `meubly-back/tests/unit/aiBucket.test.js` (cree) | Creation lazy du bucket |
| `meubly-back/tests/db/favorites.db.test.js` (deplace) | Test contre une vraie base LOCALE uniquement |
| `meubly-back/tests/db/guard.js` (cree) | Refuse toute URL Supabase non locale |
| `meubly-back/vitest.config.js` / `vitest.db.config.js` | Suites par defaut vs suite DB |
| `meubly-front/tests/unit/api.test.js` (reecrit) | Tests des modules `src/api/*` actuels |
| `*/eslint.config.js`, `*/.prettierrc`, `*/.prettierignore` | Lint + format |
| `.github/workflows/ci.yml` (cree) | CI back + front |
| `bd/generate_seed.mjs` (modifie) | Cle lue depuis l'environnement |

---

### Task 1 : Back sans effet de bord a l'import (app/server + bucket IA + health)

**Files:**
- Modify: `meubly-back/app.js:39-44`
- Create: `meubly-back/server.js`
- Create: `meubly-back/routes/v1/health.js`
- Modify: `meubly-back/routes/v1.js`
- Modify: `meubly-back/controllers/aiController.js:12-26` et debut de `generateScene`
- Modify: `meubly-back/package.json` (`main`, `start`, `dev`)
- Modify: `meubly-back/Dockerfile` (CMD), `render.yaml` (startCommand)
- Test: `meubly-back/tests/unit/app.test.js`, `meubly-back/tests/unit/aiBucket.test.js`

**Interfaces:**
- Produces: `app.js` exporte `app` (named) et `default` ; `server.js` n'exporte rien. `aiController.js` exporte en plus `ensureBucketOnce(): Promise<void>` et `__resetBucketStateForTests(): void`.

- [ ] **Step 1 : Creer la branche**

```bash
cd C:/Users/nahma/meubly
git checkout -b chore/phase-0-hygiene
```

- [ ] **Step 2 : Ecrire les tests qui echouent** - `meubly-back/tests/unit/app.test.js`

```js
import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";

describe("app.js", () => {
  it("n'ouvre aucun port a l'import", async () => {
    const listenSpy = vi.spyOn(express.application, "listen");
    await import("../../app.js");
    expect(listenSpy).not.toHaveBeenCalled();
    listenSpy.mockRestore();
  });

  it("GET /api/v1/health repond 200 { status: 'ok' }", async () => {
    const { app } = await import("../../app.js");
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
```

`meubly-back/tests/unit/aiBucket.test.js`

```js
import { describe, it, expect, vi, beforeEach } from "vitest";

const storage = { listBuckets: vi.fn(), createBucket: vi.fn() };
vi.mock("../../supabase.js", () => ({ supabase: { storage } }));
vi.mock("replicate", () => ({ default: vi.fn() }));

describe("aiController bucket", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../../controllers/aiController.js");
    mod.__resetBucketStateForTests();
  });

  it("n'appelle pas Storage a l'import", async () => {
    await import("../../controllers/aiController.js");
    expect(storage.listBuckets).not.toHaveBeenCalled();
  });

  it("cree le bucket une seule fois sur appels concurrents", async () => {
    storage.listBuckets.mockResolvedValue({ data: [] });
    storage.createBucket.mockResolvedValue({ error: null });
    const { ensureBucketOnce } = await import("../../controllers/aiController.js");
    await Promise.all([ensureBucketOnce(), ensureBucketOnce()]);
    expect(storage.createBucket).toHaveBeenCalledTimes(1);
  });

  it("ne memorise pas un echec", async () => {
    storage.listBuckets.mockRejectedValueOnce(new Error("down"));
    const { ensureBucketOnce } = await import("../../controllers/aiController.js");
    await expect(ensureBucketOnce()).rejects.toThrow("down");
    storage.listBuckets.mockResolvedValue({ data: [{ name: "ai-generated" }] });
    await expect(ensureBucketOnce()).resolves.toBeUndefined();
    expect(storage.listBuckets).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 3 : Lancer, constater l'echec**

Run: `cd meubly-back && npx vitest run tests/unit/app.test.js tests/unit/aiBucket.test.js`
Expected: FAIL (listen appele ; 404 sur /health ; `ensureBucketOnce` non exporte).

- [ ] **Step 4 : Implementer**

`meubly-back/routes/v1/health.js`

```js
import express from "express";

const router = express.Router();

/** Sonde de disponibilite (Render health check, CI). Ne touche pas la base. */
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default router;
```

`meubly-back/routes/v1.js` : ajouter `import healthRouter from './v1/health.js';` et `router.use(healthRouter);` AVANT `router.use('/auth', authRouter);`.

`meubly-back/app.js` : supprimer les lignes 40-43 (`const PORT` ... `});`). La fin du fichier devient :

```js
app.use('/api/v1', v1Router);
app.use(errorHandler);

export default app;
```

`meubly-back/server.js`

```js
import { app } from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur demarre sur le port ${PORT}`);
});
```

`meubly-back/controllers/aiController.js` : remplacer les lignes 12-26 par :

```js
let bucketPromise = null;

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);
  if (exists) return;
  const { error } = await supabase.storage.createBucket(BUCKET_NAME, { public: true });
  if (error) throw new Error(`[AI] Failed to create bucket "${BUCKET_NAME}": ${error.message}`);
}

/**
 * Garantit l'existence du bucket au premier usage (et non a l'import).
 * Les appels concurrents partagent la meme promesse ; un echec n'est pas memorise.
 * @returns {Promise<void>}
 */
export function ensureBucketOnce() {
  if (!bucketPromise) {
    bucketPromise = ensureBucket().catch((err) => {
      bucketPromise = null;
      throw err;
    });
  }
  return bucketPromise;
}

/** Reinitialise l'etat memoise. Reserve aux tests. */
export function __resetBucketStateForTests() {
  bucketPromise = null;
}
```

Dans `generateScene`, juste apres le bloc `if (!process.env.REPLICATE_API_TOKEN) {...}`, ajouter :

```js
      await ensureBucketOnce();
```

`meubly-back/package.json` : `"main": "server.js"`, `"start": "node server.js"`, `"dev": "nodemon server.js"`.
`meubly-back/Dockerfile` : `CMD ["node", "server.js"]`.
`render.yaml` : `startCommand: cd meubly-back && node server.js`.

- [ ] **Step 5 : Lancer les tests**

Run: `cd meubly-back && npx vitest run tests/unit tests/integration/furnitureRoutes.test.js`
Expected: PASS, aucun `EADDRINUSE`, aucun "Failed to create bucket" dans la sortie.

- [ ] **Step 6 : Smoke test du demarrage**

Run (Git Bash) : `cd meubly-back && (PORT=5055 node server.js & sleep 4; curl -s localhost:5055/api/v1/health; kill %1)`
Expected: `{"status":"ok"}`

- [ ] **Step 7 : Commit**

```bash
git add meubly-back/app.js meubly-back/server.js meubly-back/routes/v1.js meubly-back/routes/v1/health.js meubly-back/controllers/aiController.js meubly-back/package.json meubly-back/Dockerfile render.yaml meubly-back/tests/unit/app.test.js meubly-back/tests/unit/aiBucket.test.js
git commit -m "refactor(back): split app/server, lazy AI bucket init, add health route"
```

---

### Task 2 : Isoler le test sur base reelle derriere un garde-fou

**Files:**
- Move: `meubly-back/tests/integration/favorites.test.js` -> `meubly-back/tests/db/favorites.db.test.js`
- Create: `meubly-back/tests/db/guard.js`, `meubly-back/tests/unit/dbGuard.test.js`, `meubly-back/vitest.db.config.js`
- Modify: `meubly-back/vitest.config.js`, `meubly-back/package.json`

**Interfaces:**
- Produces: `assertLocalSupabase(url: string | undefined): void` (leve si l'hote n'est pas local).

- [ ] **Step 1 : Test qui echoue** - `meubly-back/tests/unit/dbGuard.test.js`

```js
import { describe, it, expect } from "vitest";
import { assertLocalSupabase } from "../db/guard.js";

describe("assertLocalSupabase", () => {
  it.each(["http://localhost:8000", "http://127.0.0.1:8000", "http://kong:8000"])(
    "accepte %s",
    (url) => expect(() => assertLocalSupabase(url)).not.toThrow()
  );

  it.each([
    "https://rlxyptqvtpdhrdpdoiwy.supabase.co",
    "https://localhost.evil.com",
    undefined,
    "pas-une-url",
  ])("refuse %s", (url) => expect(() => assertLocalSupabase(url)).toThrow(/local/i));
});
```

- [ ] **Step 2 : Constater l'echec**

Run: `cd meubly-back && npx vitest run tests/unit/dbGuard.test.js` -> FAIL (module introuvable).

- [ ] **Step 3 : Implementer** - `meubly-back/tests/db/guard.js`

```js
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "kong", "host.docker.internal"]);

/**
 * Empeche les tests DB (qui creent des utilisateurs) de viser une base distante.
 * @param {string | undefined} url
 */
export function assertLocalSupabase(url) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error("Tests DB : SUPABASE_URL absente ou invalide, base locale requise.");
  }
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`Tests DB : hote "${host}" refuse, base locale requise.`);
  }
}
```

- [ ] **Step 4 : Deplacer et corriger le test DB**

```bash
mkdir -p meubly-back/tests/db
git mv meubly-back/tests/integration/favorites.test.js meubly-back/tests/db/favorites.db.test.js
```

Dans `favorites.db.test.js` :
- ajouter `import { assertLocalSupabase } from "./guard.js";` et, en premiere ligne du `beforeAll`, `assertLocalSupabase(process.env.SUPABASE_URL);` ;
- remplacer `from('User')` par `from('profile')` et `.select('id')` par `.select('user_id')` ;
- remplacer `from('Furniture')` par `from('furniture')` ;
- supprimer les deux lignes `console.log = console.warn; console.error = console.warn;`.

`meubly-back/vitest.config.js` : dans `test`, ajouter `exclude: ["node_modules/**", "tests/db/**"],`.

`meubly-back/vitest.db.config.js`

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/db/**/*.db.test.js"],
    hookTimeout: 30000,
  },
});
```

`meubly-back/package.json` scripts : ajouter `"test:db": "vitest run --config vitest.db.config.js"`.

- [ ] **Step 5 : Verifier**

Run: `cd meubly-back && npm run test:run`
Expected: toutes les suites PASS, 0 erreur non geree, `tests/db` absent de la sortie.

- [ ] **Step 6 : Commit**

```bash
git add meubly-back/tests meubly-back/vitest.config.js meubly-back/vitest.db.config.js meubly-back/package.json
git commit -m "test(back): isolate real-DB favorites test behind local-only guard"
```

---

### Task 3 : Reecrire les tests API front sur l'API actuelle

**Files:**
- Rewrite: `meubly-front/tests/unit/api.test.js`

**Interfaces:**
- Consumes: `getFurnitures`, `getFurnitureById`, `searchFurnitures`, `updateFurniture`, `getFurnitureOffers`, `addFavorite`, `removeFavorite`, `getUserFavorites`, `loginUser`, `logoutUser` depuis `src/clientapi.js` ; `API_BASE` depuis `src/api/apiBase.js`.

- [ ] **Step 1 : Ecrire le nouveau fichier** - `meubly-front/tests/unit/api.test.js`

```js
import { describe, it, expect, vi, beforeEach } from "vitest";
import API_BASE from "../../src/api/apiBase";
import {
  getFurnitures,
  getFurnitureById,
  searchFurnitures,
  updateFurniture,
  getFurnitureOffers,
  addFavorite,
  removeFavorite,
  getUserFavorites,
  loginUser,
  logoutUser,
} from "../../src/clientapi";

vi.mock("../../src/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

const { supabase } = await import("../../src/supabase");

const okJson = (body) => ({ ok: true, status: 200, json: async () => body, text: async () => "" });
const errJson = (status, body = {}) => ({ ok: false, status, json: async () => body, text: async () => "" });
const withSession = () =>
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { access_token: "tok" } },
    error: null,
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("getFurnitures", () => {
  it("construit l'URL avec filtres et pagination", async () => {
    fetch.mockResolvedValueOnce(okJson({ items: [], total: 0, page: 2, limit: 12 }));
    await getFurnitures({ q: "table", categoryId: 3, minPrice: 0, page: 2 });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(`${API_BASE}/furnitures`);
    expect(url.searchParams.get("q")).toBe("table");
    expect(url.searchParams.get("categoryId")).toBe("3");
    expect(url.searchParams.get("minPrice")).toBe("0");
    expect(url.searchParams.has("maxPrice")).toBe(false);
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("leve une erreur sur reponse HTTP en echec", async () => {
    fetch.mockResolvedValueOnce(errJson(500));
    await expect(getFurnitures()).rejects.toThrow("Erreur HTTP: 500");
  });
});

describe("searchFurnitures", () => {
  it("delegue a getFurnitures avec q", async () => {
    fetch.mockResolvedValueOnce(okJson({ items: [] }));
    await searchFurnitures("lit", { page: 3 });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.searchParams.get("q")).toBe("lit");
    expect(url.searchParams.get("page")).toBe("3");
  });
});

describe("getFurnitureById", () => {
  it("retourne le meuble", async () => {
    fetch.mockResolvedValueOnce(okJson({ furniture_id: "a1", title: "Chaise" }));
    await expect(getFurnitureById("a1")).resolves.toEqual({ furniture_id: "a1", title: "Chaise" });
    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/furnitures/a1`);
  });

  it("propage le message d'erreur du serveur", async () => {
    fetch.mockResolvedValueOnce(errJson(404, { error: "Meuble non trouve" }));
    await expect(getFurnitureById("zz")).rejects.toThrow("Meuble non trouve");
  });
});

describe("updateFurniture", () => {
  it("envoie un PATCH JSON", async () => {
    fetch.mockResolvedValueOnce(okJson({ furniture_id: "a1", title: "X" }));
    await updateFurniture("a1", { title: "X" });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE}/furnitures/a1`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ title: "X" });
  });
});

describe("getFurnitureOffers", () => {
  it("appelle /furnitures/:id/offers", async () => {
    fetch.mockResolvedValueOnce(okJson([{ offer_id: "o1" }]));
    await expect(getFurnitureOffers("a1")).resolves.toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/furnitures/a1/offers`);
  });
});

describe("favoris", () => {
  it("addFavorite envoie le token Bearer", async () => {
    withSession();
    fetch.mockResolvedValueOnce(okJson({ message: "Added to favorites" }));
    await expect(addFavorite("a1")).resolves.toBe(true);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE}/favorites/a1`);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("addFavorite refuse sans session", async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(addFavorite("a1")).rejects.toThrow("Utilisateur non connecté");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("removeFavorite envoie un DELETE", async () => {
    withSession();
    fetch.mockResolvedValueOnce(okJson({}));
    await removeFavorite("a1");
    expect(fetch.mock.calls[0][1].method).toBe("DELETE");
  });

  it("getUserFavorites retourne [] sans session", async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(getUserFavorites()).resolves.toEqual([]);
  });
});

describe("auth", () => {
  it("loginUser traduit les identifiants invalides", async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {},
      error: { message: "Invalid login credentials" },
    });
    await expect(loginUser({ email: "a@b.fr", password: "x" })).rejects.toThrow(
      "Email ou mot de passe incorrect"
    );
  });

  it("loginUser retourne le profil et memorise le role", async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "u1" }, session: {} },
      error: null,
    });
    const single = vi.fn().mockResolvedValue({ data: { user_id: "u1", role: "USER" }, error: null });
    supabase.from.mockReturnValue({ select: () => ({ eq: () => ({ single }) }) });
    const result = await loginUser({ email: "a@b.fr", password: "x" });
    expect(result.profile.role).toBe("USER");
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "userProfile",
      JSON.stringify({ id: "u1", role: "USER" })
    );
  });

  it("logoutUser appelle signOut", async () => {
    supabase.auth.signOut.mockResolvedValueOnce({ error: null });
    await logoutUser();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
```

Note : `registerUser` n'est volontairement pas teste ici, il sera reecrit en phase 1 (suppression de `password_hash`).

- [ ] **Step 2 : Lancer**

Run: `cd meubly-front && npx vitest run`
Expected: PASS sur `api.test.js` et `stores.test.js`. Si un test echoue, c'est un vrai bug du module : l'analyser (superpowers:systematic-debugging) avant de toucher au test.

- [ ] **Step 3 : Commit**

```bash
git add meubly-front/tests/unit/api.test.js
git commit -m "test(front): rewrite API tests against current src/api modules"
```

---

### Task 4 : ESLint + Prettier (back et front)

**Files:**
- Modify: `meubly-back/eslint.config.js`, `meubly-back/package.json`
- Create: `meubly-back/.prettierignore`, `meubly-front/eslint.config.js`, `meubly-front/.prettierrc`, `meubly-front/.prettierignore`
- Modify: `meubly-front/package.json`

Choix : Prettier n'est PAS branche dans ESLint (`eslint-plugin-prettier` retire). ESLint juge la qualite, `prettier --check` le format. Plus rapide, messages plus clairs, et l'editeur formate seul.

- [ ] **Step 1 : Installer**

```bash
cd meubly-back && npm i -D eslint@^10.12.0 @eslint/js@^10.0.1 globals@^17.13.0 eslint-config-prettier@^10.1.8 prettier@^3.9.10
cd ../meubly-front && npm i -D eslint@^10.12.0 @eslint/js@^10.0.1 globals@^17.13.0 eslint-plugin-vue@^10.11.1 eslint-config-prettier@^10.1.8 prettier@^3.9.10
```

- [ ] **Step 2 : Config back** - remplacer `meubly-back/eslint.config.js`

```js
import globals from "globals";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["node_modules/**", "coverage/**"] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: globals.node },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_|^next$" }],
    },
  },
  {
    files: ["tests/**"],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },
  prettier,
];
```

`meubly-back/.prettierignore` : `node_modules`, `coverage`, `package-lock.json`, `scripts/*.json`.

Scripts `meubly-back/package.json` : `"lint": "eslint ."`, `"format": "prettier --write ."`, `"format:check": "prettier --check ."`.

- [ ] **Step 3 : Config front** - `meubly-front/eslint.config.js`

```js
import globals from "globals";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["dist/**", "node_modules/**", "coverage/**", "cypress/videos/**", "cypress/screenshots/**"] },
  js.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: { "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }] },
  },
  {
    files: ["tests/**", "**/*.config.js"],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },
  {
    files: ["cypress/**"],
    languageOptions: { globals: { ...globals.browser, cy: "readonly", Cypress: "readonly", describe: "readonly", it: "readonly", beforeEach: "readonly", expect: "readonly" } },
  },
  prettier,
];
```

Copier `meubly-back/.prettierrc` vers `meubly-front/.prettierrc`. `meubly-front/.prettierignore` : `dist`, `node_modules`, `coverage`, `package-lock.json`, `public`.
Scripts front : `"lint": "eslint ."`, `"format": "prettier --write ."`, `"format:check": "prettier --check ."`.

- [ ] **Step 4 : Mesurer**

Run: `npm run lint` dans chaque projet. Noter le nombre d'erreurs (pas les warnings).

- [ ] **Step 5 : Commit config seule**

```bash
git add meubly-back/eslint.config.js meubly-back/.prettierignore meubly-back/package.json meubly-back/package-lock.json meubly-front/eslint.config.js meubly-front/.prettierrc meubly-front/.prettierignore meubly-front/package.json meubly-front/package-lock.json
git commit -m "chore(lint): working ESLint flat config and Prettier for back and front"
```

- [ ] **Step 6 : Reformatage mecanique (commit isole)**

```bash
cd meubly-back && npm run format && cd ../meubly-front && npm run format
cd meubly-back && npm run test:run && cd ../meubly-front && npx vitest run && npm run build
git add -A meubly-back meubly-front
git commit -m "style: apply Prettier formatting (no logic change)"
```

Expected : tests et build verts. Sinon : `git checkout -- .` puis exclure le fichier fautif via `.prettierignore` et recommencer.

- [ ] **Step 7 : Corriger les erreurs ESLint restantes**

Corriger uniquement les `error` (ex. `no-undef`, `vue/no-mutating-props`, `no-empty`). Chaque correction doit etre comprise ; si elle change un comportement, ajouter un test. Les `warn` restent pour plus tard.

Run: `npm run lint` (0 erreur) puis tests + build front.

```bash
git add -A meubly-back meubly-front
git commit -m "fix(lint): resolve ESLint errors"
```

---

### Task 5 : Retirer les dependances mortes

Verifie le 2026-10-15 : aucune importation de `@auth0/auth0-vue` hors `src/main.js`, ni de `@prisma/client`, `prisma`, `jsonwebtoken`, `zod`, `@google/generative-ai` dans le code back/front/scripts. `bcrypt`/`bcryptjs` restent (retires en phase 1 avec `password_hash`). `supertest` front : non importe dans `meubly-front/tests` -> retire.

**Files:** `meubly-front/src/main.js`, `meubly-front/package.json`, `meubly-back/package.json`, `README.md`, `docs/diagrams/architecture.md`

- [ ] **Step 1 : Re-verifier avant suppression**

Run: `git grep -nE "auth0|prisma|jsonwebtoken|from ['\"]zod|generative-ai|supertest" -- meubly-front/src meubly-front/tests meubly-back ':!*package*.json' ':!*.md'`
Expected : seulement `meubly-front/src/main.js` (auth0) et les tests back (supertest back, conserve).

- [ ] **Step 2 : Supprimer**

Dans `meubly-front/src/main.js`, retirer l'import `createAuth0` et le bloc `app.use(createAuth0, {...})`.

```bash
cd meubly-front && npm uninstall @auth0/auth0-vue supertest
cd ../meubly-back && npm uninstall @prisma/client prisma jsonwebtoken zod @google/generative-ai
```

- [ ] **Step 3 : Docs** : dans `README.md` et `docs/diagrams/architecture.md`, remplacer les mentions "JWT · Zod" du back par "Supabase Auth · express-validator".

- [ ] **Step 4 : Verifier**

Run: back `npm run lint && npm run test:run` ; front `npm run lint && npx vitest run && npm run build`. Expected : tout vert.

- [ ] **Step 5 : Commit**

```bash
git add meubly-front meubly-back README.md docs/diagrams/architecture.md
git commit -m "chore(deps): remove unused Auth0, Prisma, jsonwebtoken, zod, Gemini SDK"
```

---

### Task 6 : CI GitHub Actions

**Files:** Create `.github/workflows/ci.yml`

- [ ] **Step 1 : Ecrire le workflow**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [master]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  back:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: meubly-back
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: meubly-back/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run test:run

  front:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: meubly-front
    env:
      CYPRESS_INSTALL_BINARY: 0
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: meubly-front/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run test:run
      - run: npm run build
        env:
          VITE_API_BASE_URL: http://localhost:5000/api/v1
          VITE_SUPABASE_URL: http://localhost:8000
          VITE_SUPABASE_ANON_KEY: ci-placeholder
```

Pas de secret dans la CI : les tests mockent Supabase, le build n'a besoin que de valeurs factices.

- [ ] **Step 2 : Simuler localement**

Run: back `npm ci && npm run lint && npm run format:check && npm run test:run` ; front idem + build. Expected : vert.

- [ ] **Step 3 : Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: lint, format, test and build for back and front"
```

Le workflow ne s'executera qu'apres `git push` de la branche (action a valider par l'utilisateur).

---

### Task 7 : Versionner l'outillage (sans secret ni dump)

Decisions proposees (a confirmer a la revue du plan) :
- Versionner : `CLAUDE.md`, `.gitignore`, `docs/`, `.claude/skills/`, `skills-lock.json`, `bd/ingestion/*.mjs`, `bd/ingestion/package*.json`, `bd/generate_seed.mjs` (apres correction).
- Ignorer : dumps de donnees generes `bd/catalog_data.sql` (22 Mo), `bd/seed_cloud.sql`, `bd/ingestion/ikea_seed.sql` (catalogue seul, regenerable). `bd/cloud_migration.sql` : ignore, remplace par la baseline de migrations en phase 2.
- `.env.example` : reste ignore jusqu'a verification humaine de ses cles JWT.

**Files:** `bd/generate_seed.mjs:5`, `.gitignore`

- [ ] **Step 1 : Retirer la cle en dur** dans `bd/generate_seed.mjs`, ligne 5 :

```js
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY manquante (voir .env.example)");
  process.exit(1);
}
```

- [ ] **Step 2 : Verifier qu'aucun secret ne part**

Run: `git grep -nE "eyJ[A-Za-z0-9_-]{20,}" -- bd .claude docs CLAUDE.md ; grep -rnE "eyJ[A-Za-z0-9_-]{20,}" bd/generate_seed.mjs bd/ingestion/*.mjs`
Expected : aucune sortie.

- [ ] **Step 3 : Ignorer les dumps** : ajouter a `.gitignore`

```
# Dumps de donnees generes (catalogue, regenerables)
bd/catalog_data.sql
bd/seed_cloud.sql
bd/cloud_migration.sql
bd/ingestion/ikea_seed.sql
```

- [ ] **Step 4 : Commit**

```bash
git add .gitignore CLAUDE.md docs .claude/skills skills-lock.json bd/generate_seed.mjs bd/ingestion/*.mjs bd/ingestion/package.json bd/ingestion/package-lock.json
git status --short
git commit -m "chore: track Claude tooling, docs and ingestion scripts; ignore data dumps"
```

`README.md` (modifie avant la phase) : relire le diff avec l'utilisateur avant de l'inclure.

---

## Fin de phase

- [ ] back : `npm run lint && npm run format:check && npm run test:run` vert
- [ ] front : idem + `npm run build` vert
- [ ] Revue de branche (superpowers:requesting-code-review), puis push + PR apres accord utilisateur
- [ ] Cocher les points 1 a 8 de `docs/ROADMAP.md`
