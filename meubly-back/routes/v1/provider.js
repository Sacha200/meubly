import express from 'express';
import { supabase } from '../../supabaseClient';

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

router.get('/compare/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Récupérer les produits de chaque fournisseur pour la catégorie donnée
    const [amazonResult, butResult, manoManoResult] = await Promise.all([
      supabase
        .from('Amazon')
        .select('*')
        .eq('category_id', categoryId),
      supabase
        .from('But')
        .select('*')
        .eq('category_id', categoryId),
      supabase
        .from('ManoMano')
        .select('*')
        .eq('category_id', categoryId)
    ]);

    const comparison = {
      amazon: amazonResult.data || [],
      but: butResult.data || [],
      manoMano: manoManoResult.data || []
    };

    res.json(comparison);
  } catch (error) {
    console.error('Erreur lors de la comparaison:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la comparaison' });
  }
});

export default router;
        















