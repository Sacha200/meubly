import { supabase } from '../supabase';
import API_BASE from './apiBase';

// Fonction pour ajouter un meuble aux favoris
export async function addFavorite(furniture_id) {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) throw new Error("Utilisateur non connecté");

    const response = await fetch(`${API_BASE}/favorites/${furniture_id}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur lors de l'ajout aux favoris");
    }
    return true;
}

// Fonction pour supprimer un favori
export async function removeFavorite(furniture_id) {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) throw new Error("Utilisateur non connecté");

    const response = await fetch(`${API_BASE}/favorites/${furniture_id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${session.access_token}`
        }
    });

    if (!response.ok) {
        throw new Error("Erreur lors de la suppression du favori");
    }
}

// Fonction pour récupérer les favoris de l'utilisateur
export async function getUserFavorites() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return []; // Retourne tableau vide si pas connecté

    const response = await fetch(`${API_BASE}/favorites`, {
        headers: {
            'Authorization': `Bearer ${session.access_token}`
        }
    });

    if (!response.ok) {
        console.error("Erreur fetch favorites", await response.text());
        return [];
    }
    
    return await response.json();
}

