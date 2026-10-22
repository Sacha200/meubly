import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient, createTestUser, deleteTestUser } from "./helpers.js";

describe("parcours avis via l'API (base locale)", () => {
  let app;
  let user;
  let furnitureId;
  const base = () => `/api/v1/furnitures/${furnitureId}/reviews`;
  const auth = () => ({ Authorization: `Bearer ${user.token}` });

  beforeAll(async () => {
    ({ app } = await import("../../app.js"));
    user = await createTestUser({ metadata: { username: "parcours_avis" } });
    // Meuble de demo a l'id hors norme RFC (aaaaaaaa-...) : le parcours doit fonctionner aussi
    // pour ces ids, presents en local comme en prod.
    const { data, error } = await adminClient()
      .from("furniture")
      .select("furniture_id")
      .eq("furniture_id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2")
      .single();
    if (error) throw error;
    furnitureId = data.furniture_id;
  });

  afterAll(async () => {
    await deleteTestUser(user?.id);
  });

  it("publie, modifie, liste puis supprime son avis", async () => {
    const created = await request(app)
      .post(base())
      .set(auth())
      .send({ rating: 4, comment: "Bien" });
    expect(created.status).toBe(201);

    const updated = await request(app).post(base()).set(auth()).send({ rating: 5 });
    expect(updated.status).toBe(200);
    expect(updated.body.review).toMatchObject({ rating: 5, comment: null });

    const list = await request(app).get(base());
    expect(list.status).toBe(200);
    const mine = list.body.items.find((item) => item.review_id === created.body.review.review_id);
    expect(mine).toMatchObject({ rating: 5, author_name: "parcours_avis" });
    expect(mine).not.toHaveProperty("user_id");

    const me = await request(app).get(`${base()}/me`).set(auth());
    expect(me.body.review.review_id).toBe(created.body.review.review_id);

    expect((await request(app).delete(`${base()}/me`).set(auth())).status).toBe(204);
    expect((await request(app).get(`${base()}/me`).set(auth())).body).toEqual({ review: null });
  });
});
