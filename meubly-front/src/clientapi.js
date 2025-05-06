import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_APP_BASE_URL;

// Fonction pour récupérer tous les produits
export async function getProducts() {
    try {
        console.log('Appel API getProducts...');
        const response = await fetch(`${API_BASE_URL}/api/v1/furnitures`);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Données reçues:', data);
        return data;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

// Fonction pour récupérer un produit spécifique
export async function getProductById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/furnitures/${id}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération du produit');
        }

        return data;
    } catch (error) {
        console.error('Erreur détaillée:', error);
        throw error;
    }
}

// Fonction pour l'inscription avec Supabase
export async function registerUser(userData) {
    try {
        console.log('Tentative d\'inscription avec:', userData.email);
        
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
                // Forcer l'envoi de l'email
                shouldCreateUser: true
            }
        });

        if (authError) {
            console.error('Erreur Auth Supabase:', authError);
            throw authError;
        }

        console.log('Réponse inscription:', authData);

        // 2. Si l'inscription Auth réussit, on ajoute l'utilisateur dans la table User
        if (authData.user) {
            const { data: userProfile, error: userError } = await supabase
                .from('User')
                .insert([
                    {
                        user_id: authData.user.id,
                        username: userData.username,
                        lastname: userData.lastname,
                        email: userData.email,
                        created_at: new Date().toISOString().split('T')[0]
                    }
                ])
                .select();

            if (userError) {
                console.error('Erreur insertion User:', userError);
                throw userError;
            }

            // 3. Envoyer explicitement l'email de confirmation si nécessaire
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: userData.email
            });

            if (resendError) {
                console.error('Erreur envoi email:', resendError);
            }

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
        console.log('Tentative de connexion avec:', credentials.email);

        // Tentative de connexion
        const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
        });

        if (error) {
            console.error('Erreur de connexion:', error);
            
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

        console.log('Utilisateur connecté:', data.user);

        // Récupérer le profil utilisateur
        const { data: userProfile, error: profileError } = await supabase
            .from('User')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        if (profileError) {
            console.error('Erreur récupération profil:', profileError);
            throw new Error('Erreur lors de la récupération du profil');
        }

        return {
            ...data,
            profile: userProfile
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

/**
 * {
  "error": null,
  "data": [
    
  ],
  "count": null,
  "status": 200,
  "statusText": "OK"
}
 * 
 */