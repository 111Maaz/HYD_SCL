# Hyderabad School — Platform Progress Report

**Purpose:** Single honest status document for reviewers, mentors, and AI context.  
**Last updated:** 21 August 2026 (rev. 2 — incorporates follow-up mentor review)  
**Stack:** TanStack Start · React 19 · TypeScript · Supabase · Tailwind v4  

**Prepared in response to review of:**
- `public/SCHOOL MANAGEMENT PLATFORM.docx` (master architecture, v3.0)
- `docs/PLATFORM_IMPLEMENTATION_PLAN.md` (forward roadmap)
- `AUDIT_REPORT.md` (June 2026 snapshot — **historical**)
- `public/WEBSITE_BLUEPRINT_REPORT.md` (June 2026 snapshot — **historical**)

---

## Executive summary

We agree with both mentors on the core judgment: **the v3.0 architecture is sound and should not be rewritten.** The student/enrollment split, guardian model, Forms→CSV→Import Centre intake, role/permission/scope separation, and “ERP is source of truth” rules are correct and already reflected in the live codebase.

**Rough completion vs master document:** ~35–40% of full platform scope (foundation + core ERP ops + role portals). The **ERP foundation is strong**; several roadmap items marked ✅ in the plan doc are **partial**, not complete.

**Most urgent risks (already materializing):**
1. **Migration/schema truth gap (Rule 6 not yet verified)** — live Supabase was partially shaped by a manually applied consolidated ERP script that predates captured repo migrations. We do not yet know if migrations-only replay produces the same schema as production. This blocks Phase 8 productization assumptions and already caused `import_rows` drift.
2. **RLS coverage gaps** — teacher attendance writes are UI-scoped but not DB-enforced for allotted sections only.
3. **No automated RLS regression tests** — security boundaries are validated manually only; two recursion incidents already shipped under manual testing.

**Operational truth:** This document is the current status source going forward (confirmed by Mentor 2).

---

## Document hierarchy (what to trust)

| Document | Role | Trust level |
|----------|------|-------------|
| `public/SCHOOL MANAGEMENT PLATFORM.docx` | Architecture north star | ✅ Authoritative for design intent |
| `docs/PLATFORM_IMPLEMENTATION_PLAN.md` | Forward roadmap & sprint order | ✅ Use for *what to build next* — but checkmarks are optimistic |
| **`docs/PLATFORM_PROGRESS_REPORT.md` (this file)** | Live status & honest gaps | ✅ Use for *what is actually done* |
| `AUDIT_REPORT.md` | CMS-era audit (Sprints 0–10) | ⚠️ **Historical — do not use for AI prompts or implementation** |
| `public/WEBSITE_BLUEPRINT_REPORT.md` | Pre-ERP website blueprint | ⚠️ **Historical — references dropped `users` / `faculty_profiles` tables** |
| `public/sql/*.txt`, `supabase/full-setup.sql` | Old schema snapshots | ⚠️ **Stale — do not treat as live Supabase state** |

**Action agreed:** Retire or clearly archive `AUDIT_REPORT.md` and `WEBSITE_BLUEPRINT_REPORT.md` for builder context. Keep one live plan + one live progress doc + master architecture doc.

---

## Response to Mentor 1 (discipline & maintenance gaps)

| Finding | Our assessment | Status / action |
|---------|----------------|-----------------|
| **Doc drift between blueprint, audit, and plan** | Correct. Blueprint still documents `users`, `faculty_profiles`, and old RLS. Plan says legacy tables dropped. | **Confirmed.** Already caused `202608208` migration failure when consolidated ERP schema had `import_rows` with different columns than repo migration expected. Fix migration updated to drop/recreate import tables. |
| **RLS recursion fix only half-applied** | Correct in principle. We fixed `staff_profiles` directory policy via `is_active_staff()` SECURITY DEFINER helper. Parent portal uses `current_guardian_id()` / `guardian_can_view_student()`. | **Partial.** Not every policy across every table uses a shared helper pattern yet. Need audit pass so new policies don’t reintroduce recursion. JWT custom claims noted for future scale — not needed now. |
| **Subjects hardcoded in TypeScript** | Partially stale. Blueprint §18 described a fixed subject list. **Current material upload UI uses free-text subject fields**, not a hardcoded dropdown. | **Real gap remains:** no **subject master table** in DB for exams/timetable/multi-school. Cheap to add before examinations module. |
| **No automated regression tests** | Correct. No `tests/` directory exists. Plan says “test RLS manually after each phase.” | **Accepted.** Land **≥5 attendance RLS checks before Sprint P** (not parallel). Expand to 15–20 after P ships. |

