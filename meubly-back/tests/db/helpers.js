import { createClient } from "@supabase/supabase-js";

const TEST_PASSWORD = "Test-password-123!";
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

/** Client service role (contourne le RLS) pour preparer et nettoyer les donnees. */
export function adminClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, noSession);
}

/** Client anonyme : ce que voit un visiteur avec la cle publique. */
export function anonClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, noSession);
}

/**
 * Cree un compte confirme et renvoie un client anon portant son jeton.
 * @param {{ metadata?: Record<string, unknown> }} [options]
 * @returns {Promise<{ id: string, email: string, token: string, client: import("@supabase/supabase-js").SupabaseClient }>}
 */
export async function createTestUser({ metadata = {} } = {}) {
  const admin = adminClient();
  const email = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@meubly.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  const id = data.user.id;

  // Tant que le trigger de creation de profil (migration 007) n'existe pas.
  const { error: profileError } = await admin
    .from("profile")
    .upsert({ user_id: id, email }, { onConflict: "user_id", ignoreDuplicates: true });
  if (profileError) throw profileError;

  const anon = anonClient();
  const { data: session, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (signInError) throw signInError;
  const token = session.session.access_token;
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    ...noSession,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  return { id, email, token, client };
}

/** Supprime le compte (et par cascade profil, favoris, avis). */
export async function deleteTestUser(id) {
  if (!id) return;
  const { error } = await adminClient().auth.admin.deleteUser(id);
  if (error) throw error;
}
