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

  it("recherche par titre (ilike) comme le back", async () => {
    const { data, error } = await adminClient()
      .from("furniture")
      .select("furniture_id")
      .ilike("title", "%kivik%");
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThanOrEqual(1);
  });
});
