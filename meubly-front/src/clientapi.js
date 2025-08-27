import { supabase } from './supabase';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Fonction pour récupérer tous les produits
export async function getProducts() {
    try {
        console.log('Appel API getProducts...');
        const response = await fetch(`${API_BASE_URL}/api/v1/furnitures`);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        // console.log('Données reçues:', data);
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

// Fonction pour récupérer les produits par catégorie
export async function getProductsByCategory(category) {
    try {
        // Cette ligne fait une requête HTTP GET vers l'API pour récupérer les meubles d'une catégorie spécifique
        // L'URL est construite en utilisant l'URL de base (API_BASE_URL) et en ajoutant le paramètre de requête 'category'
        const response = await fetch(`${API_BASE_URL}/api/v1/furnitures?category=${category}`);

        // Cette ligne convertit la réponse HTTP en objet JavaScript en parsant le JSON
        // La réponse contient la liste des meubles de la catégorie demandée
        const data = await response.json(); 

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération des produits');
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
                console.error('Erreur insertion User:', userError);
                throw userError;
            }

            // 3. Envoyer explicitement l'email de confirmation si nécessaire
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: authData.user.email
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

/**
 * Ajoute un meuble aux favoris de l'utilisateur connecté
 * @param {string} furniture_id - L'ID du meuble à ajouter
 * @returns {Promise<object>} - Le favori ajouté
 */
export async function addFavorite(furniture_id) {
  // Récupérer l'utilisateur connecté
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Utilisateur non connecté");
  }

  // Insérer dans la table Favoris
  const { data, error } = await supabase
    .from('Favoris')
    .insert([
      {
        user_id: user.id,
        furniture_id: furniture_id
      }
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function removeFavorite(furniture_id) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Utilisateur non connecté");
  }

  const { error } = await supabase
    .from('Favoris')
    .delete()
    .eq('user_id', user.id)
    .eq('furniture_id', furniture_id);

  if (error) throw error;
}

export async function isUserLoggedIn() {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

export async function getProviderComparison(category_id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/compare/${category_id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des comparaisons:', error);
    throw error;
  }
}

// Fonction pour rechercher des produits
export async function searchProducts(searchQuery = '') {
    try {
        const url = `${API_BASE_URL}/api/v1/furnitures${searchQuery ? `?search=${searchQuery}` : ''}`;
        console.log('URL appelée:', url);
        console.log('Terme de recherche:', searchQuery);
        
        const response = await fetch(url);
        console.log('Status de la réponse:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur du serveur:', errorText);
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Données reçues du serveur:', data);
        return data;
    } catch (error) {
        console.error('Erreur lors de la recherche des produits:', error);
        throw error;
    }
}

// Fonction pour mettre à jour un produit
export async function updateProduct(id, productData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/furnitures/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erreur lors de la mise à jour du produit');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur détaillée:', error);
    throw error;
  }
}