import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient, createTestUser, deleteTestUser } from "./helpers.js";

describe("table review (base locale)", () => {
  let user;
  let furnitureId;
  const admin = adminClient();

  beforeAll(async () => {
    user = await createTestUser({ metadata: { username: "reviewer" } });
    const { data, error } = await admin.from("furniture").select("furniture_id").limit(1).single();
    if (error) throw error;
    furnitureId = data.furniture_id;
  });

  afterAll(async () => {
    await deleteTestUser(user?.id).catch(() => {});
  });

  const insert = (row) =>
    admin
      .from("review")
      .insert({ furniture_id: furnitureId, user_id: user.id, ...row })
      .select()
      .single();

  it("refuse une note hors 1-5", async () => {
    expect((await insert({ rating: 0 })).error?.code).toBe("23514");
    expect((await insert({ rating: 6 })).error?.code).toBe("23514");
  });

  it("refuse un commentaire de plus de 1000 caracteres", async () => {
    expect((await insert({ rating: 4, comment: "x".repeat(1001) })).error?.code).toBe("23514");
  });

  it("accepte un avis valide et embarque le nom du profil", async () => {
    const { error } = await insert({ rating: 4, comment: "Solide" });
    expect(error).toBeNull();
    const { data } = await admin
      .from("review")
      .select("rating, profile(username)")
      .eq("user_id", user.id)
      .single();
    expect(data).toEqual({ rating: 4, profile: { username: "reviewer" } });
  });

  it("refuse un second avis du meme utilisateur sur le meme meuble", async () => {
    expect((await insert({ rating: 2 })).error?.code).toBe("23505");
  });

  it("supprime les avis avec le compte", async () => {
    await deleteTestUser(user.id);
    const { data } = await admin.from("review").select("review_id").eq("user_id", user.id);
    expect(data).toEqual([]);
  });
});
