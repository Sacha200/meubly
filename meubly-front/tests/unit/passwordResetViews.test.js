import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/vue";
import { createRouter, createMemoryHistory } from "vue-router";
import ForgotPasswordDialog from "../../src/components/Auth/ForgotPasswordDialog.vue";
import ResetPasswordView from "../../src/views/ResetPasswordView.vue";

vi.mock("../../src/supabase", () => ({
  supabase: { auth: { getSession: vi.fn() } },
}));
vi.mock("../../src/api/authApi", () => ({
  requestPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
}));

const { supabase } = await import("../../src/supabase");
const api = await import("../../src/api/authApi");

function makeRouter() {
  const Empty = { template: "<div />" };
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: Empty },
      { path: "/login", name: "Login", component: Empty },
      { path: "/reinitialiser-mot-de-passe", component: ResetPasswordView },
    ],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ForgotPasswordDialog", () => {
  const renderDialog = (email = "alice@example.com") =>
    render(ForgotPasswordDialog, { props: { initialEmail: email } });

  it("demande confirmation avec l'email repris du formulaire", () => {
    renderDialog();
    expect(screen.getByRole("dialog", { name: "Réinitialiser votre mot de passe ?" })).toBeTruthy();
    expect(screen.getByLabelText("Email").value).toBe("alice@example.com");
  });

  it("envoie le lien puis affiche un message neutre", async () => {
    api.requestPasswordReset.mockResolvedValue();
    renderDialog();
    await fireEvent.click(screen.getByRole("button", { name: "Envoyer le lien" }));
    expect(api.requestPasswordReset).toHaveBeenCalledWith("alice@example.com");
    const message = (await screen.findByRole("status")).textContent;
    expect(message).toMatch(/Si un compte existe pour\s+alice@example.com/);
    expect(message).toContain("dans ce navigateur");
  });

  it("refuse un email invalide sans rien envoyer", async () => {
    renderDialog("pas-un-email");
    await fireEvent.click(screen.getByRole("button", { name: "Envoyer le lien" }));
    expect(api.requestPasswordReset).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("adresse email n'est pas valide");
  });

  it("affiche l'erreur de l'API, par exemple la limite d'envoi", async () => {
    api.requestPasswordReset.mockRejectedValue(
      new Error("Trop de demandes. Réessayez dans quelques minutes.")
    );
    renderDialog();
    await fireEvent.click(screen.getByRole("button", { name: "Envoyer le lien" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Trop de demandes");
  });

  it("se ferme avec Annuler ou la touche Echap", async () => {
    const { emitted } = renderDialog();
    await fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(emitted().close).toHaveLength(2);
  });
});

describe("ResetPasswordView", () => {
  async function renderView(session) {
    supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    const router = makeRouter();
    router.push("/reinitialiser-mot-de-passe");
    await router.isReady();
    render(ResetPasswordView, {
      global: { plugins: [router], stubs: { AppHeader: true, AppFooter: true } },
    });
    return router;
  }

  const fill = async (password, confirm) => {
    await fireEvent.update(await screen.findByLabelText("Nouveau mot de passe"), password);
    await fireEvent.update(screen.getByLabelText("Confirmer le mot de passe"), confirm);
  };

  it("indique un lien invalide quand aucune session de reinitialisation n'est ouverte", async () => {
    await renderView(null);
    expect(await screen.findByText("Ce lien n'est plus valide")).toBeTruthy();
    expect(screen.queryByLabelText("Nouveau mot de passe")).toBeNull();
    expect(screen.getByRole("link", { name: /Refaire une demande/ }).getAttribute("href")).toBe(
      "/login"
    );
  });

  it("affiche les regles en direct", async () => {
    await renderView({ access_token: "t" });
    await fill("abc", "");
    const rules = screen.getByRole("list", { name: "Règles du mot de passe" });
    expect(rules.textContent).toContain("10 caractères minimum");
    expect(rules.querySelectorAll('[data-ok="true"]').length).toBe(1);
  });

  it("refuse deux mots de passe differents", async () => {
    await renderView({ access_token: "t" });
    await fill("Abcdefghi1", "Abcdefghi2");
    await fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(api.updatePassword).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("ne sont pas identiques");
  });

  it("refuse un mot de passe qui ne respecte pas les regles", async () => {
    await renderView({ access_token: "t" });
    await fill("court", "court");
    await fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(api.updatePassword).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("ne respecte pas les règles");
  });

  it("enregistre puis renvoie vers la connexion avec un message", async () => {
    api.updatePassword.mockResolvedValue();
    const router = await renderView({ access_token: "t" });
    await fill("Abcdefghi1", "Abcdefghi1");
    await fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(api.updatePassword).toHaveBeenCalledWith("Abcdefghi1");
    await waitFor(() => expect(router.currentRoute.value.fullPath).toBe("/login?reset=ok"));
  });

  it("affiche l'erreur renvoyee par l'enregistrement", async () => {
    api.updatePassword.mockRejectedValue(
      new Error("Le nouveau mot de passe doit être différent de l'ancien.")
    );
    await renderView({ access_token: "t" });
    await fill("Abcdefghi1", "Abcdefghi1");
    await fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect((await screen.findByRole("alert")).textContent).toContain("différent de l'ancien");
  });
});