**Additional issue (elevated to Sprint Baseline — see below):** A large **consolidated ERP SQL script** was applied manually on Supabase before all changes were captured in versioned repo migrations. This is the deepest drift source — worse than blueprint alone. **Not “noted and deferred” — must be verified and closed with a schema diff before we treat migrations as reproducible.**

**Follow-up from Mentor 1 (accepted):**
- Land a **minimal attendance RLS test suite (≥5 checks) before Sprint P**, not in parallel — we are writing new policies in an area that already caused two recursion bugs.
- Sprint P must check **both** `attendance_teacher_allotments` and `secondary_teacher_allotments`, respect **secondary cover time bounds**, and preserve **historical attribution** when a teacher is removed from an allotment (master doc Rule 15).

---

## Response to Mentor 2 (ERP comparison & roadmap)

| Finding | Our assessment | Status / action |
|---------|----------------|-----------------|
| **Student vs enrollment split is correct** | Fully agree. Implemented. | ✅ `students` permanent ID (`HS-YYYY-NNNNN`); `enrollments` per academic year/class/section/roll. |
| **Staff = person, roles = capabilities, assignments = responsibilities** | Agree. Already direction of travel. | ✅ `staff_profiles` + `staff_roles` (RBAC). Legacy `users` / `faculty_members` / `faculty_profiles` consolidated. Public directory now reads `staff_profiles`. Dual role supported (e.g. Teacher + Incharge). |
| **Don’t keep `assigned_class` as long-term teacher model** | Agree. | ⚠️ **Transitional.** `assigned_class` still used for class-material uploads and legacy faculty paths. New **`attendance_teacher_allotments`** and **`secondary_teacher_allotments`** exist. Long-term model should be year/class/section/subject assignments (timetable-driven). |
| **Attendance RLS is mandatory, not polish** | Fully agree. | ❌ **Not done.** `attendance_records` policies still use broad `is_admin()`. Teachers can open allotted sections in UI; DB does not yet enforce write scope. **Sprint P = security boundary.** |
| **Import Centre should be idempotent** | Agree. | ⚠️ Tables exist (`import_jobs`, `import_rows`); v1 commit creates student+guardian+link only. No dedupe, no match-by-student-ID, no enrollment on commit, no idempotent re-upload. **Sprint O.** |
| **Fee ledger should be correction-safe** | Agree in principle. | ⚠️ Payments use insert + **soft cancel** (`cancelled`, reason, actor) — better than editing amounts. No full adjustment/refund transaction model yet. Harden before real money volume. |
| **Exams + report cards missing** | Correct — biggest academic gap after current sprints. | ❌ Not started. Planned as major module after O–R. |
| **Timetable missing** | Correct — connects teacher, section, subject, attendance, substitutes. | ❌ Not started. After examinations foundation or in parallel once subject master exists. |
| **Communication / notification centre** | Valuable; avoid scattered WhatsApp calls per module. | ❌ Not started. After parent portal v2 stabilizes. |
| **Student documents, formal TC/transfer workflow** | Valid operational gaps. | ❌ Year-end has basic promote/repeat/complete; no TC workflow, financial clearance, or document vault. |
| **Principal dashboard = operational, not 40 charts** | Agree. | ⚠️ Current Principal/VP home is **`LeadershipConsole`** (staff grants, VP/incharge management). ERP metrics dashboard code exists but is **not** the default home. **Planned blend:** leadership console + “today” operational cards (present/absent, fees, admissions). |
| **“My Work” role homes** | Agree. | ✅ **Partially built:** `TeacherHome`, incharge-scoped nav hubs, account centre, attendance allotment UI. Needs timetable/tasks layer later. |
| **Role-aware nav > giant admin sidebar** | Agree — keep this. | ✅ Implemented via `src/lib/admin-access.ts` (`ROLE_PORTAL_NAV` + path guards). App nav is role-scoped; DB still largely `is_admin()` rather than full `user_has_permission()` per feature. |
| **Public class_materials vs authenticated learning resources** | Valid future split. | ⚠️ `class_materials` still has **public read** RLS for `/students` website page. Fine for marketing phase; separate authenticated resources before LMS-style use. |
| **Keep service-role narrow** | Agree. | ✅ Service role used for auth user provisioning (`faculty-accounts.server.ts`). Normal CRUD goes through Supabase client + RLS. |
| **Priority: O → P → Q → R, then exams → timetable → comms** | Agree. | Adopted — with **Baseline + RLS tests before P** (see sequence below). |
| **Architecture Guardrails for AI/builders** | Agree — prevents future drift. | ✅ Added as dedicated section below (Mentor 2). |

