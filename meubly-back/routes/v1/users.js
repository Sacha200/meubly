import express from 'express';
import { supabase } from '../../supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
router.use(express.json());

router.get('/users', async (req, res) => {
    try {
        const { data, error } = await supabase.from('User').select('*');
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('User').select('*').eq('id', id);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}); 

router.post('/users', async (req, res) => {
    // Validation des données
    const { error: validationError } = userSchema.validate(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError.details[0].message });
    }

    try {
        const { data, error } = await supabase.from('User').insert(req.body);
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('User').update(req.body).eq('id', id);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('User').delete().eq('id', id);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}); 

export default router;  
