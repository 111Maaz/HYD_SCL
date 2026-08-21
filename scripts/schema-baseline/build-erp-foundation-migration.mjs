import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const source = resolve(root, "supabase/baseline/consolidated-erp-extract.sql");
const out = resolve(root, "supabase/migrations/20260701000000_erp_foundation.sql");

const lines = readFileSync(source, "utf8").split("\n");

function lineIndex(prefix) {
  const idx = lines.findIndex((l) => l.includes(prefix));
  if (idx === -1) throw new Error(`Marker not found: ${prefix}`);
  return idx;
}

const importStart = lineIndex("-- 22. DATA MIGRATION / IMPORT JOBS");
const importEnd = lineIndex("-- 23. AUDIT LOG");
const legacyRlsStart = lineIndex("-- 38. WEBSITE / LEGACY RLS");
const indexesStart = lineIndex("-- 39. INDEXES");
const finalStart = lineIndex("-- 43. FINAL");

const header = `-- ERP foundation captured from consolidated platform SQL (master doc v3.0).
-- Versioned for Rule 6 — migrations-only replay.
-- Excludes: import_jobs/import_rows (app schema in 202608208), legacy CMS RLS (sprint 5–9 + 202608200+).
-- Run after CMS migrations 20260615000000–20260616100000, before 20260820000000.

begin;

`;

const chunks = [
  ...lines.slice(24, importStart),
  ...lines.slice(importEnd, legacyRlsStart),
  ...lines.slice(indexesStart, finalStart),
];

let body = chunks.join("\n").trim();
body = body.replace(/^begin;\s*\n/m, "");

writeFileSync(out, `${header}${body}\n\ncommit;\n`);
console.log(`Wrote ${header.length + body.length} chars → ${out}`);