**Follow-up from Mentor 2 (accepted):** Treat this report as operational truth. Add guardrails for Cursor/AI agents. Do not add more architecture work before O→P→Q→R. Reassess architecture before Exams/Timetable.

---

## Architecture Guardrails

> For all human and AI builders (Cursor, etc.). Prevents the drift that caused the `import_rows` incident and doc/schema divergence.

1. **Student ID is permanent** — never recreate students during promotion or year-end; update enrollments only.
2. **Enrollment is the academic-year relationship** — roll number is not identity.
3. **Staff identity is `staff_profiles`** — roles are capabilities; assignments (allotments, timetable) define scope.
4. **Postgres RLS is authoritative** — never rely on UI-only authorization for sensitive operations.
5. **Service-role is narrow** — only for genuinely privileged server operations (e.g. auth user creation).
6. **Parents/guardians never create or discover student records** — school links first; parents see linked children only.
7. **ERP tables are source of truth** — CMS/public content must not duplicate operational data.
8. **Imports must be idempotent and auditable** — re-upload must not duplicate entities; log in `import_jobs` / `import_rows`.
9. **Financial history is correction-safe** — do not silently mutate completed transactions; use cancel/adjustment patterns.
10. **New modules reuse canonical entities** — academic year, class, section, student, staff; no parallel identity tables.
11. **Do not introduce a new table when an existing canonical entity already represents the concept.**
12. **Ship features as a unit** — schema/migration + types + RLS + tests together before calling a sprint done.

**Operational rule (13):** **Never manually modify Supabase schema without immediately capturing the change in a versioned migration.** Manual consolidated SQL is the root cause of our deepest drift.

**Rule 6 verification (master doc):** Migrations folder must recreate the same database structure. Until a fresh migrations-only schema dump matches live Supabase, Rule 6 is **assumed, not proven**.

---

## What is actually built (August 2026)

### Public website
- 8 public routes (home, about, academics, admissions, gallery, students/materials, contact, islamic-education)
- Admissions enquiry form → `admission_enquiries`
- Contact form → `contact_enquiries` (Sprint D — **wired**, contrary to stale audit)
- Public faculty directory from `staff_profiles` (not legacy `faculty_members`)

### ERP admin (full shell — Principal path)
| Module | Route | Status |
|--------|-------|--------|
| Academic years | `/admin/academic-years` | ✅ Complete |
| Class years + sections | `/admin/academic-structure` | ✅ Complete |
| Students + enrollments | `/admin/students` | ✅ Complete |
| Calendar | `/admin/calendar` | ✅ Complete |
| Attendance (admin mark) | `/admin/attendance` | ✅ Admin side; incharge route shows **allotment UI** instead |
| Fees (structures, charges, payments, ledger) | `/admin/fees` | ✅ Complete |
| Guardians + student links + parent invite | `/admin/guardians` | ✅ Complete |
| Admissions leads + conversion | `/admin/admissions` | ✅ Complete |
| Audit centre | `/admin/audit` | ✅ Read-only |
| Import Centre v1 | `/admin/import` | ⚠️ ADMISSIONS CSV only |
| Year-end wizard v1 | `/admin/year-end` | ⚠️ Basic promote/repeat/complete |
| CMS (gallery, class materials, public faculty) | various | ✅ Legacy CMS retained |

