import { describe, it, expect, vi } from "vitest";
import { createPoliteFetch, BlockedError, HttpError } from "../../../ingestion/politeFetch.js";

const ROBOTS = "https://shop.test/robots.txt";
const PAGE = "https://shop.test/products/a";

/** Faux fetch : chaque URL rend ses reponses dans l'ordre ; une URL inconnue rend 404. */
function setup(routes) {
  const fetchImpl = vi.fn(async (url) => {
    const { status = 200, body = "" } = routes[url]?.shift() ?? { status: 404 };
    return new Response(body, { status });
  });
  const sleep = vi.fn(async () => {});
  const get = createPoliteFetch({ botUrl: "https://x.test", fetchImpl, sleep });
  return { get, fetchImpl, sleep };
}

describe("politeFetch", () => {
  it("se presente avec l'agent declare", async () => {
    const { get, fetchImpl } = setup({ [PAGE]: [{ body: "ok" }] });
    expect(await get(PAGE)).toBe("ok");
    expect(fetchImpl).toHaveBeenCalledWith(PAGE, {
      headers: { "User-Agent": "PrixoliBot/1.0 (+https://x.test)" },
    });
  });

  it("autorise tout quand robots.txt est absent (404)", async () => {
    const { get } = setup({ [PAGE]: [{ body: "ok" }] });
    expect(await get(PAGE)).toBe("ok");
  });

  it("refuse une URL interdite par robots.txt sans appeler la page", async () => {
    const forbidden = "https://shop.test/prive/a";
    const { get, fetchImpl } = setup({ [ROBOTS]: [{ body: "User-agent:*\nDisallow: /prive" }] });
    await expect(get(forbidden)).rejects.toBeInstanceOf(BlockedError);
    expect(fetchImpl).not.toHaveBeenCalledWith(forbidden, expect.anything());
  });

  it("attend 2 s entre deux requetes du meme hote (robots.txt compris)", async () => {
    const other = "https://shop.test/products/b";
    const { get, sleep } = setup({ [PAGE]: [{ body: "1" }], [other]: [{ body: "2" }] });
    await get(PAGE);
    await get(other);
    expect(sleep.mock.calls).toEqual([[2000], [2000]]);
  });

  it("reessaie apres 60 s sur un 429", async () => {
    const { get, sleep } = setup({ [PAGE]: [{ status: 429 }, { body: "ok" }] });
    expect(await get(PAGE)).toBe("ok");
    expect(sleep).toHaveBeenCalledWith(60000);
  });

  it("abandonne apres 3 nouvelles tentatives sur 429", async () => {
    const tooMany = { status: 429 };
    const { get, sleep } = setup({
      [PAGE]: [tooMany, tooMany, tooMany, tooMany],
    });
    const error = await get(PAGE).catch((e) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(429);
    expect(sleep.mock.calls.filter(([ms]) => ms === 60000)).toHaveLength(3);
  });

  it("leve BlockedError sur un 403", async () => {
    const { get } = setup({ [PAGE]: [{ status: 403 }] });
    await expect(get(PAGE)).rejects.toBeInstanceOf(BlockedError);
  });

  it("leve BlockedError sur une page de defi anti-robot", async () => {
    const { get } = setup({ [PAGE]: [{ body: "<html>cf-chl challenge</html>" }] });
    await expect(get(PAGE)).rejects.toBeInstanceOf(BlockedError);
  });

  it("leve HttpError avec le statut sur un 500", async () => {
    const { get } = setup({ [PAGE]: [{ status: 500 }] });
    const error = await get(PAGE).catch((e) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(500);
  });
});
