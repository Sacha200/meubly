// Setup des tests DB : charge le .env RACINE (stack locale) sans rien afficher,
// puis expose les variables attendues par le back. Refuse toute base non locale.
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { assertLocalSupabase } from "./guard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const local = {};
dotenv.config({ path: path.join(__dirname, "../../../.env"), processEnv: local });

process.env.SUPABASE_URL = local.SUPABASE_PUBLIC_URL || "http://localhost:8000";
process.env.SUPABASE_ANON_KEY = local.ANON_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = local.SERVICE_ROLE_KEY;

assertLocalSupabase(process.env.SUPABASE_URL);
if (!process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Tests DB : ANON_KEY / SERVICE_ROLE_KEY absentes du .env racine.");
}
