import { supabase } from '../supabase';

// Fonction pour l'inscription avec Supabase
export async function registerUser(userData) {
    try {
        // 1. Inscription de l'utilisateur via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    username: userData.username,
                    lastname: userData.lastname
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                shouldCreateUser: true
            }
        });

        if (authError) {
            throw authError;
        }

        // 2. Si l'inscription Auth réussit, on ajoute l'utilisateur dans la table User
        if (authData) {
            const { data: userProfile, error: userError } = await supabase
                .from('User')
                .insert([
                    {
                        user_id: authData.user.id,
                        username: authData.user.user_metadata.username,
                        lastname: authData.user.user_metadata.lastname,
                        email: authData.user.user_metadata.email,
                        created_at: new Date().toISOString().split('T')[0]
                    }
                ])
                .select();

            if (userError) {
                throw userError;
            }

            // 3. Envoyer explicitement l'email de confirmation si nécessaire
            await supabase.auth.resend({
                type: 'signup',
                email: authData.user.email
            });

            return {
                user: authData.user,
                profile: userProfile[0]
            };
        }

        return authData;
    } catch (error) {
        console.error('Erreur détaillée:', error);
        throw error;
    }
}

// Fonction pour la connexion avec Supabase
export async function loginUser(credentials) {
    try {
        // Tentative de connexion
        const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
        });

        if (error) {
            // Gestion spécifique des erreurs
            switch (error.message) {
                case 'Invalid login credentials':
                    throw new Error('Email ou mot de passe incorrect');
                case 'Email not confirmed':
                    throw new Error('Veuillez confirmer votre email avant de vous connecter');
                default:
                    throw error;
            }
        }

        if (!data.user) {
            throw new Error('Aucun utilisateur trouvé');
        }

        // Récupérer le profil utilisateur
        const { data: userProfile, error: profileError } = await supabase
            .from('User')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        if (profileError) {
            throw new Error('Erreur lors de la récupération du profil');
        }

        return {
            ...data,
            profile: (() => {
                localStorage.setItem('userProfile', JSON.stringify({
                    id: userProfile.id,
                    role: userProfile.role
                }));
                return userProfile;
            })()
        };
    } catch (error) {
        console.error('Erreur détaillée:', error);
        throw error;
    }
}

// Fonction pour la déconnexion
export async function logoutUser() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    } catch (error) {
        console.error('Erreur détaillée:', error);
        throw error;
    }
}

// Fonction pour vérifier si l'utilisateur est connecté
export async function isUserLoggedIn() {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
}

