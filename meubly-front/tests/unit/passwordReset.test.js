import { describe, it, expect, vi, beforeEach } from "vitest";
import { passwordChecks, isPasswordValid } from "../../src/utils/passwordRules";
import { requestPasswordReset, updatePassword } from "../../src/clientapi";

vi.mock("../../src/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

const { supabase } = await import("../../src/supabase");

const authError = (code, status = 400) => ({ code, status, message: code });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("passwordRules", () => {
  it("valide un mot de passe de 10 caracteres avec majuscule, minuscule et chiffre", () => {
    expect(isPasswordValid("Abcdefghi1")).toBe(true);
  });

  it("refuse 9 caracteres meme avec majuscule, minuscule et chiffre", () => {
    expect(isPasswordValid("Abcdefgh1")).toBe(false);
  });

  it.each([
    ["sans majuscule", "abcdefghi1"],
    ["sans minuscule", "ABCDEFGHI1"],
    ["sans chiffre", "Abcdefghij"],
  ])("refuse un mot de passe %s", (_label, value) => {
    expect(isPasswordValid(value)).toBe(false);
  });

  it("detaille chaque regle pour l'affichage en direct", () => {
    const checks = passwordChecks("abc");
    expect(checks.map((c) => c.id)).toEqual(["length", "upper", "lower", "digit"]);
    expect(checks.find((c) => c.id === "lower").ok).toBe(true);
    expect(checks.find((c) => c.id === "length").ok).toBe(false);
  });
});

describe("requestPasswordReset", () => {
  it("demande l'email avec un retour vers la page de reinitialisation", async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    await requestPasswordReset("  alice@example.com ");
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("alice@example.com", {
      redirectTo: "http://localhost:5173/reinitialiser-mot-de-passe",
    });
  });

  it("traduit la limite d'envoi en message clair", async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: authError("over_email_send_rate_limit", 429),
    });
    await expect(requestPasswordReset("alice@example.com")).rejects.toThrow(
      "Trop de demandes. Réessayez dans quelques minutes."
    );
  });

  it("ne transmet pas le message brut d'une autre erreur", async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: authError("unexpected_failure", 500),
    });
    await expect(requestPasswordReset("alice@example.com")).rejects.toThrow(
      "Envoi impossible pour le moment. Réessayez plus tard."
    );
  });
});

describe("updatePassword", () => {
  it("enregistre le mot de passe puis ferme toutes les sessions", async () => {
    supabase.auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null });
    supabase.auth.signOut.mockResolvedValue({ error: null });
    await updatePassword("Abcdefghi1");
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "Abcdefghi1" });
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "global" });
  });

  it("refuse un mot de passe identique a l'ancien avec un message clair", async () => {
    supabase.auth.updateUser.mockResolvedValue({
      data: null,
      error: authError("same_password", 422),
    });
    await expect(updatePassword("Abcdefghi1")).rejects.toThrow(
      "Le nouveau mot de passe doit être différent de l'ancien."
    );
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it("signale un lien expire quand la session de reinitialisation n'existe plus", async () => {
    supabase.auth.updateUser.mockResolvedValue({
      data: null,
      error: authError("session_not_found", 403),
    });
    await expect(updatePassword("Abcdefghi1")).rejects.toThrow(
      "Ce lien n'est plus valide. Refaites une demande de réinitialisation."
    );
  });
});
