import express from 'express';
import { supabase } from '../../supabase.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
router.use(express.json());

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, lastname, email, password } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const { data: existingUser } = await supabase
            .from('User')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({
                error: "Un compte existe déjà avec cet email"
            });
        }

        // Créer l'utilisateur dans Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    lastname
                }
            }
        });

        if (authError) {
            console.error("Erreur auth:", authError);
            return res.status(400).json({ 
                error: authError.message 
            });
        }

        // Ajouter les informations dans la table User
        const { data: userData, error: userError } = await supabase
            .from('User')
            .insert([
                {
                    user_id: authData.user.id,
                    username,
                    lastname,
                    email,
                    created_at: new Date()
                }
            ]);

        if (userError) {
            console.error("Erreur user:", userError);
            return res.status(400).json({ 
                error: userError.message 
            });
        }

        res.status(201).json({
            message: 'Inscription réussie',
            user: userData[0]
        });

    } catch (error) {
        console.error("Erreur complète:", error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Login a user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.from('User').select('*').eq('email', email).single();
        if (error || !data) throw new Error('Invalid email or password');

        const isPasswordValid = await bcrypt.compare(password, data.password);
        if (!isPasswordValid) throw new Error('Invalid email or password');

        const token = jwt.sign({ id: data.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Logout a user
router.post('/logout', (req, res) => {
    // Invalidate the token on the client side
    res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
