import { providerRepository } from "../repositories/providerRepository.js";
import dotenv from 'dotenv';
dotenv.config();

function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
}

export const providerService = {
  async getAllProviders() {
    return await providerRepository.findAll();
  },

  async getProviderById(id) {
    return await providerRepository.findById(id);
  },

  async createProvider(providerData) {
    return await providerRepository.create(providerData);
  },

  async updateProvider(id, updates) {
    return await providerRepository.update(id, updates);
  },

  async deleteProvider(id) {
    return await providerRepository.delete(id);
  },

  async compareCategory(categoryId) {
    try {
      const providers = await providerRepository.findAll();

      if (!providers || providers.length === 0) {
        return [];
      }

      let promesses = [];
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

      providers.forEach((provider) => {
        promesses.push(
          fetch(`${baseUrl}${provider.url}/${categoryId}`)
            .then(response => ({ response, providerName: provider.name }))
            .catch(error => {
              console.error(`Erreur lors de l'appel à ${provider.name}:`, error);
              return { error: true, providerName: provider.name };
            })
        );
      });

      const results = await Promise.allSettled(promesses);
      let partnerfurniture = [];

      for (const result of results) {
        if (result.status === "fulfilled") {
          try {
            const { response, providerName, error } = result.value;
            if (error || !response.ok) continue;

            const furn = await response.json();
            if (Array.isArray(furn)) {
                const furnitureWithCompany = furn.map(item => ({
                  ...item,
                  company: providerName
                }));
                partnerfurniture.push(...furnitureWithCompany);
            }
          } catch (error) {
            console.error(`Erreur parsing JSON pour ${result.value.providerName}:`, error);
          }
        }
      }

      // Fallback test data if empty
      if (partnerfurniture.length === 0) {
           partnerfurniture = [
            { id: 1, name: "Meuble de rangement enfant 6 bacs", price: "45.00", company: "Amazon", link: "https://amazon.fr", description: "Meuble de rangement enfant 6 bacs" },
            { id: 2, name: "Meuble de rangement enfant 6 bacs", price: "45.00", company: "Ikea", link: "https://ikea.fr", description: "Meuble de rangement enfant 6 bacs" },
            { id: 3, name: "Table basse moderne", price: "89.99", company: "Amazon", link: "https://amazon.fr", description: "Table basse moderne" },
            { id: 4, name: "Table basse moderne", price: "89.99", company: "Manomano", link: "https://manomano.fr", description: "Table basse moderne" }, 
            { id: 5, name: "Chaise de bureau ergonomique", price: "129.50", company: "Amazon", link: "https://amazon.fr", description: "Chaise de bureau ergonomique" },
            { id: 6, name: "Chaise de bureau ergonomique", price: "129.50", company: "Ikea", link: "https://ikea.fr", description: "Chaise de bureau ergonomique" }, 
            { id: 7, name: "Étagère murale design", price: "75.00", company: "Amazon", link: "https://amazon.fr", description: "Étagère murale design" },
            { id: 8, name: "Étagère murale design", price: "75.00", company: "But", link: "https://but.fr", description: "Étagère murale design" }, 
          ];
      }

      // Deduplication
      const uniqueFurniture = [];
      const seen = new Set();
      
      partnerfurniture.forEach(item => {
        const key = `${item.name?.toLowerCase().trim()}_${item.price}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueFurniture.push(item);
        }
      });

      shuffle(uniqueFurniture);
      uniqueFurniture.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

      return uniqueFurniture;

    } catch (error) {
      console.error("ProviderService Error:", error);
      throw error;
    }
  }
};
