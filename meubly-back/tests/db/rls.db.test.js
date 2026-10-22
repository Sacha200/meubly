import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient, anonClient, createTestUser, deleteTestUser } from "./helpers.js";

/** Une ecriture refusee par RLS ou par les droits : erreur, ou 0 ligne touchee. */
function denied({ data, error }) {
  return Boolean(error) || (Array.isArray(data) && data.length === 0);
}

describe("RLS (base locale)", () => {
  let a;
  let b;
  let furnitureId;
  const admin = adminClient();
  const anon = anonClient();

  beforeAll(async () => {
    a = await createTestUser({ metadata: { username: "user_a" } });
    b = await createTestUser({ metadata: { username: "user_b" } });
    const { data, error } = await admin.from("furniture").select("furniture_id").limit(1).single();
    if (error) throw error;
    furnitureId = data.furniture_id;
  });

  afterAll(async () => {
    await deleteTestUser(a?.id).catch(() => {});
    await deleteTestUser(b?.id).catch(() => {});
    // Si une ecriture "interdite" a reussi (test rouge), ne pas laisser de trace.
    await admin.from("category").delete().eq("label", "rls-pirate");
    await admin.from("furniture").delete().eq("title", "rls-pirate");
  });

  describe("visiteur (anon)", () => {
    it("lit le catalogue et les avis", async () => {
      const furniture = await anon.from("furniture").select("furniture_id").limit(1);
      expect(furniture.error).toBeNull();
      expect(furniture.data.length).toBe(1);
      expect((await anon.from("review").select("review_id").limit(1)).error).toBeNull();
    });

    it("ne lit aucun profil", async () => {
      const { data, error } = await anon.from("profile").select("user_id").limit(5);
      expect(Boolean(error) || data.length === 0).toBe(true);
    });

    it("n'ecrit pas le catalogue", async () => {
      expect(denied(await anon.from("category").insert({ label: "rls-pirate" }).select())).toBe(
        true
      );
    });
  });

  describe("utilisateur connecte", () => {
    it("lit son profil mais pas celui d'un autre", async () => {
      const own = await a.client.from("profile").select("user_id").eq("user_id", a.id);
      expect(own.data).toHaveLength(1);
      const other = await a.client.from("profile").select("user_id").eq("user_id", b.id);
      expect(other.data).toEqual([]);
    });

    it("ne peut pas modifier son role", async () => {
      const res = await a.client
        .from("profile")
        .update({ role: "ADMIN" })
        .eq("user_id", a.id)
        .select();
      expect(denied(res)).toBe(true);
      const { data } = await admin.from("profile").select("role").eq("user_id", a.id).single();
      expect(data.role).toBe("USER");
    });

    it("gere ses favoris sans voir ceux des autres", async () => {
      const add = await a.client
        .from("favorite")
        .insert({ user_id: a.id, furniture_id: furnitureId })
        .select();
      expect(add.error).toBeNull();
      expect((await a.client.from("favorite").select("furniture_id")).data).toHaveLength(1);
      expect((await b.client.from("favorite").select("furniture_id")).data).toEqual([]);
    });

    it("ne cree pas de favori au nom d'un autre", async () => {
      const res = await a.client
        .from("favorite")
        .insert({ user_id: b.id, furniture_id: furnitureId })
        .select();
      expect(denied(res)).toBe(true);
    });

    it("gere son avis, qu'un autre ne peut ni modifier ni supprimer", async () => {
      const created = await a.client
        .from("review")
        .insert({ user_id: a.id, furniture_id: furnitureId, rating: 5 })
        .select()
        .single();
      expect(created.error).toBeNull();
      const id = created.data.review_id;

      expect(
        denied(await b.client.from("review").update({ rating: 1 }).eq("review_id", id).select())
      ).toBe(true);
      expect(denied(await b.client.from("review").delete().eq("review_id", id).select())).toBe(
        true
      );

      const removed = await a.client.from("review").delete().eq("review_id", id).select();
      expect(removed.data).toHaveLength(1);
    });

    it("n'ecrit pas le catalogue", async () => {
      expect(
        denied(await a.client.from("furniture").insert({ title: "rls-pirate" }).select())
      ).toBe(true);
    });
  });

  it("n'a plus la fonction morte update_nb_offers", async () => {
    const { error } = await admin.rpc("update_nb_offers");
    expect(error).not.toBeNull();
  });
});
