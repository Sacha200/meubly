import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { USERS, bearer, mockAuth } from "../helpers/authMock.js";

const supabase = vi.hoisted(() => ({ auth: { getUser: vi.fn() }, from: vi.fn() }));
vi.mock("../../supabase.js", () => ({ supabase }));
vi.mock("../../repositories/userRepository.js", () => ({
  userRepository: { findRoleByUserId: vi.fn(), search: vi.fn(), findById: vi.fn() },
}));
vi.mock("../../repositories/authAdminRepository.js", () => ({
  authAdminRepository: { getUser: vi.fn(), setBan: vi.fn(), deleteUser: vi.fn() },
}));

const { app } = await import("../../app.js");
const { userRepository } = await import("../../repositories/userRepository.js");
const { authAdminRepository } = await import("../../repositories/authAdminRepository.js");

const TARGET = "3f2b6c1e-0000-4000-8000-000000000099";
const PROFILE = {
  user_id: TARGET,
  email: "dupont@example.com",
  username: "jdupont",
  lastname: "Dupont",
  role: "USER",
  created_at: "2026-01-02",
};
const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();

const ROUTES = [
  ["get", "/api/v1/users"],
  ["get", `/api/v1/users/${TARGET}`],
  ["post", `/api/v1/users/${TARGET}/block`],
  ["post", `/api/v1/users/${TARGET}/unblock`],
  ["delete", `/api/v1/users/${TARGET}`],
];

const as = (kind, method, path) => request(app)[method](path).set("Authorization", bearer(kind));

describe("/users (administration des comptes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(supabase, userRepository);
    userRepository.search.mockResolvedValue({ rows: [PROFILE], count: 1 });
    userRepository.findById.mockResolvedValue(PROFILE);
    authAdminRepository.getUser.mockResolvedValue({
      id: TARGET,
      email: PROFILE.email,
      banned_until: tomorrow(),
      created_at: "2026-01-02T10:00:00Z",
      last_sign_in_at: "2026-10-01T10:00:00Z",
    });
  });

  it.each(ROUTES)("%s %s : 401 sans jeton, 403 pour un USER", async (method, path) => {
    expect((await request(app)[method](path)).status).toBe(401);
    expect((await as("user", method, path)).status).toBe(403);
  });

  it("liste paginee avec le statut de blocage", async () => {
    const res = await as("admin", "get", "/api/v1/users?q=dupont&page=2&limit=10");
    expect(res.status).toBe(200);
    expect(userRepository.search).toHaveBeenCalledWith({ q: "dupont", from: 10, to: 19 });
    expect(res.body).toEqual({
      items: [
        {
          id: TARGET,
          email: PROFILE.email,
          username: "jdupont",
          lastname: "Dupont",
          role: "USER",
          createdAt: "2026-01-02T10:00:00Z",
          lastSignInAt: "2026-10-01T10:00:00Z",
          blocked: true,
        },
      ],
      total: 1,
      page: 2,
      limit: 10,
    });
  });

  it("refuse une recherche qui injecterait un filtre PostgREST", async () => {
    const res = await as("admin", "get", "/api/v1/users?q=a,role.eq.ADMIN");
    expect(res.status).toBe(400);
    expect(userRepository.search).not.toHaveBeenCalled();
  });

  it("400 sur un identifiant non UUID", async () => {
    expect((await as("admin", "get", "/api/v1/users/42")).status).toBe(400);
  });

  it("404 sur un compte absent", async () => {
    userRepository.findById.mockResolvedValue(null);
    expect((await as("admin", "get", `/api/v1/users/${TARGET}`)).status).toBe(404);
  });

  it("bloque et debloque via Supabase Auth", async () => {
    expect((await as("admin", "post", `/api/v1/users/${TARGET}/block`)).status).toBe(204);
    expect(authAdminRepository.setBan).toHaveBeenCalledWith(TARGET, "876000h");
    expect((await as("admin", "post", `/api/v1/users/${TARGET}/unblock`)).status).toBe(204);
    expect(authAdminRepository.setBan).toHaveBeenCalledWith(TARGET, "none");
  });

  it("supprime le compte via Supabase Auth", async () => {
    expect((await as("admin", "delete", `/api/v1/users/${TARGET}`)).status).toBe(204);
    expect(authAdminRepository.deleteUser).toHaveBeenCalledWith(TARGET);
  });

  it("refuse de bloquer ou supprimer son propre compte", async () => {
    const self = USERS.admin.id;
    expect((await as("admin", "post", `/api/v1/users/${self}/block`)).status).toBe(400);
    expect((await as("admin", "delete", `/api/v1/users/${self}`)).status).toBe(400);
    expect(authAdminRepository.setBan).not.toHaveBeenCalled();
    expect(authAdminRepository.deleteUser).not.toHaveBeenCalled();
  });

  it("n'expose plus la creation de compte ni les routes d'auth maison", async () => {
    expect((await as("admin", "post", "/api/v1/users")).status).toBe(404);
    expect((await request(app).post("/api/v1/auth/register")).status).toBe(404);
  });
});
