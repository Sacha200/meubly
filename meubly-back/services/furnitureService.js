import { supabase } from '../supabase.js';

// Données de meubles prédéfinies
const FURNITURE_DATA = [
    {
        furniture_id: '1',
        name: "Canapé d'angle moderne",
        text: "Canapé d'angle contemporain en tissu gris, convertible avec coffre de rangement",
        price: 899.99,
        cover_url: "https://www.ikea.com/fr/fr/images/products/friheten-canape-d-angle-convertible-avec-rangement-hyllie-beige__0690261_pe723182_s5.jpg",
        nb_offers: 5,
        created_at: new Date()
    },
    {
        furniture_id: '2',
        name: "Table à manger extensible",
        text: "Table à manger extensible en chêne massif, style scandinave",
        price: 599.99,
        cover_url: "https://www.ikea.com/fr/fr/images/products/ekedalen-table-extensible-chene__0736963_pe740828_s5.jpg",
        nb_offers: 3,
        created_at: new Date()
    },
    {
        furniture_id: '3',
        name: "Fauteuil velours",
        text: "Fauteuil confortable en velours vert émeraude avec accoudoirs",
        price: 299.99,
        cover_url: "https://www.ikea.com/fr/fr/images/products/strandmon-fauteuil-enfant-vissle-gris__0729754_pe737122_s5.jpg",
        nb_offers: 7,
        created_at: new Date()
    }
];

export const furnitureService = {
    async initializeDatabase() {
        try {
            const { data, error } = await supabase
                .from('Furniture')
                .select('*');

            if (error) throw error;

            if (data.length === 0) {
                const { data: insertedData, error: insertError } = await supabase
                    .from('Furniture')
                    .insert(FURNITURE_DATA);

                if (insertError) throw insertError;
                return insertedData;
            }

            return data;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            throw error;
        }
    },

    async getFurnitureById(id) {
        try {
            const { data, error } = await supabase
                .from('Furniture')
                .select('*')
                .eq('furniture_id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération du meuble:', error);
            throw error;
        }
    },

    async addFurniture(furniture) {
        try {
            const { data, error } = await supabase
                .from('Furniture')
                .insert([{
                    ...furniture,
                    created_at: new Date()
                }]);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erreur lors de l\'ajout du meuble:', error);
            throw error;
        }
    }
}; 