### Role portals (Sprint L + M)
| Role | Home | Notes |
|------|------|-------|
| Principal / VP | `LeadershipConsole` | Grant/revoke incharges, assign VP, link to staff accounts |
| Attendance Incharge | Attendance allotment | Class → section → assign teacher |
| Academic Incharge | Academic structure hub | Students, guardians, year-end |
| Fees Incharge | Fees hub | |
| Operations Incharge | Calendar / gallery / contact hub | |
| Teacher | `/faculty/portal/home` | Allotted classes, secondary cover, link to attendance |
| Teacher + Incharge (dual) | Admin portal with effective incharge nav | Implemented in auth + routing |

### Staff & auth
- Role-aware login at `/admin/login` (no manual role radio)
- Staff accounts: `/admin/faculty-accounts` — create/edit staff, roles, optional class, dual incharge for teachers
- Account centre: profile, photo (`staff-photos` bucket), password change — staff admin + faculty portal
- Seed scripts: VP, incharges, 10 teachers (`supabase/scripts/`)

### Parent portal
- Login + `/parent/children` list
- `/parent/children/$studentId` — attendance list + fee summary
- Parent read RLS via `guardian_can_view_student()` helpers

---

## Honest sprint ledger

| Sprint | Scope | Honest status |
|--------|-------|---------------|
| A | Academic years | ✅ Complete |
| B | Class years + sections | ✅ Complete |
| C | Students + enrollments | ✅ Complete |
| D | Contact form + admission conversion | ✅ Complete |
| E | Calendar + attendance admin | ✅ Complete |
| F | Fees module | ✅ Complete |
| G | Principal dashboard + audit | ⚠️ Audit ✅; dashboard replaced by leadership console (metrics de-emphasized) |
| H | Role-aware login + staff roles | ✅ Complete |
| I | Guardians + parent invite | ✅ Complete |
| J | Parent child detail views | ⚠️ Attendance + fee totals only; no receipts list, enrollment detail, parent account centre |
| K | Import Centre | ⚠️ v1 only — admissions CSV, no dedupe/idempotency/enrollment/GUARDIAN_LINK mode |
| L | Role portals + allotments + account centre | ✅ Mostly complete; attendance teacher RLS pending |
| M | Incharge scoped nav hubs | ✅ Complete |
| N | Year-end wizard | ⚠️ Basic — no next class/section mapping, no formal TC workflow |
| **Baseline** | Migration/schema truth verification | ✅ **ERP foundation captured** — `20260701000000_erp_foundation.sql` (run `schema:compare` on live vs fresh when ready) |
| **RLS-Tests** | Minimal attendance security tests (≥5) | ✅ Scaffold — `npm run test:security:attendance` |
| **O** | Import Centre v2 | ✅ Guardian dedupe, GUARDIAN_LINK, enrollment, idempotent skip |
| **P** | Teacher attendance RLS | ✅ `20260820900000_teacher_attendance_rls.sql` |
| **Q** | Year-end v2 | ✅ Next-class promotion + close year option |
| **R** | Parent portal v2 | ✅ Enrollment, payments list, parent account centre |

---

## Incidents & active technical debt

| Issue | What happened | Resolution |
|-------|---------------|------------|
| RLS infinite recursion on `staff_profiles` | Policy queried same table inside itself | Fixed in `20260820700000_fix_staff_profiles_directory_rls.sql` (`is_active_staff()`) |
| Principal/VP login failure | Same recursion class of bug | Same migration |
| Login page “didn’t load” | Auth probe used fragile session read | Switched to `getUser()` in auth state |
| `import_rows` migration failure | Consolidated ERP had existing table without `job_id` column; `CREATE TABLE IF NOT EXISTS` skipped | Migration `208` updated to drop/recreate import tables |
| `staff_role_dates_valid` on seed | `ends_at` must be strictly after `starts_at` | Fixed in seed scripts + server deactivation logic |

---

## Migrations checklist (Supabase)

Apply in order after consolidated ERP baseline. **Verify each on hosted Supabase:**

| Migration | Purpose |
|-----------|---------|
| `20260820000000_fix_users_rls_recursion.sql` | RLS recursion helpers |
| `20260820100000_consolidate_staff_schema.sql` | `staff_profiles` consolidation |
| `20260820200000_contact_enquiries.sql` | Contact table |
| `20260820300000_contact_enquiries_and_erp_admin_bridge.sql` | ERP admin RLS bridge |
| `20260820400000_expand_app_roles_for_staff.sql` | VP/incharge in `is_admin()` |
| `20260820500000_guardians_admin_bridge.sql` | Guardians admin |
| `20260820600000_role_portal_allotments.sql` | Attendance/secondary allotments, staff photos |
| `20260820700000_fix_staff_profiles_directory_rls.sql` | Directory RLS fix |
| `20260820800000_parent_portal_and_import.sql` | Parent RLS + import tables (**use updated version with drop/recreate**) |

