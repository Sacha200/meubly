import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sqlClient } from "./helpers.js";

const IKEA = "8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1";
const DEMO = "d0000000-0000-4000-8000-000000000001";

describe("historique de prix et caches d'offres (base locale, transactions annulees)", () => {
  let sql;

  beforeAll(async () => {
    sql = await sqlClient();
  });

  afterAll(async () => {
    await sql?.end();
  });

  /** Chaque test tourne dans une transaction annulee : le seed reste intact. */
  async function inRollback(fn) {
    await sql.query("BEGIN");
    try {
      return await fn();
    } finally {
      await sql.query("ROLLBACK");
    }
  }

  const one = async (text, params) => (await sql.query(text, params)).rows[0];

  const newFurniture = async () =>
    (await one("insert into public.furniture (title) values ('ph-test') returning furniture_id"))
      .furniture_id;

  const newOffer = async (furnitureId, partnerId, price, shipping = null) =>
    (
      await one(
        `insert into public.offer (furniture_id, partner_id, url_website, price, shipping_cost)
         values ($1, $2, 'https://example.test/ph', $3, $4) returning offer_id`,
        [furnitureId, partnerId, price, shipping]
      )
    ).offer_id;

  const history = async (offerId) =>
    (
      await sql.query(
        "select price::float as price, shipping_cost::float as shipping from public.price_history where offer_id = $1 order by price_history_id",
        [offerId]
      )
    ).rows;

  const cache = (furnitureId) =>
    one(
      "select cached_min_price::float as min, cached_nb_offers as nb from public.furniture where furniture_id = $1",
      [furnitureId]
    );

  it("trace la creation et chaque changement effectif de prix ou de livraison", async () => {
    await inRollback(async () => {
      const offerId = await newOffer(await newFurniture(), IKEA, 100, 10);
      expect(await history(offerId)).toEqual([{ price: 100, shipping: 10 }]);

      await sql.query("update public.offer set price = 90 where offer_id = $1", [offerId]);
      expect(await history(offerId)).toHaveLength(2);

      // Review Focus 3 : une offre revue sans changement de prix ne cree pas de ligne
      await sql.query(
        "update public.offer set last_seen_at = now(), price = 90 where offer_id = $1",
        [offerId]
      );
      expect(await history(offerId)).toHaveLength(2);

      await sql.query("update public.offer set shipping_cost = null where offer_id = $1", [
        offerId,
      ]);
      expect(await history(offerId)).toEqual([
        { price: 100, shipping: 10 },
        { price: 90, shipping: 10 },
        { price: 90, shipping: null },
      ]);

      await sql.query("delete from public.offer where offer_id = $1", [offerId]);
      expect(await history(offerId)).toEqual([]);
    });
  });

  it("maintient le prix minimum et le nombre d'offres actives du meuble", async () => {
    await inRollback(async () => {
      const furnitureId = await newFurniture();
      const high = await newOffer(furnitureId, IKEA, 100);
      const low = await newOffer(furnitureId, DEMO, 80);
      expect(await cache(furnitureId)).toEqual({ min: 80, nb: 2 });

      await sql.query("update public.offer set status = 'removed' where offer_id = $1", [low]);
      expect(await cache(furnitureId)).toEqual({ min: 100, nb: 1 });

      // Review Focus 4 : plus aucune offre active
      await sql.query("delete from public.offer where offer_id = $1", [high]);
      expect(await cache(furnitureId)).toEqual({ min: null, nb: 0 });
    });
  });

  it("recalcule les deux meubles quand une offre change de meuble", async () => {
    await inRollback(async () => {
      const from = await newFurniture();
      const to = await newFurniture();
      const offerId = await newOffer(from, IKEA, 50);
      await sql.query("update public.offer set furniture_id = $1 where offer_id = $2", [
        to,
        offerId,
      ]);
      expect(await cache(from)).toEqual({ min: null, nb: 0 });
      expect(await cache(to)).toEqual({ min: 50, nb: 1 });
    });
  });

  it("a des caches coherents avec les offres actives du seed", async () => {
    const { n } = await one(
      `select count(*)::int as n from public.furniture f
       where f.cached_nb_offers is distinct from
             (select count(*) from public.offer o where o.furniture_id = f.furniture_id and o.status = 'active')
          or f.cached_min_price is distinct from
             (select min(price) from public.offer o where o.furniture_id = f.furniture_id and o.status = 'active')`
    );
    expect(n).toBe(0);
  });
});
