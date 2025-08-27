import express from "express";
import { supabase } from "../../supabase.js";
import axios from "axios";

const router = express.Router();

// Route pour récupérer tous les fournisseurs
router.get("/providers", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Provider").select("*");
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour récupérer un fournisseur par ID
router.get("/providers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("Provider").select("*").eq("id", id);
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour créer un nouveau fournisseur
router.post("/providers", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Provider").insert(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour mettre à jour un fournisseur
router.patch("/providers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("Provider").update(req.body).eq("id", id);
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour supprimer un fournisseur
router.delete("/providers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("Provider").delete().eq("id", id);
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes existantes pour la récupération des données des fournisseurs
router.get("/:partner/offers/:categoryId", async (req, res) => {
  const { partner, categoryId } = req.params;
  try {
    const { data, error } = await supabase
      .from(partner.charAt(0).toUpperCase() + partner.slice(1))
      .select("*")
      .eq("category_id", categoryId);

    if (error) console.log("error", error);
    // console.log('data', data);
    return res.json(data);
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ error: error.message });
  }
});

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

// recupère les données de tous les fournisseurs pour une catégorie de meubles donnée
router.get("/compare/:categoryId", async (req, res) => {
  const { categoryId } = req.params;

  // recuperation des données de la table provider
  try {
    const { data, error } = await supabase.from("Provider").select("*");
    if (error) throw error;
    
    let providers = data;
    
    // Si aucun fournisseur n'est trouvé, retourner un tableau vide
    if (!providers || providers.length === 0) {
      console.log("Aucun fournisseur trouvé dans la base de données");
      return res.status(200).json([]);
    }
    
    let promesses = [];

    // Utiliser l'URL de base dynamique au lieu de localhost:3000
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    console.log('URL de base utilisée:', baseUrl);

    try {
      providers.forEach(async (provider) => {
        console.log(`Appel vers: ${baseUrl}${provider.url}/${categoryId}`);
        promesses.push(
          fetch(`${baseUrl}${provider.url}/${categoryId}`)
            .then(response => ({ response, providerName: provider.name }))
            .catch(error => {
              console.error(`Erreur lors de l'appel à ${provider.name}:`, error);
              return { error: true, providerName: provider.name };
            })
        );
      });
      console.log("Nombre de promesses créées:", promesses.length);

      Promise.allSettled(promesses).then(async (results) => {
        let partnerfurniture = [];
        
        for (const result of results) {
          if (result.status === "fulfilled") {
            try {
              const { response, providerName, error } = result.value;
              
              // Si c'est une erreur, passer au suivant
              if (error) {
                console.log(`Erreur pour ${providerName}, passage au suivant`);
                continue;
              }
              
              if (!response.ok) {
                console.log(`Réponse non OK pour ${providerName}: ${response.status}`);
                continue;
              }
              
              const furn = await response.json();
              
              // Vérifier que furn est un tableau
              if (Array.isArray(furn)) {
                // Ajouter le nom de l'entreprise à chaque produit
                const furnitureWithCompany = furn.map(item => ({
                  ...item,
                  company: providerName
                }));
                
                partnerfurniture.push(...furnitureWithCompany);
                console.log(`${providerName}: ${furn.length} produits ajoutés`);
              } else {
                console.log(`${providerName}: données non valides (pas un tableau)`);
              }
            } catch (error) {
              console.error(`Erreur parsing JSON pour ${result.value.providerName}:`, error);
            }
          } else {
            console.error("Erreur lors de la récupération des données:", result.reason);
          }
        }
        
        console.log(`Total des produits récupérés: ${partnerfurniture.length}`);
        
        if (partnerfurniture.length > 0) {
          shuffle(partnerfurniture);
          partnerfurniture.sort(
            (a, b) => parseFloat(a.price) - parseFloat(b.price)
          );
        }
        
        console.log("partnerfurnitureFinal", partnerfurniture.length);
        return res.status(200).json(partnerfurniture);
      });
    } catch (error) {
      console.log("erreur dans la boucle des fournisseurs:", error);
      return res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.log("erreur requete provider", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
