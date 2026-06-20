#!/usr/bin/env node
/**
 * Apply supabase/migrations/*.sql in order via direct Postgres connection.
 *
 * Requires in .env (or env):
 *   SUPABASE_DB_PASSWORD  — Database password from Supabase Dashboard → Settings → Database
 *   VITE_SUPABASE_URL     — used to derive db.<ref>.supabase.co host
 *
 * Or pass DATABASE_URL directly.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env");
const migrationsDir = resolve(root, "supabase", "migrations");

function loadEnvFile() {
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

function projectRefFromUrl(url) {
  const match = url?.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

function buildDatabaseUrl(env) {
  if (env.DATABASE_URL?.trim()) return env.DATABASE_URL.trim();

  const password = env.SUPABASE_DB_PASSWORD?.trim();
  const ref = projectRefFromUrl(env.VITE_SUPABASE_URL?.trim());

  if (!password || !ref) return null;

  const encoded = encodeURIComponent(password);
  return `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;
}

async function main() {
  const fileEnv = loadEnvFile();
  const env = { ...fileEnv, ...process.env };
  const databaseUrl = buildDatabaseUrl(env);

  if (!databaseUrl) {
    console.error(
      "Missing database connection. Add to .env:\n" +
        "  SUPABASE_DB_PASSWORD=<your-db-password>\n" +
        "Or:\n" +
        "  DATABASE_URL=postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres",
    );
    process.exit(1);
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.error("No migration files found in supabase/migrations/");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  console.log(`\nApplying ${files.length} migrations...\n`);

  await client.connect();

  try {
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      process.stdout.write(`  ${file} ... `);
      await client.query(sql);
      console.log("ok");
    }

    const seedPath = resolve(root, "supabase", "seed.sql");
    if (existsSync(seedPath)) {
      process.stdout.write("  seed.sql ... ");
      await client.query(readFileSync(seedPath, "utf8"));
      console.log("ok");
    }

    console.log("\n✓ Migrations applied successfully.\n");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(`\n✗ Migration failed: ${err.message}\n`);
  process.exit(1);
});
