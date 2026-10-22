import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { TOKENS, USERS, bearer, mockAuth } from "../helpers/authMock.js";

const supabase = vi.hoisted(() => ({ auth: { getUser: vi.fn() }, from: vi.fn() }));
vi.mock("../../supabase.js", () => ({ supabase }));
vi.mock("../../repositories/userRepository.js", () => ({
  userRepository: { findRoleByUserId: vi.fn() },
}));

const { requireAuth } = await import("../../middlewares/authMiddleware.js");
const { requireAdmin } = await import("../../middlewares/roleMiddleware.js");
const { userRepository } = await import("../../repositories/userRepository.js");

const app = express();
app.get("/private", requireAuth, (req, res) => res.json({ id: req.user.id }));
app.get("/admin", requireAuth, requireAdmin, (req, res) => res.json({ ok: true }));
app.use((err, req, res, _next) => res.status(500).json({ error: "boom" }));

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(supabase, userRepository);
  });

  it("401 sans header Authorization", async () => {
    expect((await request(app).get("/private")).status).toBe(401);
  });

  it("401 avec un schema autre que Bearer", async () => {
    const res = await request(app).get("/private").set("Authorization", `Basic ${TOKENS.user}`);
    expect(res.status).toBe(401);
  });

  it("401 avec un jeton refuse", async () => {
    const res = await request(app).get("/private").set("Authorization", "Bearer nope");
    expect(res.status).toBe(401);
  });

  it("403 pour un compte bloque", async () => {
    const res = await request(app).get("/private").set("Authorization", bearer("banned"));
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Compte bloque");
  });

  it("laisse passer un compte dont le blocage a expire", async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { ...USERS.user, banned_until: new Date(Date.now() - 1000).toISOString() } },
      error: null,
    });
    const res = await request(app).get("/private").set("Authorization", bearer("user"));
    expect(res.status).toBe(200);
  });

  it("expose l'utilisateur a la suite", async () => {
    const res = await request(app).get("/private").set("Authorization", bearer("user"));
    expect(res.body).toEqual({ id: USERS.user.id });
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(supabase, userRepository);
  });

  it("403 pour un utilisateur USER", async () => {
    const res = await request(app).get("/admin").set("Authorization", bearer("user"));
    expect(res.status).toBe(403);
  });

  it("200 pour un ADMIN, role lu via le repository", async () => {
    const res = await request(app).get("/admin").set("Authorization", bearer("admin"));
    expect(res.status).toBe(200);
    expect(userRepository.findRoleByUserId).toHaveBeenCalledWith(USERS.admin.id);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("transmet une erreur du repository au gestionnaire d'erreurs", async () => {
    userRepository.findRoleByUserId.mockRejectedValueOnce(new Error("db down"));
    const res = await request(app).get("/admin").set("Authorization", bearer("admin"));
    expect(res.status).toBe(500);
  });
});
