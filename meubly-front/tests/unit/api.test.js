import { describe, it, expect, vi, beforeEach } from "vitest";
import API_BASE from "../../src/api/apiBase";
import {
  getFurnitures,
  getFurnitureById,
  searchFurnitures,
  updateFurniture,
  getFurnitureOffers,
  addFavorite,
  removeFavorite,
  getUserFavorites,
  loginUser,
  logoutUser,
} from "../../src/clientapi";

vi.mock("../../src/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

const { supabase } = await import("../../src/supabase");

const okJson = (body) => ({ ok: true, status: 200, json: async () => body, text: async () => "" });
const errJson = (status, body = {}) => ({
  ok: false,
  status,
  json: async () => body,
  text: async () => "",
});
const withSession = () =>
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { access_token: "tok" } },
    error: null,
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("getFurnitures", () => {
  it("construit l'URL avec filtres et pagination", async () => {
    fetch.mockResolvedValueOnce(okJson({ items: [], total: 0, page: 2, limit: 12 }));
    await getFurnitures({ q: "table", categoryId: 3, minPrice: 0, page: 2 });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(`${API_BASE}/furnitures`);
    expect(url.searchParams.get("q")).toBe("table");
    expect(url.searchParams.get("categoryId")).toBe("3");
    expect(url.searchParams.get("minPrice")).toBe("0");
    expect(url.searchParams.has("maxPrice")).toBe(false);
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("leve une erreur sur reponse HTTP en echec", async () => {
    fetch.mockResolvedValueOnce(errJson(500));
    await expect(getFurnitures()).rejects.toThrow("Erreur HTTP: 500");
  });
});

describe("searchFurnitures", () => {
  it("delegue a getFurnitures avec q", async () => {
    fetch.mockResolvedValueOnce(okJson({ items: [] }));
    await searchFurnitures("lit", { page: 3 });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.searchParams.get("q")).toBe("lit");
    expect(url.searchParams.get("page")).toBe("3");
  });
});

describe("getFurnitureById", () => {
  it("retourne le meuble", async () => {
    fetch.mockResolvedValueOnce(okJson({ furniture_id: "a1", title: "Chaise" }));
    await expect(getFurnitureById("a1")).resolves.toEqual({ furniture_id: "a1", title: "Chaise" });
    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/furnitures/a1`);
  });

  it("propage le message d'erreur du serveur", async () => {
    fetch.mockResolvedValueOnce(errJson(404, { error: "Meuble non trouve" }));
    await expect(getFurnitureById("zz")).rejects.toThrow("Meuble non trouve");
  });
});

describe("updateFurniture", () => {
  it("envoie un PATCH JSON", async () => {
    fetch.mockResolvedValueOnce(okJson({ furniture_id: "a1", title: "X" }));
    await updateFurniture("a1", { title: "X" });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE}/furnitures/a1`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ title: "X" });
  });
});

describe("getFurnitureOffers", () => {
  it("appelle /furnitures/:id/offers", async () => {
    fetch.mockResolvedValueOnce(okJson([{ offer_id: "o1" }]));
    await expect(getFurnitureOffers("a1")).resolves.toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/furnitures/a1/offers`);
  });
});

describe("favoris", () => {
  it("addFavorite envoie le token Bearer", async () => {
    withSession();
    fetch.mockResolvedValueOnce(okJson({ message: "Added to favorites" }));
    await expect(addFavorite("a1")).resolves.toBe(true);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE}/favorites/a1`);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("addFavorite refuse sans session", async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(addFavorite("a1")).rejects.toThrow("Utilisateur non connecté");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("removeFavorite envoie un DELETE", async () => {
    withSession();
    fetch.mockResolvedValueOnce(okJson({}));
    await removeFavorite("a1");
    expect(fetch.mock.calls[0][1].method).toBe("DELETE");
  });

  it("getUserFavorites retourne [] sans session", async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(getUserFavorites()).resolves.toEqual([]);
  });
});

describe("auth", () => {
  it("loginUser traduit les identifiants invalides", async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {},
      error: { message: "Invalid login credentials" },
    });
    await expect(loginUser({ email: "a@b.fr", password: "x" })).rejects.toThrow(
      "Email ou mot de passe incorrect"
    );
  });

  it("loginUser retourne le profil et memorise le role", async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "u1" }, session: {} },
      error: null,
    });
    const single = vi.fn().mockResolvedValue({ data: { user_id: "u1", role: "USER" }, error: null });
    supabase.from.mockReturnValue({ select: () => ({ eq: () => ({ single }) }) });
    const result = await loginUser({ email: "a@b.fr", password: "x" });
    expect(result.profile.role).toBe("USER");
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "userProfile",
      JSON.stringify({ id: "u1", role: "USER" })
    );
  });

  it("logoutUser appelle signOut", async () => {
    supabase.auth.signOut.mockResolvedValueOnce({ error: null });
    await logoutUser();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
