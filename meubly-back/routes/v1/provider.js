import express from "express";
import { supabase } from "../../supabase.js";
import axios from "axios";

const router = express.Router();

router.get("/providers", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Provider").select("*");
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
    let promesses = [];

    // console.log('Provider', data);

    try {
      providers.forEach(async (provider) => {
        console.log(`http://localhost:3000${provider.url}/${categoryId}`);
        promesses.push(
          fetch(`http://localhost:3000${provider.url}/${categoryId}`)
            .then(response => ({ response, providerName: provider.name }))
        );
      });
      console.log("promesses", promesses);

      Promise.allSettled(promesses).then(async (results) => {
        let partnerfurniture = [];
        
        for (const result of results) {
          if (result.status === "fulfilled") {
            try {
              const { response, providerName } = result.value;
              const furn = await response.json();
              
              // Ajouter le nom de l'entreprise à chaque produit
              const furnitureWithCompany = furn.map(item => ({
                ...item,
                company: providerName
              }));
              
              partnerfurniture.push(...furnitureWithCompany);
            } catch (error) {
              console.error("Error parsing JSON:", error);
            }
          } else {
            console.error("Error fetching data:", result.reason);
          }
        }
        
        shuffle(partnerfurniture);
        partnerfurniture.sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price)
        );
        console.log("partnerfurnitureFinal", partnerfurniture.length);
        return res.status(200).json(partnerfurniture);
      });
    } catch (error) {
      console.log("erreur", error);
    }
  } catch (error) {
    console.log("erreur requete provider", error);
  }
});

export default router;
