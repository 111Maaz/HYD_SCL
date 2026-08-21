# School Management Platform — Implementation Plan

> Aligned with **SCHOOL MANAGEMENT PLATFORM v3.0** (master document).  
> Last updated: August 2026.  
> **Live status (done vs partial vs left):** see [`PLATFORM_PROGRESS_REPORT.md`](./PLATFORM_PROGRESS_REPORT.md).

---

## Current baseline (completed)

| Area | Status |
|------|--------|
| Phase 0 — Architecture & workflows | Documented |
| Phase 1 — Database foundation | SQL applied on Supabase |
| Phase 2 — Public website & enquiry admissions | ~95% (contact form + conversion wired) |
| Staff consolidation | `staff_profiles` + RBAC; legacy `users`/`faculty_*` dropped |
| RLS recursion fix | `20260820000000_fix_users_rls_recursion.sql` |
| Auth bridge | `get_app_role()` → `admin` / `faculty` for existing UI |

---

## Strategy

### Principle (from master doc)

**Don't build screens — build workflows.**

For each feature:

1. Define real school process + actors + permissions  
2. Use existing tables & RLS (no schema drift without migration)  
3. Service layer → admin UI → tests  
4. One vertical slice at a time (end-to-end, not “all tables then all UI”)

### Technical approach

- **Keep** legacy CMS tables (`admission_enquiries`, `gallery_images`, `class_materials`) until replaced by workflow.
- **Build ERP** on new tables (`academic_years`, `students`, `enrollments`, …).
- **Reuse** admin shell, React Query, shadcn patterns from admissions/faculty admin.
- **Permissions**: RLS uses `user_has_permission()`; PRINCIPAL has full access. UI stays on `requireAdmin()` until permission-based nav is needed.
- **One active academic year** at a time (enforced in app + optional DB constraint later).

### Repository layout (incremental)

```
src/
  types/academic.ts          # ERP academic types
  services/
    academic-years.ts        # Phase 3.1
    academic-structure.ts    # Phase 3.2 (class_years, sections)
    students.ts              # Phase 3.3
    enrollments.ts           # Phase 3.3
    contact.ts               # Phase 2.1
    admission-conversion.ts  # Phase 2.4
  components/admin/
    AcademicYearsAdmin.tsx
    AcademicStructureAdmin.tsx
    StudentsAdmin.tsx
    ContactEnquiriesAdmin.tsx
  routes/admin/
    academic-years.tsx
    academic-structure.tsx
    students.tsx
    contact.tsx
```

---

## Phased roadmap

### Phase 2 completion (polish) — parallel / low priority

| Step | Task | Effort |
|------|------|--------|
| 2.1 | Contact form → `contact_enquiries` table ✅ | Small |
| 2.2 | Leadership bios & social links in CMS | Small |
| 2.3 | Admission workflow: review UI improvements | Medium |
| 2.4 | **Admission → student conversion** ✅ | Medium |

### Phase 3 — Academic management (NOW)

| Step | Task | Tables | Admin route |
|------|------|--------|-------------|
| **3.1** | **Academic years CRUD** ✅ | `academic_years` | `/admin/academic-years` |
| 3.2 | Bootstrap class_years from master `classes` ✅ | `classes`, `class_years` | `/admin/academic-structure` |
| 3.3 | Sections + capacity per class-year ✅ | `sections` | `/admin/academic-structure` |
| **3.4** | Students CRUD + permanent student ID ✅ | `students` | `/admin/students` |
| **3.5** | Enrollments + roll numbers ✅ | `enrollments` | `/admin/students` (enroll tab) |
| 3.6 | Year-end: promote / repeat / transfer | `enrollments` | wizard (later) |

**3.1 acceptance criteria**

- Admin can list, create, edit academic years  
- Status: PLANNING → ACTIVE → CLOSED → ARCHIVED  
- Only one ACTIVE year at a time  
- Creating a year can optionally seed `class_years` for all master classes  

### Phase 4 — Attendance

| Step | Task | Admin route |
|------|------|-------------|
| 4.1 | School calendar CRUD (`calendar_events`) ✅ | `/admin/calendar` |
| 4.2 | Mark attendance per section (`attendance_records`) ✅ | `/admin/attendance` |
| 4.3 | Corrections + audit ✅ | `/admin/attendance`, `/admin/audit` |
| 4.4 | Offline sync (later) | — |

### Phase 5 — Fees

