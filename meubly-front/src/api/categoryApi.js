import API_BASE from './apiBase';
import { getFurnitures } from './furnituresApi';

// Fonction pour récupérer les meubles par catégorie
export async function getFurnituresByCategory(categoryId, opts = {}) {
    const { page = 1, limit = 12, sort = 'created_at:desc' } = opts;
    return getFurnitures({ categoryId, page, limit, sort });
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

