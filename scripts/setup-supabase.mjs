#!/usr/bin/env node
/**
 * Configure .env and create dev admin/faculty accounts in Supabase.
 *
 * Usage:
 *   npm run supabase:seed
 *   node scripts/setup-supabase.mjs --url https://xxx.supabase.co --anon eyJ... --service eyJ...
 *
 * Prerequisites:
 *   1. Create a project at https://supabase.com/dashboard
 *   2. Apply migrations: npm run supabase:push  (after npm run supabase:link)
 *      — or paste supabase/migrations/*.sql into the SQL Editor (in order)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env");

const DEFAULT_ACCOUNTS = [
  {
    email: "admin@hyderabadschool.test",
    password: "Admin123!",
    role: "admin",
    label: "Admin",
  },
  {
    email: "faculty@hyderabadschool.test",
    password: "Faculty123!",
    role: "faculty",
    label: "Faculty",
  },
];

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key === "--url") args.url = next, i++;
    else if (key === "--anon") args.anon = next, i++;
    else if (key === "--service") args.service = next, i++;
    else if (key === "--help" || key === "-h") args.help = true;
  }
  return args;
}

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

function writeEnvFile(vars) {
  const content = `# Supabase — generated/updated by npm run supabase:seed
# Dashboard: https://supabase.com/dashboard

VITE_SUPABASE_URL=${vars.VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${vars.VITE_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${vars.SUPABASE_SERVICE_ROLE_KEY}
`;
  writeFileSync(envPath, content, "utf8");
}

function printHelp() {
  console.log(`
Supabase setup for HS_Web admin login

Steps:
  1. Create a free project at https://supabase.com/dashboard
  2. Copy API keys from Settings → API
  3. Link & push schema:
       npx supabase login
       npx supabase link --project-ref <your-project-ref>
       npm run supabase:push
  4. Seed accounts & write .env:
       npm run supabase:seed

Or pass keys directly:
  node scripts/setup-supabase.mjs \\
    --url https://<ref>.supabase.co \\
    --anon <anon-key> \\
    --service <service-role-key>

Dev login credentials (after seed):
  Admin:   admin@hyderabadschool.test / Admin123!
  Faculty: faculty@hyderabadschool.test / Faculty123!

Then restart the dev server and open /admin/login
`);
}

async function ensureUser(supabase, { email, password, role, label }) {
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const existing = listData.users.find((u) => u.email === email);

  if (existing) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { role },
      app_metadata: { account_type: "staff" },
      email_confirm: true,
    });

    if (updateError) {
      throw new Error(`Failed to update ${label} user: ${updateError.message}`);
    }

    console.log(`  ✓ ${label} account updated: ${email}`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
    app_metadata: { account_type: "staff" },
  });

  if (error) {
    throw new Error(`Failed to create ${label} user: ${error.message}`);
  }

  console.log(`  ✓ ${label} account created: ${email}`);
  return data.user.id;
}

async function ensureFacultyProfile(supabase, userId) {
  const { data: existing } = await supabase
    .from("faculty_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    console.log("  ✓ Faculty profile already exists");
    return;
  }

  const { error } = await supabase.from("faculty_profiles").insert({
    user_id: userId,
    name: "Demo Faculty",
    role: "Class Teacher",
    bio: "Demo faculty account for local development.",
    assigned_class: 5,
  });

  if (error) {
    throw new Error(`Failed to create faculty profile: ${error.message}`);
  }

  console.log("  ✓ Faculty profile created (Class 5)");
}

async function verifyUsersTable(supabase) {
  const { error } = await supabase.from("users").select("id").limit(1);
  if (error?.message?.includes("does not exist") || error?.code === "42P01") {
    throw new Error(
      "public.users table not found. Run migrations first:\n" +
        "  npm run supabase:push\n" +
        "  — or apply SQL files in supabase/migrations/ via the Supabase SQL Editor",
    );
  }
  if (error) {
    throw new Error(`Database check failed: ${error.message}`);
  }
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    return;
  }

  const fileEnv = loadEnvFile();

  const url = args.url ?? fileEnv.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anon = args.anon ?? fileEnv.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const service =
    args.service ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url?.trim() || !anon?.trim() || !service?.trim()) {
    console.error("Missing Supabase credentials.\n");
    printHelp();
    process.exit(1);
  }

  console.log("\nHS_Web Supabase setup\n");

  writeEnvFile({
    VITE_SUPABASE_URL: url.trim(),
    VITE_SUPABASE_ANON_KEY: anon.trim(),
    SUPABASE_SERVICE_ROLE_KEY: service.trim(),
  });
  console.log(`✓ Wrote ${envPath}\n`);

  const supabase = createClient(url.trim(), service.trim(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Checking database schema...");
  await verifyUsersTable(supabase);
  console.log("✓ Schema looks good\n");

  console.log("Creating dev accounts...");
  await ensureUser(supabase, DEFAULT_ACCOUNTS[0]);
  const facultyUserId = await ensureUser(supabase, DEFAULT_ACCOUNTS[1]);
  await ensureFacultyProfile(supabase, facultyUserId);

  // Trigger may have created public.users rows; verify admin profile
  const { data: adminRow } = await supabase
    .from("users")
    .select("email, role")
    .eq("email", DEFAULT_ACCOUNTS[0].email)
    .maybeSingle();

  if (!adminRow) {
    console.warn(
      "\n⚠ public.users row missing for admin — the auth trigger may not have run.",
    );
    console.warn("  Re-run migrations (sprint9) or insert manually in SQL Editor.");
  } else {
    console.log(`\n✓ Admin profile in database: ${adminRow.email} (${adminRow.role})`);
  }

  console.log(`
Done! Next steps:
  1. Restart the dev server (npm run dev)
  2. Open http://localhost:5173/admin/login
  3. Sign in as Admin:
       ${DEFAULT_ACCOUNTS[0].email}
       ${DEFAULT_ACCOUNTS[0].password}
`);
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}\n`);
  process.exit(1);
});