| Step | Task | Admin route |
|------|------|-------------|
| 5.1 | Fee structures per year/class ✅ | `/admin/fees` |
| 5.2 | Student charges + payments + receipts ✅ | `/admin/fees` |
| 5.3 | Ledger view + outstanding reports ✅ | `/admin/fees` (Outstanding tab) |

### Phase 6 — Guardians + Parent portal + Import centre

Capacitor optional later; start as **web** vertical slices on existing tables  
(`guardians`, `student_guardians`, `import_jobs`, `import_rows`).

#### Agreed real-world strategy (locked)

**Google Form / Excel / WhatsApp responses are intake only — ERP is the source of truth.**  
Parents never create students. School establishes student ↔ guardian links; parents then log in and see linked children only.

**New admissions**

```text
Google Form → Sheet/CSV → Import Centre → validate/dedupe
  → students + guardians + student_guardians + enrollments
  → parent invite (auth.users ↔ guardians.auth_user_id)
```

**Existing students**

```text
WhatsApp → parent info form → Sheet/CSV → Import Centre
  → match permanent Student ID (HS-YYYY-NNNNN) — do NOT create a new student
  → create/match guardian (same phone/email → reuse one guardian for siblings)
  → student_guardians link
```

**Sibling rule:** one guardian record for multiple children (never duplicate guardians for the same parent).

**Parent login after link**

```text
guardians.auth_user_id → student_guardians → students
  → My Children → child detail (attendance / fees / …)
```

| Step | Task | Tables / route |
|------|------|----------------|
| 6.1 | Admin Guardians CRUD + link to students ✅ | `guardians`, `student_guardians` → `/admin/guardians` |
| 6.2 | Invite / create parent auth account ✅ | `guardians.auth_user_id` |
| 6.3 | Parent portal: login + My Children ✅ (basic) | `/parent/children` |
| 6.4 | Parent read views: attendance / fees (linked only) | RLS already scoped |
| 6.5 | Import Centre: CSV preview, validate, dedupe, commit, log | `import_jobs`, `import_rows` |
| 6.6 | Capacitor common app (later) | wrap parent + staff |

### Phase 7 — Principal app

| Step | Task | Admin route |
|------|------|-------------|
| 7.1 | ERP dashboard metrics ✅ | `/admin/dashboard` |
| 7.2 | Audit centre (read-only) ✅ | `/admin/audit` |

### Phase 8 — Productization

`school.config.ts`, onboarding checklist; Import Centre hardened for multi-school.

---

## Implementation order (sprints)

```
Sprint A ─ Academic years admin (3.1) ✅
Sprint B ─ Class years + sections (3.2–3.3) ✅
Sprint C ─ Students + enrollments (3.4–3.5) ✅
Sprint D ─ Admission conversion + contact form (2.4, 2.1) ✅
Sprint E ─ Calendar + attendance (4.1–4.3) ✅
Sprint F ─ Fees structures, charges, payments, ledger (5.1–5.3) ✅
Sprint G ─ Principal dashboard + audit centre (7.1–7.2) ✅
Sprint H ─ Role-aware login + staff role assignment ✅
Sprint I ─ Guardians admin + student links + parent invite ✅
Sprint J ─ Parent portal detail views (attendance/fees) ✅
Sprint K ─ Import Centre CSV (6.5) ✅
Sprint L ─ Role portals (Principal/VP/Incharge/Teacher homes, allotments, account centre) ✅
Sprint M ─ Incharge scoped nav hubs (Academic/Fees/Operations) ✅
Sprint N ─ Year-end enrollment wizard (3.6) ✅
Sprint Baseline ─ ERP foundation migration captured ✅
Sprint O ─ Import Centre v2 ✅
Sprint P ─ Teacher attendance RLS ✅
Sprint Q ─ Year-end v2 ✅
Sprint R ─ Parent portal v2 ✅
```

**Run on Supabase after pull:**
- `20260701000000_erp_foundation.sql` — **only on fresh DB** (already on live via consolidated SQL; do not re-run on production)
- `20260820900000_teacher_attendance_rls.sql`
- `20260821000000_parent_guardian_self_update.sql`
- `20260820800000_parent_portal_and_import.sql` (if not applied)

---

## What NOT to do yet

- Drop CMS tables  
- Let parents search/create students  
- Treat Google Sheets as permanent source of truth  
- Capacitor mobile wrap before parent web portal works  
- SMS OTP password change until Supabase phone auth is configured (email reset is live)

---

## Migration discipline

- Every schema change → new file in `supabase/migrations/`  
- Never edit applied migrations on production  
- Test RLS with real admin + teacher + parent accounts after each phase  

---

*Update this file when completing each sprint.*