Optional seeds: `seed-vp-and-incharges.sql`, `seed-teachers.sql` (password `131126` in dev).

---

## Agreed execution sequence (updated after mentor follow-up)

```text
Sprint Baseline  →  RLS tests (≥5, attendance)  →  Sprint O  →  test
       →  Sprint P  →  security tests pass  →  Sprint Q  →  Sprint R
       →  reassess architecture  →  Exams  →  Timetable  →  Communication
```

**Do not start Exams/Timetable until O→P→Q→R are trustworthy and Baseline diff is empty.**

---

### Sprint Baseline — Migration truth verification (URGENT)

**Problem:** Master doc Rule 6 — *“the same SQL migrations must recreate the same database structure”* — is the foundation of Phase 8 (new school = run migrations on fresh Supabase). Today we **assume** this is true; the manually applied consolidated ERP script means it may not be.

**Concrete fix (≈1 day):**
1. Run `npm run schema:coverage` — confirms which tables lack `CREATE TABLE` in migrations (currently **20 ERP tables**).
2. Run `npm run schema:dump:live` — snapshot live Supabase to `supabase/baseline/snapshots/live.json`.
3. Capture consolidated ERP SQL as `supabase/migrations/20260701000000_erp_foundation.sql` (see `supabase/baseline/README.md`).
4. Apply all migrations on a **fresh** database; run `npm run schema:dump:fresh`.
5. Run `npm run schema:compare` — turn every delta into migrations until exit code 0.

**Tooling added (21 Aug 2026):**
- `scripts/schema-baseline/migration-coverage.mjs`
- `scripts/schema-baseline/dump-schema.mjs`
- `scripts/schema-baseline/compare-schemas.mjs`
- `supabase/baseline/README.md` + `expected-tables.json`

**Done when:** migrations-only replay ≡ live production schema. Rule 6 is then **proven**, not assumed.

---

### RLS-Tests — Before Sprint P (not parallel)

Minimum **5 attendance-scoped checks** (expand to 15–20 later):

| # | Check |
|---|--------|
| 1 | Teacher **can** write attendance for an allotted section |
| 2 | Teacher **cannot** write attendance for a non-allotted section |
| 3 | Secondary cover teacher **can** write during active cover window |
| 4 | Secondary cover teacher **cannot** write after cover window ends |
| 5 | Disabled staff **cannot** authenticate / write |
| 6 | Principal/admin override **can** write (if policy allows) |

Run **before and after** Sprint P. Same verification method that missed two recursion bugs is not acceptable for new attendance policies.

**Scaffold:** `npm run test:security:attendance` (`scripts/security/attendance-rls-check.mjs`)

---

### Sprint O — Import Centre v2

Guardian dedupe (phone/email); match existing `HS-YYYY-NNNNN`; auto-enrollment; GUARDIAN_LINK mode; **idempotent re-import**; optional parent invite on commit.

**Gate:** Sprint Baseline complete (or import-table delta explicitly resolved).

---

### Sprint P — Teacher attendance RLS (security boundary)

Teachers and secondary cover may write **only** allotted sections — enforced in Postgres, not UI alone.

**Policy requirements (Mentor 1):**
- Check **`attendance_teacher_allotments`** for primary assignment scope.
- Check **`secondary_teacher_allotments`** for cover scope.
- Respect **time bounds** on secondary/substitute assignments — no write access after cover window ends.
- **Historical attribution:** removing a teacher from an allotment must **not** delete or re-attribute attendance they already marked (master doc Rule 15 — role removal ≠ historical erasure).
- Use **SECURITY DEFINER helpers** where needed to avoid RLS recursion (same pattern as `is_active_staff()`).

**Gate:** RLS-Tests scaffold landed; tests fail on current DB (proving gap), pass after P.

---

### Sprint Q — Year-end v2

