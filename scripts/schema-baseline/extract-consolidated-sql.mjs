import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const transcriptPath =
  process.env.TRANSCRIPT_PATH ??
  String.raw`C:\Users\maazl\.cursor\projects\e-Projects-HS-Web\agent-transcripts\19f6738e-27e5-4930-a288-0ae32ece2e6d\19f6738e-27e5-4930-a288-0ae32ece2e6d.jsonl`;

const outPath = resolve(__dirname, "../../supabase/baseline/consolidated-erp-extract.sql");

const lines = readFileSync(transcriptPath, "utf8").split("\n");
const row = JSON.parse(lines[26]);
const text = row.message.content.find((c) => c.type === "text")?.text ?? "";

const marker = 'running this query\n"';
const start = text.indexOf(marker);
if (start === -1) {
  console.error("Could not find SQL start marker in transcript line 27");
  process.exit(1);
}

let sql = text.slice(start + marker.length);
if (sql.endsWith('"')) sql = sql.slice(0, -1);

sql = sql
  .replace(/\\n/g, "\n")
  .replace(/\\"/g, '"')
  .replace(/\\t/g, "\t");

writeFileSync(outPath, sql);
console.log(`Wrote ${sql.length} chars to ${outPath}`);
