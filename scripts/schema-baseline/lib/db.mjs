import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const root = resolve(__dirname, "../../..");
export const envPath = resolve(root, ".env");

export function loadEnvFile() {
  if (!existsSync(envPath)) return {};
  const vars = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return vars;
}

export function projectRefFromUrl(url) {
  const match = url?.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

export function buildDatabaseUrl(env) {
  if (env.DATABASE_URL?.trim()) return env.DATABASE_URL.trim();

  const password = env.SUPABASE_DB_PASSWORD?.trim();
  const ref = projectRefFromUrl(env.VITE_SUPABASE_URL?.trim());

  if (!password || !ref) return null;

  const encoded = encodeURIComponent(password);
  return `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;
}

export function getEnv() {
  return { ...loadEnvFile(), ...process.env };
}

export function requireDatabaseUrl() {
  const url = buildDatabaseUrl(getEnv());
  if (!url) {
    throw new Error(
      "Missing database connection. Add SUPABASE_DB_PASSWORD + VITE_SUPABASE_URL or DATABASE_URL to .env",
    );
  }
  return url;
}

export async function withClient(fn) {
  const client = new pg.Client({
    connectionString: requireDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}