Promote to next class/section mapping; close academic year workflow; transfer polish.

### Sprint R — Parent portal v2

Fee receipts, enrollment/class on child page, parent account centre.

---

### Major modules after O–R (reassess architecture first)

| Priority | Module | Rationale |
|----------|--------|-----------|
| 🟠 1 | **Examinations + report cards** | Natural academic core after attendance + enrollments |
| 🟠 2 | **Timetable** | Connects teacher, section, subject, attendance, substitutes |
| 🟠 3 | **Communication centre** | Audience + channel model vs scattered notifications |
| 🟠 4 | **Student documents** | Admissions, transfers, compliance |
| 🟠 5 | **Formal transfer / TC workflow** | Beyond “complete enrollment” |
| 🟡 6 | Staff leave / HR | Later; payroll much later |
| 🟡 7 | Capacitor mobile | After parent web stabilizes |
| 🟢 8 | Multi-school productization | After one-school validation |

---

## Modules in master doc / mentor review — not yet on roadmap

These are **accepted as valuable** but explicitly deferred:

- Offline attendance sync (Phase 4.4)
- SMS OTP passwords (needs Supabase phone auth)
- Library, transport, payroll
- AI features, blockchain/QR gimmicks, microservices
- Fancy analytics dashboards on Principal home

---

## Architecture we are keeping (no rewrite)

```text
Student (permanent HS-YYYY-NNNNN)
   ↓
Enrollment (per academic year / class / section / roll)
   ↓
Attendance · Fees · (future: Exams)

Guardian ←→ student_guardians ←→ Student
   ↓
Parent portal (read scoped by link + permission flags)

Staff (staff_profiles)
   ↓
staff_roles (Principal, VP, Incharge, Teacher, …)
   ↓
Assignments (attendance allotments, secondary cover → future timetable)
```

Intake flow (locked):

```text
Google Form / WhatsApp / Sheet → CSV → Import Centre → validate → ERP
Parents never create students; school links guardians first.
```

---

## What we are NOT doing (consensus with mentors)

- Rewriting core schema to imitate Fedena/MyClassBoard table layouts
- Dropping CMS tables before ERP fully replaces workflows
- Letting parents search or create student records
- Using service-role for routine CRUD
- Building 100-module admin sidebar
- Polishing UI/theme before operational correctness (RLS, import idempotency, year-end)

---

## Test accounts (development seeds)

Password for all seeded dev accounts: **`131126`**

| Account | Role |
|---------|------|
| `hs.viceprincipal@gmail.com` | Vice Principal |
| `hs.academic.incharge@gmail.com` | Academic Incharge |
| `hs.attendance.incharge@gmail.com` | Attendance Incharge |
| `hs.fees.incharge@gmail.com` | Fees Incharge |
| `hs.operations.incharge@gmail.com` | Operations Incharge |
| `teacher1@gmail.com` … `teacher10@gmail.com` | Teachers (classes 1–10) |
| Principal | Project owner account |

**E2E checklist (manual until automated tests exist):** Principal grants VP → incharge allots teacher → teacher marks attendance → secondary cover → parent views child → import CSV → year-end batch.

---

## Closing position for reviewers

**We accept ~90% of the architecture and both mentors’ discipline recommendations.** We do not plan a schema rewrite.

**We are correcting (revised priority order):**
1. **Migration truth (Sprint Baseline)** — schema diff until Rule 6 is proven
2. **RLS test scaffold** — ≥5 attendance checks before Sprint P
3. **Security boundaries** — Sprint P with allotment + secondary time bounds + historical attribution
4. **Import idempotency** — Sprint O
5. **Year-end + parent polish** — Sprints Q and R
6. **Documentation truth** — this file + archived stale snapshots

**We are adding to the roadmap (post O–R, after architecture reassess):** examinations, timetable, communication centre, student documents, formal TC.

**We are explicitly not prioritizing:** cosmetic UI work, premature mobile wrap, multi-school productization before Baseline diff is empty, or features that bypass ERP as source of truth.

**Next move (locked):** Finish Baseline capture (ERP foundation migration) → RLS tests → O → test → P → security tests → Q → R → reassess → Exams/Timetable.

---

*Maintainers: update this file when a sprint moves from partial → complete, when a migration ships, or when a production incident reveals a new gap.*
