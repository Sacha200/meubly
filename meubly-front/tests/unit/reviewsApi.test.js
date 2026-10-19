import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import API_BASE from "../../src/api/apiBase";

vi.mock("../../src/supabase", () => ({
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn() },
}));

const { supabase } = await import("../../src/supabase");
const {
  listFurnitureReviews,
  getMyFurnitureReview,
  submitFurnitureReview,
  deleteMyFurnitureReview,
  deleteReviewAsAdmin,
} = await import("../../src/api/furnituresApi");
const { useFurnitureStore } = await import("../../src/stores/furnitureStore");

const FURNITURE = "3f2b6c1e-0000-4000-8000-000000000001";
const REVIEW = "3f2b6c1e-0000-4000-8000-0000000000aa";
const ok = (body, status = 200) => ({ ok: true, status, json: async () => body });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { access_token: "tok" } },
    error: null,
  });
});

describe("API des avis", () => {
  it("liste les avis sans jeton", async () => {
    fetch.mockResolvedValueOnce(ok({ items: [] }));
    await listFurnitureReviews(FURNITURE, { page: 2, limit: 5 });
    const [url] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE}/furnitures/${FURNITURE}/reviews?page=2&limit=5`);
  });

  it("envoie la note et le commentaire avec le jeton, jamais authorName", async () => {
    fetch.mockResolvedValueOnce(ok({ action: "created" }, 201));
    await submitFurnitureReview(FURNITURE, { rating: 4, comment: "Bien", authorName: "IKEA" });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE}/furnitures/${FURNITURE}/reviews`);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body)).toEqual({ rating: 4, comment: "Bien" });
  });

  it("lit et supprime son propre avis", async () => {
    fetch.mockResolvedValueOnce(ok({ review: null }));
    expect(await getMyFurnitureReview(FURNITURE)).toBeNull();
    fetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });
    await deleteMyFurnitureReview(FURNITURE);
    const [url, init] = fetch.mock.calls[1];
    expect(url).toBe(`${API_BASE}/furnitures/${FURNITURE}/reviews/me`);
    expect(init.method).toBe("DELETE");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("supprime un avis en tant qu'admin", async () => {
    fetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });
    await deleteReviewAsAdmin(REVIEW);
    expect(fetch.mock.calls[0][0]).toBe(`${API_BASE}/reviews/${REVIEW}`);
    expect(fetch.mock.calls[0][1].method).toBe("DELETE");
  });

  it("remonte le premier message de validation du back", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        errors: [{ msg: "La note doit être un entier compris entre 1 et 5." }],
      }),
    });
    await expect(submitFurnitureReview(FURNITURE, { rating: 9 })).rejects.toThrow(
      "La note doit être un entier compris entre 1 et 5."
    );
  });
});

describe("generateLifestyleImage", () => {
  it("envoie l'identifiant du meuble et non une URL d'image", async () => {
    setActivePinia(createPinia());
    fetch.mockResolvedValueOnce(ok({ url: "https://cdn.example/x.jpg" }));
    await useFurnitureStore().generateLifestyleImage(FURNITURE, "salon");
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE}/ai/generate-scene`);
    expect(JSON.parse(init.body)).toEqual({ furnitureId: FURNITURE, prompt: "salon" });
    expect(init.headers.Authorization).toBe("Bearer tok");
  });
});
