# Sprint Baseline — Migration / Schema Truth

> **Goal:** Prove master doc Rule 6 — *migrations folder alone recreates the same database as live Hyderabad School Supabase.*

## Current finding (static analysis)

Run:

```bash
npm run schema:coverage
```

**Result:** ERP core tables (`academic_years`, `students`, `staff_profiles`, `guardians`, fees, attendance, …) are **not** created by any file in `supabase/migrations/`. They came from a **manually applied consolidated ERP SQL script** that is **not versioned in this repo**.

Repo migrations only `CREATE TABLE` for:

- CMS: `admission_enquiries`, `faculty_members`, `gallery_images`, `class_materials`, `users`, `faculty_profiles`, `contact_enquiries`
- Allotments: `attendance_teacher_allotments`, `secondary_teacher_allotments`
- Import: `import_jobs`, `import_rows`

This already caused production friction (`import_rows` column mismatch).

---

## Workflow (≈1 day)

### Step 1 — Snapshot live Supabase

Requires `.env` with `SUPABASE_DB_PASSWORD` + `VITE_SUPABASE_URL` (or `DATABASE_URL`).

```bash
npm run schema:dump:live
```

Writes `supabase/baseline/snapshots/live.json`.

Alternative (Supabase CLI, schema-only SQL):

```bash
supabase db dump --schema-only -f supabase/baseline/snapshots/live.sql
```

### Step 2 — Capture ERP foundation as a migration

**Option A (preferred if you still have the consolidated script):**

1. Save it as `supabase/migrations/20260701000000_erp_foundation.sql` (timestamp before `202608200…` migrations).
2. Ensure it runs cleanly on a fresh database before CMS migrations that depend on ERP, **or** reorder so ERP baseline runs first, then CMS, then `202608200+` patches.

**Option B (if consolidated script is lost):**

1. Use live schema dump (`live.sql` from CLI) as the baseline migration body.
2. Strip data-only statements; keep extensions, enums, tables, indexes, functions, policies.
3. Name it `20260701000000_erp_foundation_from_live_dump.sql`.

**Operational rule:** Never edit live Supabase by hand again without a matching migration file the same day.

### Step 3 — Fresh database from migrations only

On a **new** Supabase project or local `supabase start`:

```bash
npm run supabase:migrate
```

Or apply migrations in order via SQL editor on empty `public` schema.

Then snapshot:

```bash
npm run schema:dump:fresh
```

### Step 4 — Diff until empty

```bash
npm run schema:compare
```

Fix deltas by adding/adjusting migrations until compare exits 0.

**Done when:** `live.json` ≡ `fresh.json` (tables, columns, policies, functions).

---

## Files in this folder

| File | Purpose |
|------|---------|
| `expected-tables.json` | Tables the app expects, grouped by domain |
| `snapshots/live.json` | Live Supabase snapshot (gitignore recommended) |
| `snapshots/fresh.json` | Migrations-only snapshot |
| `README.md` | This workflow |

---

## After Baseline is green

1. Land RLS security tests (`npm run test:security:attendance`)
2. Sprint O — Import Centre v2
3. Sprint P — Teacher attendance RLS
4. Re-run `schema:compare` after each migration

---

*Update this README when baseline migration is captured and Rule 6 diff is empty.*
