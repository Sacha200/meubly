import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const API_URL = `http://localhost:${process.env.PORT || 5000}/api/v1`;

async function createDemoUser() {
  console.log("👤 Création Utilisateur Démo...");
  const email = "demo@meubly.com";
  const password = "password123";

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      username: "DemoUser",
      lastname: "Demo",
    }),
  });

  if (res.status === 201) {
    console.log("✅ SUCCÈS ! Utilisateur créé.");
  } else if (res.status === 409 || (await res.text()).includes("existe déjà")) {
    console.log("ℹ️ Le compte existe déjà. (C'est bon !)");
  } else {
    console.error("❌ Erreur:", res.status, await res.text());
    return;
  }

  console.log("\n🔑 IDENTIFIANTS :");
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
}

createDemoUser();
