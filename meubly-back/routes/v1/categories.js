import express from 'express';
import { supabase } from '../../supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();    
router.use(express.json());

// Get all categories
router.get('/categories', async (req, res) => {
    try {
      const { search = '', limit = 100 } = req.query;
  
      let query = supabase
        .from('Category')
        .select('category_id, title, cover_url')
        .order('title', { ascending: true })
        .limit(Number(limit) || 100);
  
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
  
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });
  
      return res.status(200).json(data || []);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });


// Get a category by id
router.get('/categories/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid category id' });

    const { data, error } = await supabase
      .from('Category')
      .select('category_id, title, cover_url')
      .eq('category_id', id)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Category not found' });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});                

// Create a new category
router.post('/categories', async (req, res) => {
    try {
      const { title, cover_url } = req.body;
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'title is required' });
      }
  
      const { data, error } = await supabase
        .from('Category')
        .insert({ title, cover_url })
        .select('category_id, title, cover_url')
        .single();
  
      if (error) return res.status(500).json({ error: error.message });
  
      return res.status(201).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });


// Update a category
router.put('/categories/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid category id' });

    const { title, cover_url } = req.body;
    const payload = {};
    if (typeof title === 'string') payload.title = title;
    if (typeof cover_url === 'string' || cover_url === null) payload.cover_url = cover_url;

    const { data, error } = await supabase
      .from('Category')
      .update(payload)
      .eq('category_id', id)
      .select('category_id, title, cover_url')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete a category
router.delete('/categories/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid category id' });
  
      const { error } = await supabase.from('Category').delete().eq('category_id', id);
      if (error) return res.status(500).json({ error: error.message });
  
      return res.status(204).send(); // No Content
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }); 

export default router;          