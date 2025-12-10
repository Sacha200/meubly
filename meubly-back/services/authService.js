import { supabase } from "../supabase.js";
import { userRepository } from "../repositories/userRepository.js";

export const authService = {
  async register({ username, lastname, email, password }) {
     // 1. Check existing
     const existing = await userRepository.findByEmail(email);
     if (existing) {
         throw new Error("Un compte existe déjà avec cet email");
     }

     // 2. Auth SignUp
     const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, lastname } }
     });

     if (authError) throw authError;

     // 3. Create Public User
     if (authData.user) {
         await userRepository.create({
             user_id: authData.user.id,
             username,
             lastname,
             email,
             created_at: new Date()
         });
     }

     return {
         user: { ...authData.user, username, lastname },
         session: authData.session
     };
  },

  async login({ email, password }) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error("Email ou mot de passe incorrect");

      const userProfile = await userRepository.findById(data.user.id); // Wait... findById uses `id` (PK) which is user_id?
      // In User table, is PK `id` or `user_id`?
      // auth.js used `.eq("user_id", data.user.id)` to fetch profile.
      // userRepository.findById uses `.eq('id', id)`.
      // WARN: Schema check.
      // In auth.js: `.eq("user_id", data.user.id)`
      // In users.js: `.eq("id", id)`.
      // It seems the User table has `id` (PK, likely UUID equal to auth.uid OR serial?)
      // AND `user_id` (FK to auth.users)?
      // Inspecting auth.js again:
      // Insert: `user_id: authData.user.id`.
      // So `user_id` is the link to Auth.
      // `id` might be an internal PK.
      // To be safe, I should add findByUserId to repo.
      
      // Let's rely on what we know: auth.js selects by user_id to get profile.
      
      const { data: profile } = await supabase.from('User').select('*').eq('user_id', data.user.id).single();
      
      return {
          session: data.session,
          user: data.user,
          profile
      };
  }
};
