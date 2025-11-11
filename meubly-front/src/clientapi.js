import { supabase } from './supabase';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://meubly-back.onrender.com/api/v1').replace(/\/+$/, '');
// ===========================
// PRODUITS (liste + filtres)
// ===========================

// Fonction pour récupérer tous les produits
export async function getProducts({
    q = '',
    categoryId = null,
    minPrice = null,
    maxPrice = null,
    sort = 'created_at:desc',
    page = 1,
    limit = 12,
  } = {}) {
    try {
      const url = new URL(`${API_BASE}/furnitures`);
      console.log('API_BASE:', API_BASE);
      console.log('URL construite:', url.toString());
      if (q) url.searchParams.set('q', q);
      if (categoryId) url.searchParams.set('categoryId', String(categoryId));
      if (minPrice != null) url.searchParams.set('minPrice', String(minPrice));
      if (maxPrice != null) url.searchParams.set('maxPrice', String(maxPrice));
      url.searchParams.set('sort', sort);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));
  
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
  
      // <-- Renvoie { items, total, page, limit }
      return await response.json();
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  }


// Fonction pour récupérer un produit spécifique
export async function getProductById(id) {
  try {
    const response = await fetch(`${API_BASE}/furnitures/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erreur lors de la récupération du produit');
    return data;
  } catch (error) {
    console.error('Erreur détaillée:', error);
    throw error;
  }
}

// Fonction pour récupérer les produits par catégorie
export async function getProductsByCategory(categoryId, opts = {}) {
    const { page = 1, limit = 12, sort = 'created_at:desc' } = opts;
    return getProducts({ categoryId, page, limit, sort });
  }
  

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

// Fonction pour ajouter un meuble aux favoris
export async function addFavorite(furniture_id) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error("Utilisateur non connecté");
    }

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

// Fonction pour supprimer un favori
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

// Fonction pour vérifier si l'utilisateur est connecté
export async function isUserLoggedIn() {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
}

// Fonction pour récupérer les comparaisons de prix
export async function getProviderComparison(category_id) {
    try {
      const response = await fetch(`${API_BASE}/compare/${category_id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des comparaisons:', error);
      throw error;
    }
  }

// Recherche par texte, renvoie { items, total, page, limit }
export async function searchProducts(searchQuery = '', opts = {}) {
    const { page = 1, limit = 12, sort = 'created_at:desc', categoryId = null, minPrice = null, maxPrice = null } = opts;
    return getProducts({ q: searchQuery, categoryId, minPrice, maxPrice, page, limit, sort });
  }
  

// Fonction pour mettre à jour un produit
export async function updateProduct(id, productData) {
    try {
      const response = await fetch(`${API_BASE}/furnitures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

// ===========================
// AVIS PRODUITS
// ===========================

export async function listProductReviews(productId, { page = 1, limit = 5 } = {}) {
    const url = new URL(`${API_BASE}/furnitures/${productId}/reviews`);
    if (page) url.searchParams.set('page', String(page));
    if (limit) url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
        const message = data?.error || data?.errors?.[0]?.msg || 'Erreur lors de la récupération des avis';
        throw new Error(message);
    }

    return data;
}

export async function submitProductReview(productId, payload) {
    const response = await fetch(`${API_BASE}/furnitures/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        const message = data?.error || data?.errors?.[0]?.msg || 'Erreur lors de l\'enregistrement de l\'avis';
        throw new Error(message);
    }

    return data;
}