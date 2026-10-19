import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { USERS, bearer, mockAuth } from "../helpers/authMock.js";

const supabase = vi.hoisted(() => ({ auth: { getUser: vi.fn() }, from: vi.fn() }));
vi.mock("../../supabase.js", () => ({ supabase }));
vi.mock("../../repositories/userRepository.js", () => ({
  userRepository: { findRoleByUserId: vi.fn() },
}));
vi.mock("../../repositories/furnitureRepository.js", () => ({
  furnitureRepository: { findSummary: vi.fn() },
}));
vi.mock("../../repositories/reviewRepository.js", () => ({
  reviewRepository: {
    findByFurniture: vi.fn(),
    getAllRatings: vi.fn(),
    findByFurnitureAndUser: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteById: vi.fn(),
  },
}));

const { app } = await import("../../app.js");
const { userRepository } = await import("../../repositories/userRepository.js");
const { furnitureRepository } = await import("../../repositories/furnitureRepository.js");
const { reviewRepository } = await import("../../repositories/reviewRepository.js");

const FURNITURE = "3f2b6c1e-0000-4000-8000-000000000001";
const REVIEW_ID = "3f2b6c1e-0000-4000-8000-0000000000aa";
const BASE = `/api/v1/furnitures/${FURNITURE}/reviews`;
const ROW = {
  review_id: REVIEW_ID,
  user_id: USERS.user.id,
  rating: 4,
  comment: "Solide",
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  profile: { username: "alice" },
};

const post = (body, kind = "user") =>
  request(app).post(BASE).set("Authorization", bearer(kind)).send(body);

describe("API des avis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(supabase, userRepository);
    furnitureRepository.findSummary.mockResolvedValue({ furniture_id: FURNITURE, cover_url: null });
    reviewRepository.findByFurniture.mockResolvedValue({ data: [ROW], count: 1 });
    reviewRepository.getAllRatings.mockResolvedValue([{ rating: 4 }, { rating: 2 }]);
    reviewRepository.findByFurnitureAndUser.mockResolvedValue(null);
    reviewRepository.create.mockResolvedValue(ROW);
    reviewRepository.update.mockResolvedValue(ROW);
    reviewRepository.deleteById.mockResolvedValue(1);
  });

  it("liste les avis avec le nom de l'auteur, sans identifiant utilisateur", async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([
      {
        review_id: REVIEW_ID,
        rating: 4,
        comment: "Solide",
        author_name: "alice",
        created_at: ROW.created_at,
        updated_at: ROW.updated_at,
      },
    ]);
    expect(res.text).not.toContain(USERS.user.id);
    expect(res.body.summary).toMatchObject({ average: 3, total: 2 });
  });

  it.each([0, 6, "abc", 3.5])("400 pour la note %s", async (rating) => {
    expect((await post({ rating })).status).toBe(400);
    expect(reviewRepository.create).not.toHaveBeenCalled();
  });

  it("400 pour un commentaire de plus de 1000 caracteres", async () => {
    expect((await post({ rating: 3, comment: "x".repeat(1001) })).status).toBe(400);
  });

  it("401 sans jeton", async () => {
    expect((await request(app).post(BASE).send({ rating: 3 })).status).toBe(401);
  });

  it("404 si le meuble n'existe pas", async () => {
    furnitureRepository.findSummary.mockResolvedValue(null);
    expect((await post({ rating: 3 })).status).toBe(404);
  });

  it("cree puis met a jour l'avis de l'utilisateur, sans authorName", async () => {
    const first = await post({ rating: 4, comment: "  Solide  ", authorName: "IKEA officiel" });
    expect(first.status).toBe(201);
    expect(reviewRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        furniture_id: FURNITURE,
        user_id: USERS.user.id,
        rating: 4,
        comment: "Solide",
      })
    );
    expect(reviewRepository.create.mock.calls[0][0]).not.toHaveProperty("author_name");

    reviewRepository.findByFurnitureAndUser.mockResolvedValue({ review_id: REVIEW_ID });
    const second = await post({ rating: 5 });
    expect(second.status).toBe(200);
    expect(second.body.action).toBe("updated");
  });

  it("renvoie son propre avis ou null", async () => {
    const none = await request(app).get(`${BASE}/me`).set("Authorization", bearer("user"));
    expect(none.body).toEqual({ review: null });
    reviewRepository.findByFurnitureAndUser.mockResolvedValue(ROW);
    const mine = await request(app).get(`${BASE}/me`).set("Authorization", bearer("user"));
    expect(mine.body.review).toMatchObject({ review_id: REVIEW_ID, rating: 4 });
  });

  it("supprime son avis, 404 s'il n'y en a pas", async () => {
    reviewRepository.findByFurnitureAndUser.mockResolvedValue({ review_id: REVIEW_ID });
    const ok = await request(app).delete(`${BASE}/me`).set("Authorization", bearer("user"));
    expect(ok.status).toBe(204);
    expect(reviewRepository.deleteById).toHaveBeenCalledWith(REVIEW_ID);

    reviewRepository.findByFurnitureAndUser.mockResolvedValue(null);
    const missing = await request(app).delete(`${BASE}/me`).set("Authorization", bearer("user"));
    expect(missing.status).toBe(404);
  });

  it("seul un admin supprime l'avis d'un autre", async () => {
    const path = `/api/v1/reviews/${REVIEW_ID}`;
    expect((await request(app).delete(path).set("Authorization", bearer("user"))).status).toBe(403);
    expect((await request(app).delete(path).set("Authorization", bearer("admin"))).status).toBe(
      204
    );
    expect(reviewRepository.deleteById).toHaveBeenCalledWith(REVIEW_ID);
  });

  it("400 sur un identifiant de meuble non UUID", async () => {
    expect((await request(app).get("/api/v1/furnitures/42/reviews")).status).toBe(400);
  });
});
