import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestUser, deleteTestUser, sqlClient } from "./helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = fs.readFileSync(
  path.join(__dirname, "../../../bd/supabase/oneoff/2026-11-phase2-cleanup.sql"),
  "utf8"
);
const IKEA = "8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1";
const DEMO = "d0000000-0000-4000-8000-000000000001";
const DEMO_ONLY = "f0000000-0000-4000-8000-0000000000d1";

/** Execute le script dans une transaction annulee : le seed reste intact. */
async function inRollback(sql, fn) {
  await sql.query("BEGIN");
  try {
    return await fn();
  } finally {
    await sql.query("ROLLBACK");
  }
}

/** Ajoute un meuble qui n'existe qu'a travers une offre de demo. */
async function addDemoOnlyFurniture(sql) {
  await sql.query(
    "insert into public.furniture (furniture_id, title, cached_min_price, cached_nb_offers) values ($1, 'Demo seul', 10, 1)",
    [DEMO_ONLY]
  );
  await sql.query(
    "insert into public.offer (furniture_id, partner_id, url_website, price) values ($1, $2, 'https://demo.example/x', 10)",
    [DEMO_ONLY, DEMO]
  );
}

const count = async (sql, query, params) => Number((await sql.query(query, params)).rows[0].n);

describe("nettoyage des donnees de demo (base locale, transaction annulee)", () => {
  let sql;
  let user;

  beforeAll(async () => {
    sql = await sqlClient();
    user = await createTestUser();
  });

  afterAll(async () => {
    await sql?.end();
    await deleteTestUser(user?.id);
  });

  it("ne garde que les offres et le partenaire IKEA, supprime les meubles demo, recalcule les caches", async () => {
    await inRollback(sql, async () => {
      await addDemoOnlyFurniture(sql);
      const furnitureBefore = await count(sql, "select count(*) n from public.furniture");

      for (let run = 0; run < 2; run += 1) {
        await sql.query(SCRIPT);
        expect(
          await count(sql, "select count(*) n from public.offer where partner_id <> $1", [IKEA])
        ).toBe(0);
        expect((await sql.query("select partner_id from public.partner")).rows).toEqual([
          { partner_id: IKEA },
        ]);
        expect(
          await count(sql, "select count(*) n from public.furniture where furniture_id = $1", [
            DEMO_ONLY,
          ])
        ).toBe(0);
        expect(await count(sql, "select count(*) n from public.furniture")).toBe(
          furnitureBefore - 1
        );
        // Caches = offres IKEA actives seules (KIVIK : 599, une offre)
        const { rows } = await sql.query(
          "select cached_min_price::float as min, cached_nb_offers as nb from public.furniture where furniture_id = 'f0000000-0000-4000-8000-000000000001'"
        );
        expect(rows).toEqual([{ min: 599, nb: 1 }]);
      }
    });
  });

  it("s'arrete si une paire (meuble, partenaire) reste en double", async () => {
    await inRollback(sql, async () => {
      await sql.query(
        "insert into public.offer (furniture_id, partner_id, url_website, price) values ('f0000000-0000-4000-8000-000000000001', $1, 'https://www.ikea.com/dup', 1)",
        [IKEA]
      );
      await expect(sql.query(SCRIPT)).rejects.toThrow(/doublon/i);
    });
  });

  it("s'arrete au lieu d'effacer un favori pose sur un meuble de demo", async () => {
    await inRollback(sql, async () => {
      await addDemoOnlyFurniture(sql);
      await sql.query("insert into public.favorite (user_id, furniture_id) values ($1, $2)", [
        user.id,
        DEMO_ONLY,
      ]);
      await expect(sql.query(SCRIPT)).rejects.toThrow(/favori|avis/i);
    });
  });
});
