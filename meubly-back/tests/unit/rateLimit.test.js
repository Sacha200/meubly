import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { bearer, mockAuth } from "../helpers/authMock.js";

const supabase = vi.hoisted(() => ({ auth: { getUser: vi.fn() }, from: vi.fn() }));
vi.mock("../../supabase.js", () => ({ supabase }));
vi.mock("../../repositories/userRepository.js", () => ({
  userRepository: { findRoleByUserId: vi.fn() },
}));
vi.mock("../../repositories/furnitureRepository.js", () => ({
  furnitureRepository: { findSummary: vi.fn().mockResolvedValue(null) },
}));
vi.mock("../../repositories/reviewRepository.js", () => ({
  reviewRepository: { findByFurnitureAndUser: vi.fn() },
}));

const FURNITURE = "3f2b6c1e-0000-4000-8000-000000000001";

/** App neuve a chaque test : les compteurs des limiteurs sont en memoire du module. */
async function freshApp() {
  vi.resetModules();
  const { userRepository } = await import("../../repositories/userRepository.js");
  mockAuth(supabase, userRepository);
  return (await import("../../app.js")).app;
}

describe("limitation de debit", () => {
  beforeEach(() => {
    process.env.REPLICATE_API_TOKEN = "test-token";
  });

  it("limite la generation IA a 5 par heure et par utilisateur", async () => {
    const app = await freshApp();
    const call = (kind) =>
      request(app)
        .post("/api/v1/ai/generate-scene")
        .set("Authorization", bearer(kind))
        .send({ furnitureId: FURNITURE, prompt: "salon" });

    for (let i = 0; i < 5; i += 1) expect((await call("user")).status).toBe(404);
    const blocked = await call("user");
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: "Trop de requetes, reessayez plus tard" });
    expect((await call("admin")).status).toBe(404);
  });

  it("limite les ecritures d'avis a 20 par heure et par utilisateur", async () => {
    const app = await freshApp();
    const post = () =>
      request(app)
        .post(`/api/v1/furnitures/${FURNITURE}/reviews`)
        .set("Authorization", bearer("user"))
        .send({ rating: 4 });

    for (let i = 0; i < 20; i += 1) expect((await post()).status).toBe(404);
    expect((await post()).status).toBe(429);
  });

  it("limite l'API par IP sans jamais limiter le health check", async () => {
    const app = await freshApp();
    for (let i = 0; i < 300; i += 1) await request(app).get("/api/v1/nope");
    expect((await request(app).get("/api/v1/nope")).status).toBe(429);
    expect((await request(app).get("/api/v1/health")).status).toBe(200);
  }, 30_000); // 301 requetes : lent par construction, surtout quand les suites tournent en parallele
});
