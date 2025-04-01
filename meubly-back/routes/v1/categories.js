import express from 'express';
import { supabase } from '../../supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();    
router.use(express.json());

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const { data, error } = await supabase.from('Category').select('*');
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}); 

// Get a category by id
router.get('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('Category').select('*').eq('id', id);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});                     

// Create a new category
router.post('/categories', async (req, res) => {
    const { category_id, title, cover_url} = req.body;
    try {
        const { data, error } = await supabase.from('Category').insert({category_id: category_id, title, cover_url });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a category
router.put('/categories/:id', async (req, res) => {
    const { id } = req.params;
    const { title, cover_url } = req.body;
    try {
        const { data, error } = await supabase.from('Category').update({ title, cover_url }).eq('id', id);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a category
router.delete('/categories/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase.from('Category').delete().eq('id', id);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});     

export default router;          