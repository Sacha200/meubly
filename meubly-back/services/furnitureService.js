import { furnitureRepository } from "../repositories/furnitureRepository.js";
import { offerRepository } from "../repositories/offerRepository.js";

export const furnitureService = {
  // Récupérer un meuble par son id
  async getFurnitureById(id) {
    try {
      const furniture = await furnitureRepository.findById(id);
      // Clean up nb_offers
      if (furniture) {
          furniture.nb_offers = furniture.nb_offers || 1;
      }
      return furniture;
    } catch (error) {
      console.error("Erreur lors de la récupération du meuble:", error);
      throw error;
    }
  },

  async getOffers(furnitureId) {
    // Récupérer les offres triées par prix
    const offers = await offerRepository.findByFurnitureId(furnitureId);
    
    // Enrichir les données : Identifier la meilleure offre (et autres stats si besoin)
    if (offers && offers.length > 0) {
        offers[0].is_best_price = true; // Le premier est le moins cher grâce au tri SQL
        
        // Calculer l'économie réalisée / Ecart type ?
        // Pour l'instant restons simple : Tri + Flag
    }
    
    return offers;
  },

  async addFurniture(furniture) {
    try {
      return await furnitureRepository.create(furniture);
    } catch (error) {
      console.error("Erreur lors de l'ajout du meuble:", error);
      throw error;
    }
  },

  async searchFurnitures({ q, categoryId, minPrice, maxPrice, sort, page = 1, limit = 12 }) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const lim = Math.min(60, Math.max(1, parseInt(limit, 10)));
    const from = (pageNum - 1) * lim;
    const to = from + lim - 1;

    try {
        const { data, count } = await furnitureRepository.search({
            q,
            categoryId: categoryId ? Number(categoryId) : undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            sort,
            from,
            to
        });

        const items = (data || []).map(item => ({
            ...item,
            nb_offers: item.nb_offers || 1
        }));

        return {
            items,
            total: count || 0,
            page: pageNum,
            limit: lim
        };
    } catch (error) {
        console.error("Erreur lors de la recherche:", error);
        throw error;
    }
  },

  async updateFurniture(id, updates) {
      try {
          return await furnitureRepository.update(id, updates);
      } catch (error) {
          console.error("Erreur update:", error);
          throw error;
      }
  },

  async deleteFurniture(id) {
      try {
          await furnitureRepository.delete(id);
      } catch (error) {
          console.error("Erreur delete:", error);
          throw error;
      }
  },


  
  async cacheFurniture(furniture) {
       try {
          await furnitureRepository.upsert(furniture);
      } catch (error) {
           console.error("Erreur cache:", error);
           // Non-blocking error ?
      }
  }
};
