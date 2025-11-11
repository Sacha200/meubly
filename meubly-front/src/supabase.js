import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Configuration pour la production
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configuration spécifique pour Vercel
    flowType: 'pkce'
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions) 