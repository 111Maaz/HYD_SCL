#!/usr/bin/env node
/**
 * Static analysis: which expected tables are created by repo migrations?
 * Proves ERP foundation gap when erp_core tables have no CREATE TABLE in migrations/.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const migrationsDir = join(root, "supabase", "migrations");
const expectedPath = join(root, "supabase", "baseline", "expected-tables.json");

const expected = JSON.parse(readFileSync(expectedPath, "utf8"));
const allExpected = Object.entries(expected)
  .filter(([group]) => group !== "legacy_dropped")
  .flatMap(([, tables]) => tables);

const createPattern = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/gi;

const createdBy = new Map();

for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  for (const match of sql.matchAll(createPattern)) {
    const table = match[1].toLowerCase();
    if (!createdBy.has(table)) {
      createdBy.set(table, file);
    }
  }
}

const missing = [];
const covered = [];

for (const table of allExpected.sort()) {
  const migration = createdBy.get(table);
  if (migration) {
    covered.push({ table, migration });
  } else {
    missing.push(table);
  }
}

console.log("\n=== Migration coverage (CREATE TABLE in supabase/migrations/) ===\n");
console.log(`Covered: ${covered.length}/${allExpected.length}`);
for (const row of covered) {
  console.log(`  ✓ ${row.table.padEnd(32)} ← ${row.migration}`);
}

console.log(`\nNOT created by any migration: ${missing.length}`);
for (const table of missing) {
  console.log(`  ✗ ${table}`);
}

if (missing.length > 0) {
  console.log(
    "\n⚠ ERP foundation tables are missing from migrations.\n" +
      "  Live Supabase was shaped by manually applied consolidated SQL.\n" +
      "  Sprint Baseline: dump live schema → capture as 20260701000000_erp_foundation.sql → diff until empty.\n" +
      "  See supabase/baseline/README.md\n",
  );
  process.exitCode = 1;
} else {
  console.log("\n✓ All expected tables have a CREATE TABLE in migrations.\n");
}
