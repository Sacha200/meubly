import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "./helpers.js";

const IKEA = "8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1";

describe("offre (base locale)", () => {
  const admin = adminClient();
  let furnitureId;

  /** Insere une offre sur le meuble de test et renvoie { data, error }. */
  const insert = (fields) =>
    admin
      .from("offer")
      .insert({
        furniture_id: furnitureId,
        partner_id: IKEA,
        url_website: "https://www.ikea.com/offer-test",
        price: 100,
        ...fields,
      })
      .select()
      .single();

  /** Chaque test repart sans offre sur le meuble de test. */
  const reset = () => admin.from("offer").delete().eq("furniture_id", furnitureId);

  beforeAll(async () => {
    const { data, error } = await admin
      .from("furniture")
      .insert({ title: "offer-test" })
      .select("furniture_id")
      .single();
    if (error) throw error;
    furnitureId = data.furniture_id;
  });

  afterAll(async () => {
    // Les offres partent par cascade
    await admin.from("furniture").delete().eq("furniture_id", furnitureId);
  });

  it("calcule total_price = price + shipping_cost, NULL si livraison inconnue", async () => {
    await reset();
    const known = await insert({ price: 100, shipping_cost: 9.9 });
    expect(known.error).toBeNull();
    expect(Number(known.data.total_price)).toBe(109.9);

    await reset();
    const unknown = await insert({ price: 100 });
    expect(unknown.error).toBeNull();
    expect(unknown.data.total_price).toBeNull();
  });

  it("applique les valeurs par defaut", async () => {
    await reset();
    const { data, error } = await insert({});
    expect(error).toBeNull();
    expect(data).toMatchObject({
      status: "active",
      availability: "unknown",
      delivery_mode: "unknown",
      condition: "new",
    });
    expect(data.last_seen_at).not.toBeNull();
    expect(data.created_at).not.toBeNull();
  });

  it.each([
    ["prix negatif", { price: -1 }],
    ["livraison negative", { shipping_cost: -1 }],
    ["eco-participation superieure au prix", { price: 10, eco_fee: 11 }],
    ["delai minimum superieur au maximum", { delivery_min_days: 5, delivery_max_days: 2 }],
    ["retour negatif", { return_days: -1 }],
    ["meuble absent", { furniture_id: null }],
    ["partenaire absent", { partner_id: null }],
  ])("refuse une offre invalide : %s", async (_label, fields) => {
    await reset();
    const { error } = await insert(fields);
    expect(error).not.toBeNull();
  });

  it("refuse une seconde annonce identique, vendeur inconnu compris (NULLS NOT DISTINCT)", async () => {
    await reset();
    expect((await insert({})).error).toBeNull();
    expect((await insert({})).error).not.toBeNull();
    expect((await insert({ condition: "used" })).error).toBeNull();
    expect((await insert({ seller_name: "X" })).error).toBeNull();
  });
});
