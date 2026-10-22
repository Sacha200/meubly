import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient, createTestUser, deleteTestUser } from "./helpers.js";

describe("Favorites (base locale)", () => {
  let app;
  let user;
  let furnitureId;

  beforeAll(async () => {
    // Import dynamique : l'app doit lire les variables posees par tests/db/env.js.
    ({ app } = await import("../../app.js"));
    user = await createTestUser();
    const { data, error } = await adminClient()
      .from("furniture")
      .select("furniture_id")
      .limit(1)
      .single();
    if (error) throw error;
    furnitureId = data.furniture_id;
  });

  afterAll(async () => {
    await deleteTestUser(user?.id);
  });

  it("ajoute un meuble aux favoris", async () => {
    const res = await request(app)
      .post(`/api/v1/favorites/${furnitureId}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Added to favorites");
  });

  it("liste les favoris de l'utilisateur", async () => {
    const res = await request(app)
      .get("/api/v1/favorites")
      .set("Authorization", `Bearer ${user.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.some((f) => f.furniture_id === furnitureId)).toBe(true);
  });

  it("retire un meuble des favoris", async () => {
    const res = await request(app)
      .delete(`/api/v1/favorites/${furnitureId}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(res.statusCode).toBe(200);
    const check = await request(app)
      .get("/api/v1/favorites")
      .set("Authorization", `Bearer ${user.token}`);
    expect(check.body.find((f) => f.furniture_id === furnitureId)).toBeUndefined();
  });
});
