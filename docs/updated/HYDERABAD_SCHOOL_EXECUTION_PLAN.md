# Hyderabad School Platform — Execution Plan

You are implementing a sequence of fixes and changes to an existing production Supabase +
TanStack Start school management platform. Read this entire file before making any change.
Work through the phases **strictly in order** — later phases assume earlier ones are complete.
Do not skip ahead, do not reorder, do not batch unrelated phases into one commit.

## Ground rules (apply to every phase)

1. **Never modify an already-applied migration file.** Every schema change is a brand-new file
   in `supabase/migrations/`, named `YYYYMMDDHHMMSS_description.sql`, timestamped after the
   latest existing migration.
2. **Every migration must be idempotent where possible**: use `IF NOT EXISTS`,
   `DROP ... IF EXISTS` before `CREATE`, `ON CONFLICT DO NOTHING/UPDATE`. Assume it may be
   re-run against a database where parts of it already exist.
3. **Do not delete, truncate, or modify any existing data row in any table.** All current rows
   (including anything that looks like test/seed/demo data) must be left exactly as-is. This
   applies to every phase below without exception.
4. **Do not touch, build, or reference** any fee/exam/marks/report-card/transfer-certificate
   functionality beyond what already exists. Those are explicitly out of scope for this plan.
5. **Do not rewrite or restructure the existing schema architecture** (academic_years →
   class_years → sections → enrollments → students; staff_profiles → staff_roles → roles;
   guardians ↔ student_guardians ↔ students). Only add to it as instructed below.
6. At the end of each phase, add a short entry to `PLATFORM_PROGRESS_REPORT.md` under today's
   date summarizing what changed, matching the file's existing style.
7. If a step requires an action outside the codebase (a dashboard setting, an external account,
   content only a human can supply), **stop, do not attempt a workaround, and list it clearly
   in your final summary output** instead of skipping silently.

---

## PHASE 1 — Public website cleanup

1.1. Remove the public `/students` route and its class-materials browsing UI (class list →
     materials → preview/download) from the public-facing site entirely.
1.2. Remove "Students" (or equivalent label) from the public navbar and footer navigation.
1.3. Confirm no other public route/component fetches from `class_materials` with public
     (anon-role) access. Leave the `class_materials` table, its data, and its existing
     staff-facing upload/management functionality completely untouched.
1.4. Confirm faculty stays listed only on `/academics` — do not create a standalone `/faculty`
     public route.
1.5. On the public faculty/leadership listing: confirm the query filters strictly on
     `is_public = true` and excludes any `status != 'ACTIVE'` staff. Fix if it doesn't.
1.6. Search the public site codebase (`Home`, `About`, `Academics`, `Islamic Education`,
     `Contact`, `Admissions` pages/components) for hardcoded placeholder values — fake stats,
     fake phone/email/address, fake leadership names, placeholder dates — and replace each
     with either (a) a clearly-marked empty/TBD state driven from `school_config` if a real
     data field already exists there, or (b) leave a `{/* TODO: needs real content from
     school */}` comment directly above the JSX so it's easy to find later. Do not invent
     placeholder content of your own to replace it with.
1.7. Verify the contact form (`contact_enquiries`) and admissions form (`admission_enquiries`)
     both: validate required fields client-side, insert correctly, are visible in their
     respective admin views, and have RLS restricting SELECT/UPDATE to admin roles only while
     allowing public INSERT.

---

## PHASE 2 — Critical bug fixes (found via live-data audit)

### 2.1 Fix the auto-staff-creation trigger

Locate the trigger function that fires `AFTER INSERT ON auth.users` (currently named
`handle_new_auth_user` or its successor after the staff-consolidation migration) and that
inserts a row into `staff_profiles` for every new auth user unconditionally.

Change its behavior so it **only** creates a `staff_profiles` row when the signup explicitly
carries staff intent — e.g. `raw_user_meta_data->>'account_type' = 'staff'` (or an equivalent
explicit flag your codebase already uses for staff invite flows). If no such flag is present,
the trigger must do nothing (no `staff_profiles` row, no `staff_roles` row).

Write this as a new migration that `CREATE OR REPLACE FUNCTION`s the trigger function with the
corrected logic. Do not drop or recreate the trigger itself unless required.

### 2.2 Fix staff first_name defaulting to email username

In whatever code path currently sets `staff_profiles.first_name` from the email address when no
name is supplied (this has fired at least twice in production), change it so `first_name` is
either left `NULL` (and the UI shows "Name not set" / a clear placeholder) or the signup flow
requires a name before creating the profile. Do not silently default to the email string.

### 2.3 Re-assert the guardian admin-bridge policies

