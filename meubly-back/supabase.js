// supabase.js - Configuration de Supabase pour le backend
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
export const supabaseUrl = process.env.SUPABASE_URL;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY) {
    console.warn("WARNING: No Supabase Key found in environment!");
}

// Use Service Role Key for backend administration (bypasses RLS)
// Fallback to Anon Key if not present (but RLS might block)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (supabaseKey) {
    const keyType = (supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY) ? "SERVICE_ROLE" : "ANON";
}

// Export for scoped clients
// Always use ANON key for scoped clients (the token provides the privilege)
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
// Global Admin Client (Service Role if available)
export const supabase = createClient(supabaseUrl, supabaseKey);


