import request from 'supertest';
// import { app } from '../../app.js'; // REMOVED: Static import causes init before env load
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Force load .env for integration tests, overriding setup.js mocks
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envConfig = dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });

// Restore console
console.log = console.warn; 
console.error = console.warn; 

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Favorites Integration', () => {
  let app; // Will load dynamically
  let testUser;
  let testFurnitureId;
  let testToken;
  let supabase;

  beforeAll(async () => {
      try {
        // Dynamic import app AFTER dotenv is loaded
        const appModule = await import('../../app.js');
        app = appModule.app;
        
        // Setup supabase client for Setup/Teardown logic (using same creds as app ideally)
        const realSupabaseUrl = process.env.SUPABASE_URL;
        const realSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        supabase = createClient(realSupabaseUrl, realSupabaseKey);
        
        // 1. Create a Test User
    const email = `test_fav_${Date.now()}@test.com`;
    const password = 'password123';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if(authError) throw authError;
    testUser = authData.user;
    testToken = authData.session?.access_token;
    
    // Ensure we have a session/token. If signUp doesn't return session (email confirm), we might need signIn
    if(!testToken) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if(signInError) throw signInError;
        testToken = signInData.session.access_token;
    }

    // 2. Insert User profile (Required because favorites references public.User)
    if(testUser) {
        // Check if exists first (cleaner)
        const { data: existing } = await supabase.from('User').select('id').eq('user_id', testUser.id).maybeSingle();
        if(!existing) {
             const { error: profileError } = await supabase.from('User').insert([{
                 user_id: testUser.id,
                 email: email,
                 username: `TestUser_${Date.now()}`,
                 lastname: 'TestLastName', // Added potential required field
                 created_at: new Date()
             }]);
             if(profileError) throw profileError;
        }
    }
    
    // 3. Get a furniture ID
    const { data: furnitures } = await supabase.from('Furniture').select('furniture_id').limit(1);
    if(furnitures && furnitures.length > 0) {
        testFurnitureId = furnitures[0].furniture_id;
    } else {
        throw new Error("No furniture found in DB to test favorites");
    }
  } catch(e) {
      process.stdout.write(`\n❌ SETUP ERROR: ${e.message}\n`);
      if(e.response) process.stdout.write(JSON.stringify(e.response));
      throw e;
  }
   });

  afterAll(async () => {
    // Cleanup
    if(testUser) {
        // Delete user (cascade should delete favorite)
        // Note: supabase admin api needed to delete from auth.users usually, or just leave it
        // We can at least delete from public.User if that's where we map
    }
  });

  it('should add a furniture to favorites', async () => {
    const res = await request(app)
      .post(`/api/v1/favorites/${testFurnitureId}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toEqual("Added to favorites");
  });

  it('should list user favorites', async () => {
    const res = await request(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${testToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].furniture_id).toBeDefined();
  });

  it('should remove a furniture from favorites', async () => {
    const res = await request(app)
      .delete(`/api/v1/favorites/${testFurnitureId}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual("Removed from favorites");

    // Verify it is gone
    const check = await request(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${testToken}`);
    
    const found = check.body.find(f => f.furniture_id === testFurnitureId);
    expect(found).toBeUndefined();
  });
});
