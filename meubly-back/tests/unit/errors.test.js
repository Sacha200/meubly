import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { mockAuth } from "../helpers/authMock.js";

const supabase = vi.hoisted(() => ({ auth: { getUser: vi.fn() }, from: vi.fn() }));
vi.mock("../../supabase.js", () => ({ supabase }));
vi.mock("../../repositories/userRepository.js", () => ({
  userRepository: { findRoleByUserId: vi.fn() },
}));
vi.mock("../../repositories/categoryRepository.js", () => ({
  categoryRepository: { findAll: vi.fn(), findById: vi.fn() },
}));

const { app } = await import("../../app.js");
const { userRepository } = await import("../../repositories/userRepository.js");
const { categoryRepository } = await import("../../repositories/categoryRepository.js");
const { httpError } = await import("../../utils/httpError.js");
const { errorHandler } = await import("../../middlewares/errorMiddleware.js");

describe("erreurs de l'API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(supabase, userRepository);
  });

  it("404 pour une route inconnue (et non 401)", async () => {
    const res = await request(app).get("/api/v1/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Route introuvable" });
  });

  it("401 sur les favoris sans jeton", async () => {
    expect((await request(app).get("/api/v1/favorites")).status).toBe(401);
  });

  it("ne divulgue pas le message d'une erreur Supabase", async () => {
    categoryRepository.findAll.mockRejectedValue({
      message: "relation secret_table does not exist",
      code: "42P01",
    });
    const res = await request(app).get("/api/v1/categories");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erreur interne du serveur" });
    expect(res.text).not.toContain("secret_table");
  });

  it("404 propre pour une categorie absente", async () => {
    categoryRepository.findById.mockResolvedValue(null);
    const res = await request(app).get("/api/v1/categories/3f2b6c1e-0000-4000-8000-000000000001");
    expect(res.status).toBe(404);
  });

  it("400 sur un corps JSON invalide", async () => {
    const res = await request(app)
      .post("/api/v1/favorites/x")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
    expect(res.text).not.toContain("SyntaxError");
  });

  it("httpError porte son statut jusqu'a la reponse", () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    errorHandler(httpError(404, "Introuvable"), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Introuvable" });
  });
});