Write a new migration that re-applies (via `DROP POLICY IF EXISTS` then `CREATE POLICY`) the
following two policies, matching their original intended definition:

- `guardians_admin_bridge` on `public.guardians` — `FOR ALL TO authenticated USING
  (public.is_admin()) WITH CHECK (public.is_admin())`
- `student_guardians_admin_bridge` on `public.student_guardians` — same shape

This must be safe to run whether or not these policies already exist live.

### 2.4 Fix the fresh-schema bootstrap file

Locate the file used to bootstrap a brand-new (empty) Supabase database for a new school
(currently referred to as the consolidated/fresh-schema extract — search for a file containing
the comment `Run on a FRESH Supabase database`). Fix it so it is actually runnable end-to-end
on an empty database:

- Remove every `CREATE POLICY` statement in that file that targets a table whose
  `CREATE TABLE` is commented out in the same file (this currently includes policies on
  `faculty_profiles`, `class_materials`, `gallery_images`, `admission_enquiries`, and any
  referencing `public.users`).
- Remove the duplicate definition of `class_materials_faculty_manage` if the legacy
  `class_materials` policies are kept for any reason — otherwise this becomes moot once removed
  per the point above.
- Add `IF NOT EXISTS` to every `CREATE TABLE` statement in this file so it can be safely re-run.
- Keep the file wrapped in a single transaction, but confirm it can now run start-to-finish
  without erroring on a genuinely empty database.

### 2.5 Fix the Principal's own staff profile

Write a migration (or a one-off `UPDATE` documented as a manual step if project convention
prefers data fixes outside migrations — follow whatever pattern existing seed/data-fix files in
this repo already use) that sets a real `first_name`/`last_name` on the `staff_profiles` row
currently showing `first_name = 'maazali53093'`. If you do not have the real name, leave a
clearly marked placeholder and flag it in your summary rather than guessing.

---

## PHASE 3 — Migration truth verification (Rule 6)

3.1. Run `npm run schema:coverage` and record the output.
3.2. Run `npm run schema:dump:live` and record the output.
3.3. Spin up a fresh, empty Supabase database and apply **only** the files in
     `supabase/migrations/` in order — no manual SQL, no seed files.
3.4. Run `npm run schema:dump:fresh` against that fresh database.
3.5. Run `npm run schema:compare` between the live dump and the fresh dump.
3.6. If the diff is not empty, create additional migration files to close every gap found —
     do not edit existing migrations to do this. Repeat 3.3–3.5 until the diff is empty.
3.7. Once clean, add a short note at the top of `PLATFORM_IMPLEMENTATION_PLAN.md` recording the
     date this baseline was verified clean.

---

## PHASE 4 — RLS / security audit

4.1. For every table with RLS enabled, review each policy for: self-referencing recursion,
     helper functions that re-query the same table they protect, missing `WITH CHECK` on
     `INSERT`/`UPDATE` policies, and any policy relying on the pre-consolidation `public.users`
     table (which no longer exists).
4.2. Fix any issues found as new migrations.
4.3. Expand the existing RLS regression test scaffold to cover, at minimum, for the attendance
     tables: allotted teacher (allow), non-allotted teacher (deny), active substitute (allow),
     expired substitute (deny), disabled/inactive staff (deny), Principal/admin override
     (allow). Then replicate the same allow/deny pattern for guardians (own linked children
     only), staff self-profile access, and fee record access by role.

---

## PHASE 5 — Attendance finalization

5.1. Add a server-side check (in the attendance-marking service layer, and ideally reinforced
     as a DB constraint or trigger) that rejects marking attendance for a date that does not
     have a corresponding `calendar_events` entry flagged as a working/school day. Currently
     attendance can be marked for any date with zero calendar entries defined.
5.2. Verify working-day, holiday, special-working-day, exam-day, and school-closure calendar
     event types are all correctly excluded/included in attendance-percentage calculations.
5.3. Confirm historical attendance records keep their original `marked_by` staff attribution
     even after that staff member is later removed from the relevant `attendance_teacher_allotments`
     row — do not add any logic that rewrites historical `marked_by` values.

---

## PHASE 6 — Guardian self-signup flow (new, separate from staff auth)

Build this as a fully separate code path from any staff signup/invite flow — it must never
write to `staff_profiles` or `staff_roles`, and must only run after Phase 2.1 is complete.

6.1. Build a guardian-facing signup page (email + password, using Supabase Auth directly) that,
     on successful signup, creates a `guardians` row (or updates an existing unlinked one
     matched by verified email/phone) with `auth_user_id` set — and nothing else.
