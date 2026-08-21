#!/usr/bin/env node
/**
 * Dump public schema metadata to JSON for Sprint Baseline diffing.
 *
 * Usage:
 *   node scripts/schema-baseline/dump-schema.mjs live
 *   node scripts/schema-baseline/dump-schema.mjs fresh
 *
 * Writes: supabase/baseline/snapshots/<label>.json
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { withClient } from "./lib/db.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const label = process.argv[2] ?? "live";
const outDir = join(root, "supabase", "baseline", "snapshots");
const outPath = join(outDir, `${label}.json`);

async function dumpSchema(client) {
  const { rows: tables } = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
    order by table_name
  `);

  const { rows: columns } = await client.query(`
    select
      table_name,
      column_name,
      data_type,
      udt_name,
      is_nullable,
      column_default
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position
  `);

  const { rows: indexes } = await client.query(`
    select tablename, indexname, indexdef
    from pg_indexes
    where schemaname = 'public'
    order by tablename, indexname
  `);

  const { rows: policies } = await client.query(`
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
    order by tablename, policyname
  `);

  const { rows: functions } = await client.query(`
    select
      p.proname as name,
      pg_get_function_identity_arguments(p.oid) as args,
      pg_get_functiondef(p.oid) as definition
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
    order by p.proname, args
  `);

  const { rows: enums } = await client.query(`
    select t.typname as enum_name, e.enumlabel
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
    order by t.typname, e.enumsortorder
  `);

  const enumMap = {};
  for (const row of enums) {
    if (!enumMap[row.enum_name]) enumMap[row.enum_name] = [];
    enumMap[row.enum_name].push(row.enumlabel);
  }

  return {
    captured_at: new Date().toISOString(),
    label,
    table_count: tables.length,
    tables: tables.map((r) => r.table_name),
    columns,
    indexes,
    policies,
    functions: functions.map((f) => ({
      name: f.name,
      args: f.args,
      definition: f.definition,
    })),
    enums: enumMap,
  };
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const snapshot = await withClient(dumpSchema);
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2));

  console.log(`\n✓ Schema snapshot written: ${outPath}`);
  console.log(`  Tables: ${snapshot.table_count}`);
  console.log(`  Policies: ${snapshot.policies.length}`);
  console.log(`  Functions: ${snapshot.functions.length}\n`);
}

main().catch((err) => {
  console.error(`\n✗ dump-schema failed: ${err.message}\n`);
  process.exit(1);
});
