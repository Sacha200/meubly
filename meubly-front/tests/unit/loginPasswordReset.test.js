import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/vue";
import { createRouter, createMemoryHistory } from "vue-router";
import { createPinia } from "pinia";
import LoginPage from "../../src/views/LoginPage.vue";
import RegisterPage from "../../src/views/RegisterPage.vue";

vi.mock("../../src/supabase", () => ({
  supabase: { auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() } },
}));
vi.mock("../../src/api/authApi", () => ({
  loginUser: vi.fn(),
  requestPasswordReset: vi.fn(),
}));

async function renderLogin(query = {}) {
  const Empty = { template: "<div />" };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/login", component: LoginPage },
      { path: "/register", component: Empty },
      { path: "/verify-email", component: Empty },
    ],
  });
  router.push({ path: "/login", query });
  await router.isReady();
  render(LoginPage, {
    global: {
      plugins: [router, createPinia()],
      stubs: { AppHeader: true, AppFooter: true, Toast: true },
      mocks: { $toast: { add: vi.fn() } },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage : mot de passe oublie", () => {
  it("ouvre la fenetre de reinitialisation avec l'email saisi", async () => {
    await renderLogin();
    await fireEvent.update(screen.getByLabelText("Email"), "alice@example.com");
    await fireEvent.click(screen.getByRole("button", { name: "Mot de passe oublié ?" }));
    const dialog = screen.getByRole("dialog", { name: "Réinitialiser votre mot de passe ?" });
    expect(dialog.querySelector("input").value).toBe("alice@example.com");
  });

  it("referme la fenetre avec Annuler", async () => {
    await renderLogin();
    await fireEvent.click(screen.getByRole("button", { name: "Mot de passe oublié ?" }));
    await fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("confirme le changement de mot de passe au retour de la reinitialisation", async () => {
    await renderLogin({ reset: "ok" });
    expect(screen.getByRole("status").textContent).toContain(
      "Mot de passe modifié, connectez-vous"
    );
  });
});

describe("RegisterPage : regles du mot de passe", () => {
  const validate = (password) =>
    RegisterPage.methods.validateForm.call({
      formData: { username: "alice", email: "alice@example.com", password },
    });

  it("refuse un mot de passe de 9 caracteres", () => {
    expect(validate("Abcdefgh1")).toContain("Le mot de passe doit contenir au moins 10 caractères");
  });

  it("accepte un mot de passe de 10 caracteres conforme", () => {
    expect(validate("Abcdefghi1")).toEqual([]);
  });
});