6.2. Do not implement phone/SMS OTP signup yet — Supabase phone auth is not configured (see
     separate manual-items list). Build the email+password path now; leave phone OTP as a
     clearly marked follow-up (`// TODO: phone OTP once Supabase phone auth is configured`).
6.3. Keep the existing admin-creates-guardian-and-invites flow intact and working — the two
     paths (self-signup and admin-invite) must both correctly end with a valid
     `guardians.auth_user_id` and no `staff_profiles` row for that user.
6.4. On login, confirm the role-detection logic checks `guardians.auth_user_id` correctly and
     routes to the parent portal, independent of whatever staff-detection logic exists — a user
     with only a `guardians` link and no `staff_profiles` row must never be routed to any staff
     portal.

---

## PHASE 7 — Import Centre idempotency testing

7.1. Using a disposable/test academic year and a sample CSV, run the import twice in a row and
     confirm zero duplicate students, guardians, enrollments, or `student_guardians` links are
     created on the second run.
7.2. Test all four matching branches explicitly: existing student + existing guardian, existing
     student + new guardian, new student + existing guardian, new student + new guardian with
     multiple children sharing one guardian.
7.3. Confirm `import_jobs` and `import_rows` accurately reflect what happened on each run
     (created vs skipped vs matched), and that corresponding `audit_logs` entries exist.

---

## PHASE 8 — Year-end E2E

8.1. Using test/disposable enrollment data, run the promotion wizard end-to-end: promote,
     repeat, and transfer/complete paths, plus a non-trivial section remap (e.g. 5-A → 6-B,
     5-B → 6-A simultaneously).
8.2. Confirm in every case the permanent `student_number` (HS-YYYY-NNNNN) never changes and no
     new `students` row is created — only new `enrollments` rows.
8.3. Confirm closing an academic year is transactional — either the whole batch succeeds or
     none of it applies.

---

## PHASE 9 — Financial correction-safety

9.1. Audit every code path that can modify a `fee_payments` row after creation. Confirm none of
     them allow silently overwriting the `amount` or `status` of an existing payment.
9.2. Where a correction is needed, confirm the pattern is: original row stays untouched, a new
     cancellation/adjustment row is created referencing it, and the ledger view reflects the net
     effect — not an in-place edit. Fix any code path that does an in-place edit instead.

---

## PHASE 10 — Principal operational view

10.1. On the existing Leadership Console / Principal dashboard, add a lightweight "Today"
      section showing: today's present/absent counts, new admissions enquiries pending review,
      any fee items needing attention, and any pending role/access requests. Keep this to a
      handful of operational cards — do not build a large analytics/charting dashboard.

---

## PHASE 11 — Documentation cleanup

11.1. Add a clear `> HISTORICAL — DO NOT USE FOR IMPLEMENTATION` banner to the top of the June
      website blueprint document and the June audit report (whichever files in the repo match
      this description).
11.2. Confirm `SCHOOL_MANAGEMENT_PLATFORM` (architecture), `PLATFORM_IMPLEMENTATION_PLAN.md`
      (roadmap), and `PLATFORM_PROGRESS_REPORT.md` (implementation truth) are the only files
      referenced as current in any README or onboarding doc.

---

## PHASE 12 — Subject Master

12.1. Create a new `subjects` table (id, name, code, active, display_order, timestamps) via
      migration.
12.2. Do not yet wire it into `class_materials` or anywhere else — this phase only creates the
      table and a basic admin CRUD screen for it, as groundwork for the future Timetable and
      Examinations modules (which are out of scope for this plan).

---

## PHASE 13 — Multi-school scaling groundwork

13.1. Write a small CLI/script (e.g. `scripts/migrate-tenant.ts` or similar, matching this
      repo's existing tooling conventions) that takes a target Postgres schema name and applies
      every file in `supabase/migrations/` against that schema in order, tracking which have
      already been applied (a simple `_migrations_applied` tracking table per schema is
      sufficient). This replaces manually copying SQL per school.
13.2. Refactor the frontend's Supabase client initialization so the active schema is resolved
      at request/session time from a single source (e.g. subdomain or a school-selection step
      at login) rather than assuming a hardcoded `public` schema everywhere. Keep this as a
      single deployment — do not create per-school build configs or duplicate the app.
13.3. Document (in `PLATFORM_IMPLEMENTATION_PLAN.md`) the exact repeatable checklist a human
      must follow to onboard a new school schema (this phase produces the checklist; it does
      not execute it against any real new school).

---

## Final output required

After completing all phases (or stopping at one that requires a manual/external action), output
a summary listing: every migration file created, every existing file modified, every phase
fully completed, and every phase blocked with the specific reason.
