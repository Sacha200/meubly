import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/vue";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "../../src/stores/authStore";
import ProductReviews from "../../src/components/Detail/ProductReviews.vue";

vi.mock("../../src/supabase", () => ({
  supabase: { auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() } },
}));
vi.mock("../../src/api/furnituresApi", () => ({
  listFurnitureReviews: vi.fn(),
  getMyFurnitureReview: vi.fn(),
  submitFurnitureReview: vi.fn(),
  deleteMyFurnitureReview: vi.fn(),
  deleteReviewAsAdmin: vi.fn(),
}));

const api = await import("../../src/api/furnituresApi");

const REVIEW = {
  review_id: "r1",
  rating: 2,
  comment: "Bancal",
  author_name: "alice",
  created_at: "2026-10-01T00:00:00Z",
};

async function renderAsAdmin() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useAuthStore();
  store.session = { access_token: "t" };
  store.user = { id: "admin" };
  store.role = "ADMIN";
  render(ProductReviews, { props: { productId: "f1" }, global: { plugins: [pinia] } });
  return screen.findByRole("button", { name: /Supprimer cet avis \(admin\)/ });
}

describe("ProductReviews : suppression d'un avis par un admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listFurnitureReviews.mockResolvedValue({
      items: [REVIEW],
      total: 1,
      page: 1,
      limit: 5,
      summary: { average: 2, total: 1, breakdown: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0 } },
    });
    api.getMyFurnitureReview.mockResolvedValue(null);
    api.deleteReviewAsAdmin.mockResolvedValue();
  });

  it("demande une confirmation avant de supprimer", async () => {
    await fireEvent.click(await renderAsAdmin());
    expect(api.deleteReviewAsAdmin).not.toHaveBeenCalled();

    await fireEvent.click(screen.getByRole("button", { name: /Confirmer la suppression/ }));
    expect(api.deleteReviewAsAdmin).toHaveBeenCalledWith("r1");
  });

  it("annuler ne supprime rien", async () => {
    await fireEvent.click(await renderAsAdmin());
    await fireEvent.click(screen.getByRole("button", { name: /Annuler/ }));
    expect(api.deleteReviewAsAdmin).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Confirmer la suppression/ })).toBeNull();
  });
});
