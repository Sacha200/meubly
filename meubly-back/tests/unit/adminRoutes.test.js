import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { bearer, mockAuth } from "../helpers/authMock.js";

const supabase = vi.hoisted(() => ({ auth: { getUser: vi.fn() }, from: vi.fn() }));
vi.mock("../../supabase.js", () => ({ supabase }));
vi.mock("../../repositories/userRepository.js", () => ({
  userRepository: { findRoleByUserId: vi.fn() },
}));
vi.mock("../../repositories/partnerRepository.js");
vi.mock("../../repositories/categoryRepository.js");
vi.mock("../../repositories/furnitureRepository.js");

const { app } = await import("../../app.js");
const { userRepository } = await import("../../repositories/userRepository.js");
const { partnerRepository } = await import("../../repositories/partnerRepository.js");

const ID = "3f2b6c1e-0000-4000-8000-000000000001";
const PARTNER_ROW = {
  partner_id: ID,
  name: "IKEA",
  website_base_url: "https://www.ikea.com",
  logo_url: null,
  is_active: true,
  api_key_hash: "secret-hash",
  created_at: "2026-01-01T00:00:00Z",
};

const WRITES = [
  ["post", "/api/v1/categories", { label: "Salon" }],
  ["put", `/api/v1/categories/${ID}`, { label: "Salon" }],
  ["delete", `/api/v1/categories/${ID}`],
  ["post", "/api/v1/providers", { name: "IKEA", url: "https://www.ikea.com" }],
  ["patch", `/api/v1/providers/${ID}`, { isActive: false }],
  ["delete", `/api/v1/providers/${ID}`],
  ["post", "/api/v1/furnitures", { title: "Chaise" }],
  ["patch", `/api/v1/furnitures/${ID}`, { title: "Chaise" }],
  ["delete", `/api/v1/furnitures/${ID}`],
];

const send = (method, path, body, auth) => {
  let req = request(app)[method](path);
  if (auth) req = req.set("Authorization", auth);
  return body ? req.send(body) : req;
};

describe("ecritures reservees aux admins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(supabase, userRepository);
    partnerRepository.create.mockResolvedValue(PARTNER_ROW);
    partnerRepository.update.mockResolvedValue(PARTNER_ROW);
  });

  it.each(WRITES)("%s %s : 401 sans jeton", async (method, path, body) => {
    expect((await send(method, path, body)).status).toBe(401);
  });

  it.each(WRITES)("%s %s : 403 pour un USER", async (method, path, body) => {
    expect((await send(method, path, body, bearer("user"))).status).toBe(403);
  });

  it.each(WRITES)("%s %s : accepte un ADMIN", async (method, path, body) => {
    const res = await send(method, path, body, bearer("admin"));
    expect([401, 403]).not.toContain(res.status);
  });
});

describe("/providers sur la table partner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(supabase, userRepository);
  });

  it("renvoie le DTO sans api_key_hash", async () => {
    partnerRepository.findAll.mockResolvedValue([PARTNER_ROW]);
    const res = await request(app).get("/api/v1/providers");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: ID,
        name: "IKEA",
        url: "https://www.ikea.com",
        logoUrl: null,
        isActive: true,
        createdAt: "2026-01-01T00:00:00Z",
      },
    ]);
  });

  it("400 sans nom a la creation", async () => {
    const res = await send("post", "/api/v1/providers", { url: "https://x.fr" }, bearer("admin"));
    expect(res.status).toBe(400);
    expect(partnerRepository.create).not.toHaveBeenCalled();
  });

  it("400 sur une URL non http(s)", async () => {
    const res = await send(
      "post",
      "/api/v1/providers",
      { name: "X", url: "javascript:alert(1)" },
      bearer("admin")
    );
    expect(res.status).toBe(400);
  });

  it("n'enregistre que les champs connus, en colonnes partner", async () => {
    partnerRepository.create.mockResolvedValue(PARTNER_ROW);
    await send(
      "post",
      "/api/v1/providers",
      { name: "IKEA", url: "https://www.ikea.com", isActive: true, apiKey: "leak", priority: 3 },
      bearer("admin")
    );
    expect(partnerRepository.create).toHaveBeenCalledWith({
      name: "IKEA",
      website_base_url: "https://www.ikea.com",
      is_active: true,
    });
  });

  it("n'expose plus la route de comparaison factice", async () => {
    expect((await request(app).get(`/api/v1/compare/${ID}`)).status).toBe(404);
  });
});
