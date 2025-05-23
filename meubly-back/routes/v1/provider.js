import express from 'express';
import { supabase } from '../../supabase.js';
import axios from 'axios';

const router = express.Router();

router.get('/providers', async (req, res) => {
    try {
        const { data, error } = await supabase.from('Provider').select('*');
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:partner/offers/:categoryId', async (req, res) => {
  const { partner, categoryId } = req.params;
  try {
    const { data, error } = await supabase
      .from(partner.charAt(0).toUpperCase() + partner.slice(1))
      .select('*')  
      .eq('category_id', categoryId);

    if (error) console.log('error', error);
    // console.log('data', data);
    return res.json(data);

  } catch (error) {
    console.log('error', error);
    returnres.status(500).json({ error: error.message });
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
      array[randomIndex], array[currentIndex]];
  }
}

router.get('/compare/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  let partnerfurniture = [];
  // recuperation des données de la table provider
  try {
    const { data, error } = await supabase.from('Provider').select('*');
    if (error) throw error;
    let providers = data;
    let promesses = [];
    
    // console.log('Provider', data);

    try{
      providers.forEach(async(provider)=>{
        console.log(`http://localhost:3000${provider.url}/${categoryId}`);
        promesses.push(fetch(`http://localhost:3000${provider.url}/${categoryId}`))
      })
      console.log('promesses', promesses);

      Promise.all(promesses).then(async (result)=>{
        result.forEach(async (response) => {
          const furn = await response.json();
          // console.log('furn', furn);
          partnerfurniture.push(...furn);
          shuffle(partnerfurniture);
          partnerfurniture.sort((a,b) =>parseFloat(a.price) - parseFloat(b.price));
          console.log('partnerfurniture', partnerfurniture);
        })
        console.log('partnerfurnitureFinal', partnerfurniture);
        return res.status(200).json(partnerfurniture);
      })
    } catch (error){
      console.log('erreur', error);
    }
  } catch (error) {
      console.log('erreur requete provider', error);
  }
    // try {

    // // Récupérer les produits de chaque fournisseur pour la catégorie donnée
    // const [amazonResult, butResult, manoManoResult, ikeaResult] = await Promise.all([
    //   supabase
    //     .from('Amazon')
    //     .select('*')
    //     .eq('category_id', categoryId),
    //   supabase
    //     .from('But')
    //     .select('*')
    //     .eq('category_id', categoryId),
    //   supabase
    //     .from('ManoMano')
    //     .select('*')
    //     .eq('category_id', categoryId),
    //     supabase
    //     .from('Ikea')
    //     .select('*')
    //     .eq('category_id', categoryId),
    // ]);

  //   const comparison = {
  //     amazon: amazonResult.data || [],
  //     but: butResult.data || [],
  //     manoMano: manoManoResult.data || [],
  //     ikea: ikeaResult.data || [],
  //   };

  //   res.json(comparison);
  // } catch (error) {
  //   console.error('Erreur lors de la comparaison:', error);
  //   res.status(500).json({ error: 'Erreur serveur lors de la comparaison' });
  // }
});



export default router;
        















