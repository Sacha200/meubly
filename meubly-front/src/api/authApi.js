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

// Fonction pour vérifier si l'utilisateur est connecté
export async function isUserLoggedIn() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}
