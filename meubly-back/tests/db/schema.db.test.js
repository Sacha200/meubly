import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient, sqlClient } from "./helpers.js";

describe("schema (base locale)", () => {
  let sql;

  beforeAll(async () => {
    sql = await sqlClient();
  });

  afterAll(async () => {
    await sql?.end();
  });

  describe("extensions", () => {
    it("installe pg_trgm dans le schema extensions, pas dans public", async () => {
      const { rows } = await sql.query(
        "select extnamespace::regnamespace::text as schema from pg_extension where extname = 'pg_trgm'"
      );
      expect(rows).toEqual([{ schema: "extensions" }]);
    });

    it("n'installe pas pg_graphql (inutilise par l'application)", async () => {
      const { rowCount } = await sql.query(
        "select 1 from pg_extension where extname = 'pg_graphql'"
      );
      expect(rowCount).toBe(0);
    });

    it("indexe furniture.title en trigram pour la recherche", async () => {
      const { rows } = await sql.query(
        "select indexdef from pg_indexes where schemaname = 'public' and indexname = 'furniture_title_trgm_idx'"
      );
      expect(rows).toHaveLength(1);
      // pg_indexes omet le schema de l'operateur (extensions est dans le search_path)
      expect(rows[0].indexdef).toMatch(/USING gin \(title (extensions\.)?gin_trgm_ops\)/);
    });
  });

  describe("meuble et partenaire", () => {
    /** Execute la requete dans une transaction annulee ; renvoie l'erreur Postgres ou null. */
    async function tryInRollback(...queries) {
      await sql.query("BEGIN");
      try {
        for (const [text, params] of queries) await sql.query(text, params);
        return null;
      } catch (error) {
        return error;
      } finally {
        await sql.query("ROLLBACK");
      }
    }
    const insertFurniture = (fields) => {
      const columns = ["title", ...Object.keys(fields)];
      const values = ["schema-test", ...Object.values(fields)];
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
      return [
        `insert into public.furniture (${columns.join(", ")}) values (${placeholders})`,
        values,
      ];
    };

    it.each([
      ["largeur nulle", { size_width: 0 }],
      ["hauteur negative", { size_height: -1 }],
      ["profondeur nulle", { size_depth: 0 }],
      ["poids nul", { weight_kg: 0 }],
      ["GTIN non numerique", { gtin: "abc" }],
      ["GTIN de 11 chiffres", { gtin: "12345678901" }],
      ["attributs en tableau", { attributes: "[]" }],
    ])("refuse un meuble invalide : %s", async (_label, fields) => {
      const error = await tryInRollback(insertFurniture(fields));
      expect(error?.code).toBe("23514");
    });

    it("accepte un meuble complet", async () => {
      const error = await tryInRollback(
        insertFurniture({
          brand: "IKEA",
          gtin: "00012345678905",
          manufacturer_ref: "S69598332",
          weight_kg: 42.5,
          attributes: '{"couleur": "blanc"}',
        })
      );
      expect(error).toBeNull();
    });

    it("refuse deux meubles avec le meme GTIN, accepte plusieurs GTIN vides", async () => {
      const duplicate = await tryInRollback(
        insertFurniture({ gtin: "12345678" }),
        insertFurniture({ gtin: "12345678" })
      );
      expect(duplicate?.code).toBe("23505");
      expect(await tryInRollback(insertFurniture({}), insertFurniture({}))).toBeNull();
    });

    it("cree un partenaire non affilie par defaut", async () => {
      await sql.query("BEGIN");
      try {
        const { rows } = await sql.query(
          "insert into public.partner (name) values ('schema-test') returning is_affiliate"
        );
        expect(rows).toEqual([{ is_affiliate: false }]);
      } finally {
        await sql.query("ROLLBACK");
      }
    });

    it.each([
      ["category", "parent_id"],
      ["favorite", "furniture_id"],
      ["furniture_category", "category_id"],
    ])("indexe la cle etrangere %s.%s", async (table, column) => {
      const { rowCount } = await sql.query(
        `select 1 from pg_index i
         join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
         where i.indrelid = $1::regclass and a.attname = $2`,
        [`public.${table}`, column]
      );
      expect(rowCount).toBeGreaterThan(0);
    });
  });

  it("recherche par titre (ilike) comme le back", async () => {
    const { data, error } = await adminClient()
      .from("furniture")
      .select("furniture_id")
      .ilike("title", "%kivik%");
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThanOrEqual(1);
  });
});
