import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signHS256({ header, payload, secret }) {
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest();
  return `${data}.${base64url(sig)}`;
}

function loadEnv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    env[key] = value;
  }
  return env;
}

const repoRoot = path.resolve(process.cwd());
const envPath = path.join(repoRoot, ".env");

if (!fs.existsSync(envPath)) {
  console.error(`.env introuvable: ${envPath}`);
  process.exit(1);
}

const env = loadEnv(envPath);
const jwtSecret = env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  console.error("JWT_SECRET manquant ou trop court (min 32 chars recommandé).");
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const exp = now + 60 * 60 * 24 * 365 * 10; // 10 ans

const header = { alg: "HS256", typ: "JWT" };
const iss = "supabase";

const anon = signHS256({
  header,
  payload: { role: "anon", iss, iat: now, exp },
  secret: jwtSecret,
});

const serviceRole = signHS256({
  header,
  payload: { role: "service_role", iss, iat: now, exp },
  secret: jwtSecret,
});

console.log("ANON_KEY=" + anon);
console.log("SERVICE_ROLE_KEY=" + serviceRole);

