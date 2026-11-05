import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "./helpers.js";

// Seed : KIVIK a 3 offres actives, totaux 648 (IKEA 599 + 49), 549 (Demo Meubles 549 + 0)
// et inconnu (Demo Deco, livraison non renseignee).
const KIVIK = "f0000000-0000-4000-8000-000000000001";
const IKEA = "8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1";

describe("offres d'un meuble via l'API (base locale)", () => {
  let app;
  const admin = adminClient();

  beforeAll(async () => {
    ({ app } = await import("../../app.js"));
    const { error } = await admin.from("offer").insert({
      furniture_id: KIVIK,
      partner_id: IKEA,
      url_website: "https://www.ikea.com/api-stale",
      price: 1,
      status: "stale",
      seller_name: "api-stale",
    });
    if (error) throw error;
  });

  afterAll(async () => {
    await admin.from("offer").delete().eq("seller_name", "api-stale");
  });

  it("ne renvoie que les offres actives, par prix total croissant, total inconnu en dernier", async () => {
    const res = await request(app).get(`/api/v1/furnitures/${KIVIK}/offers`);
    expect(res.status).toBe(200);
    expect(res.body.map((o) => [o.partner.name, o.total_price])).toEqual([
      ["Demo Meubles", 549],
      ["Ikea", 648],
      ["Demo Deco", null],
    ]);
    expect(res.body[0].is_best_price).toBe(true);
  });

  it("expose les conditions d'achat et le statut affilie, plus is_active", async () => {
    const res = await request(app).get(`/api/v1/furnitures/${KIVIK}/offers`);
    const ikea = res.body.find((o) => o.partner.name === "Ikea");
    expect(ikea).toMatchObject({
      price: 599,
      shipping_cost: 49,
      eco_fee: 6.5,
      availability: "in_stock",
      delivery_min_days: 7,
      delivery_max_days: 14,
      delivery_mode: "room_of_choice",
      assembly_included: false,
      return_days: 365,
      condition: "new",
      seller_name: null,
      partner: { name: "Ikea", is_affiliate: false },
    });
    expect(ikea.last_seen_at).toBeTruthy();
    expect(ikea).not.toHaveProperty("is_active");
  });
});
