import { describe, it, expect, vi, beforeEach } from "vitest";
import API_BASE from "../../src/api/apiBase";

vi.mock("../../src/supabase", () => ({
  supabase: {
    auth: { getSession: vi.fn(), signUp: vi.fn() },
    from: vi.fn(),
  },
}));

const { supabase } = await import("../../src/supabase");
const {
  registerUser,
  listUsers,
  blockUser,
  unblockUser,
  deleteUser,
  listProviders,
  createProvider,
  updateProvider,
  deleteProvider,
} = await import("../../src/clientapi");

const ID = "3f2b6c1e-0000-4000-8000-000000000099";
const ok = (body, status = 200) => ({ ok: true, status, json: async () => body });
const fail = (status, body) => ({ ok: false, status, json: async () => body });
const withSession = () =>
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { access_token: "tok" } },
    error: null,
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("registerUser", () => {
  it("passe par Supabase Auth seul, sans ecrire le profil ni hacher le mot de passe", async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const result = await registerUser({
      email: "a@b.fr",
      password: "Secret-123",
      username: "alice",
      lastname: "Martin",
    });
    expect(supabase.from).not.toHaveBeenCalled();
    const args = supabase.auth.signUp.mock.calls[0][0];
    expect(args.email).toBe("a@b.fr");
    expect(args.password).toBe("Secret-123");
    expect(args.options.data).toEqual({ username: "alice", lastname: "Martin" });
    expect(result).toEqual({ user: { id: "u1" } });
  });
});

describe("usersApi", () => {
  it("liste les comptes avec recherche, pagination et jeton", async () => {
    withSession();
    fetch.mockResolvedValueOnce(ok({ items: [], total: 0, page: 2, limit: 20 }));
    await listUsers({ q: "dupont", page: 2 });
    const [url, init] = fetch.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(`${API_BASE}/users`);
    expect(parsed.searchParams.get("q")).toBe("dupont");
    expect(parsed.searchParams.get("page")).toBe("2");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("bloque, debloque et supprime avec la bonne methode", async () => {
    withSession();
    fetch.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    await blockUser(ID);
    await unblockUser(ID);
    await deleteUser(ID);
    expect(fetch.mock.calls.map(([url, init]) => [init.method, url])).toEqual([
      ["POST", `${API_BASE}/users/${ID}/block`],
      ["POST", `${API_BASE}/users/${ID}/unblock`],
      ["DELETE", `${API_BASE}/users/${ID}`],
    ]);
  });

  it("remonte le message d'erreur du back", async () => {
    withSession();
    fetch.mockResolvedValueOnce(fail(403, { error: "Acces reserve aux administrateurs" }));
    await expect(listUsers()).rejects.toThrow("Acces reserve aux administrateurs");
  });

  it("refuse sans session", async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(blockUser(ID)).rejects.toThrow("Utilisateur non connecte");
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("providersApi", () => {
  it("cree un partenaire avec le jeton et uniquement les champs du contrat", async () => {
    withSession();
    fetch.mockResolvedValueOnce(ok({ id: ID }, 201));
    await createProvider({
      name: "IKEA",
      url: "https://www.ikea.com",
      logoUrl: null,
      isActive: true,
      apiKey: "secret",
      priority: 2,
    });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE}/providers`);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body)).toEqual({
      name: "IKEA",
      url: "https://www.ikea.com",
      logoUrl: null,
      isActive: true,
    });
  });

  it("modifie et supprime avec le jeton", async () => {
    withSession();
    fetch.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    await updateProvider(ID, { isActive: false });
    await deleteProvider(ID);
    expect(
      fetch.mock.calls.map(([url, init]) => [init.method, url, init.headers.Authorization])
    ).toEqual([
      ["PATCH", `${API_BASE}/providers/${ID}`, "Bearer tok"],
      ["DELETE", `${API_BASE}/providers/${ID}`, "Bearer tok"],
    ]);
  });

  it("liste les partenaires (lecture publique)", async () => {
    fetch.mockResolvedValueOnce(ok([]));
    await listProviders();
    expect(fetch.mock.calls[0][0]).toBe(`${API_BASE}/providers`);
  });
});
