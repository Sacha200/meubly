import { supabase } from "../supabase";

// Inscription : Supabase Auth gere le mot de passe ; le profil est cree en base par trigger.
export async function registerUser(userData) {
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: { username: userData.username, lastname: userData.lastname },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return { user: data.user };
}

// Fonction pour la connexion avec Supabase
export async function loginUser(credentials) {
  try {
    // Tentative de connexion
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      // Gestion spécifique des erreurs
      switch (error.message) {
        case "Invalid login credentials":
          throw new Error("Email ou mot de passe incorrect");
        case "Email not confirmed":
          throw new Error("Veuillez confirmer votre email avant de vous connecter");
        default:
          throw error;
      }
    }

    if (!data.user) {
      throw new Error("Aucun utilisateur trouvé");
    }

    // Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from("profile")
      .select("*")
      .eq("user_id", data.user.id)
      .single();

    if (profileError) {
      throw new Error("Erreur lors de la récupération du profil");
    }

    return {
      ...data,
      profile: (() => {
        localStorage.setItem(
          "userProfile",
          JSON.stringify({
            id: userProfile.user_id,
            role: userProfile.role,
          })
        );
        return userProfile;
      })(),
    };
  } catch (error) {
    console.error("Erreur détaillée:", error);
    throw error;
  }
}

// Fonction pour la déconnexion
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Erreur détaillée:", error);
    throw error;
  }
}

/** Chemin de la page ou le lien de reinitialisation ramene l'utilisateur. */
export const RESET_PASSWORD_PATH = "/reinitialiser-mot-de-passe";

const INVALID_LINK_MESSAGE = "Ce lien n'est plus valide. Refaites une demande de réinitialisation.";

/**
 * Envoie l'email de reinitialisation. Supabase repond de la meme facon que le compte
 * existe ou non : l'appelant affiche toujours un message neutre.
 * @param {string} email
 * @throws {Error} message en francais, jamais le message brut de Supabase
 */
export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}${RESET_PASSWORD_PATH}`,
  });
  if (!error) return;
  if (error.code === "over_email_send_rate_limit" || error.status === 429) {
    throw new Error("Trop de demandes. Réessayez dans quelques minutes.");
  }
  throw new Error("Envoi impossible pour le moment. Réessayez plus tard.");
}

/**
 * Enregistre le nouveau mot de passe (session ouverte par le lien de reinitialisation),
 * puis ferme toutes les sessions du compte : l'utilisateur se reconnecte avec le nouveau
 * mot de passe, ce qui recharge aussi son role.
 * @param {string} password
 * @throws {Error} message en francais
 */
export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    switch (error.code) {
      case "same_password":
        throw new Error("Le nouveau mot de passe doit être différent de l'ancien.");
      case "weak_password":
        throw new Error("Ce mot de passe est trop faible.");
      case "session_not_found":
      case "reauthentication_needed":
        throw new Error(INVALID_LINK_MESSAGE);
      default:
        throw new Error("Enregistrement impossible pour le moment. Réessayez plus tard.");
    }
  }
  await supabase.auth.signOut({ scope: "global" });
}

// Fonction pour vérifier si l'utilisateur est connecté
export async function isUserLoggedIn() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}
