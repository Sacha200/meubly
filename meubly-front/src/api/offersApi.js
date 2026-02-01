import API_BASE from './apiBase';

// Fonction pour récupérer les offres d'un meuble spécifique
export async function getFurnitureOffers(furnitureId) {
    try {
        const response = await fetch(`${API_BASE}/furnitures/${furnitureId}/offers`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erreur lors de la récupération des offres');
        return data;
    } catch (error) {
        console.error('Erreur récupération offres:', error);
        throw error;
    }
}

