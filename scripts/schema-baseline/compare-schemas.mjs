#!/usr/bin/env node
/**
 * Compare two schema snapshots from dump-schema.mjs.
 *
 * Usage:
 *   node scripts/schema-baseline/compare-schemas.mjs live fresh
 *
 * Exit code 1 if differences exist.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const snapDir = join(root, "supabase", "baseline", "snapshots");

const leftLabel = process.argv[2] ?? "live";
const rightLabel = process.argv[3] ?? "fresh";

function load(label) {
  const path = join(snapDir, `${label}.json`);
  if (!existsSync(path)) {
    throw new Error(`Missing snapshot: ${path}\nRun: node scripts/schema-baseline/dump-schema.mjs ${label}`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function columnKey(c) {
  return `${c.table_name}.${c.column_name}|${c.data_type}|${c.is_nullable}|${c.column_default ?? ""}`;
}

function diffSets(leftArr, rightArr) {
  const onlyLeft = leftArr.filter((x) => !rightArr.includes(x));
  const onlyRight = rightArr.filter((x) => !leftArr.includes(x));
  return { onlyLeft, onlyRight };
}

function main() {
  const left = load(leftLabel);
  const right = load(rightLabel);

  console.log(`\n=== Schema diff: ${leftLabel} vs ${rightLabel} ===\n`);
  console.log(`  ${leftLabel}: ${left.table_count} tables (${left.captured_at})`);
  console.log(`  ${rightLabel}: ${right.table_count} tables (${right.captured_at})\n`);

  const tableDiff = diffSets(left.tables, right.tables);
  if (tableDiff.onlyLeft.length) {
    console.log(`Tables only in ${leftLabel} (${tableDiff.onlyLeft.length}):`);
    for (const t of tableDiff.onlyLeft) console.log(`  + ${t}`);
  }
  if (tableDiff.onlyRight.length) {
    console.log(`Tables only in ${rightLabel} (${tableDiff.onlyRight.length}):`);
    for (const t of tableDiff.onlyRight) console.log(`  + ${t}`);
  }

  const leftCols = new Set(left.columns.map(columnKey));
  const rightCols = new Set(right.columns.map(columnKey));
  const colOnlyLeft = [...leftCols].filter((c) => !rightCols.has(c));
  const colOnlyRight = [...rightCols].filter((c) => !leftCols.has(c));

  if (colOnlyLeft.length) {
    console.log(`\nColumns only in ${leftLabel} (${colOnlyLeft.length}, showing first 20):`);
    for (const c of colOnlyLeft.slice(0, 20)) console.log(`  + ${c.split("|")[0]}`);
    if (colOnlyLeft.length > 20) console.log(`  ... and ${colOnlyLeft.length - 20} more`);
  }
  if (colOnlyRight.length) {
    console.log(`\nColumns only in ${rightLabel} (${colOnlyRight.length}, showing first 20):`);
    for (const c of colOnlyRight.slice(0, 20)) console.log(`  + ${c.split("|")[0]}`);
    if (colOnlyRight.length > 20) console.log(`  ... and ${colOnlyRight.length - 20} more`);
  }

  const leftPolicies = left.policies.map((p) => `${p.tablename}.${p.policyname}`);
  const rightPolicies = right.policies.map((p) => `${p.tablename}.${p.policyname}`);
  const policyDiff = diffSets(leftPolicies, rightPolicies);
  if (policyDiff.onlyLeft.length || policyDiff.onlyRight.length) {
    console.log(`\nPolicy differences: ${policyDiff.onlyLeft.length} only ${leftLabel}, ${policyDiff.onlyRight.length} only ${rightLabel}`);
  }

  const leftFns = left.functions.map((f) => `${f.name}(${f.args})`);
  const rightFns = right.functions.map((f) => `${f.name}(${f.args})`);
  const fnDiff = diffSets(leftFns, rightFns);
  if (fnDiff.onlyLeft.length || fnDiff.onlyRight.length) {
    console.log(`\nFunction differences: ${fnDiff.onlyLeft.length} only ${leftLabel}, ${fnDiff.onlyRight.length} only ${rightLabel}`);
  }

  const hasDiff =
    tableDiff.onlyLeft.length +
      tableDiff.onlyRight.length +
      colOnlyLeft.length +
      colOnlyRight.length +
      policyDiff.onlyLeft.length +
      policyDiff.onlyRight.length +
      fnDiff.onlyLeft.length +
      fnDiff.onlyRight.length >
    0;

  if (hasDiff) {
    console.log(
      "\n⚠ Schemas differ. Turn deltas into baseline migration(s) until this diff is empty.\n" +
        "  See supabase/baseline/README.md\n",
    );
    process.exit(1);
  }

  console.log("\n✓ Snapshots match — Rule 6 verified for these two databases.\n");
}

try {
  main();
} catch (err) {
  console.error(`\n✗ compare-schemas failed: ${err.message}\n`);
  process.exit(1);
}
