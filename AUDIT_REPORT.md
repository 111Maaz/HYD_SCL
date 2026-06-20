# Hyderabad School — Project Audit & Progress Report

**Last updated:** 16 June 2026  
**Stack:** TanStack Start + React 19 + TypeScript + Supabase + Tailwind v4  
**Scope:** Living audit tracking public site, admin portal, faculty portal, database, and open work.

---

## Executive Summary

The project has moved well beyond the original Sprint 0 marketing site. It now includes:

- **8 public routes** (including `/students` for class materials)
- **Supabase-backed CMS** for admissions, faculty directory, gallery, and class materials
- **Admin portal** (`/admin/*`) with role-gated CRUD
- **Faculty portal** (`/faculty/portal/*`) for profile and class material uploads
- **Auth** via Supabase (admin + faculty roles)

Production build passes. Supabase is configured for local dev. Several content fields in `src/lib/site.ts` are populated; leadership/faculty names and principal photo remain placeholders.

---

## Sprint Progress

| Sprint | Focus | Status |
|--------|-------|--------|
| 0 | Marketing site audit, placeholder cleanup | ✅ Complete |
| 5 | Public data layer — `admission_enquiries`, `faculty_members`, `gallery_images`, `class_materials`, storage buckets | ✅ Complete |
| 6 | Auth — `users` table, admin/faculty roles, login | ✅ Complete |
| 7 | Admin RLS + admin CRUD for all CMS tables | ✅ Complete |
| 8 | Faculty portal — `faculty_profiles`, class material ownership, faculty RLS | ✅ Complete |
| 9 | Auth trigger (`auth.users` → `public.users`), faculty storage policies | ✅ Complete |
| 10 | UX polish + faculty account management (16 Jun 2026) | ✅ Complete |

---

## 1. Routes & Pages

### Public routes

| Route | File | Status |
|-------|------|--------|
| `/` | `src/routes/index.tsx` | OK — hero, stats, features, faculty preview, principal message, CTA |
| `/about` | `src/routes/about.tsx` | OK — vision/mission, leadership, history |
| `/academics` | `src/routes/academics.tsx` | OK — programs, subjects; faculty from Supabase (`faculty_members`) |
| `/islamic-education` | `src/routes/islamic-education.tsx` | OK |
| `/admissions` | `src/routes/admissions.tsx` | OK — enquiry form writes to `admission_enquiries` |
| `/gallery` | `src/routes/gallery.tsx` | OK — Supabase images with static fallbacks |
| `/students` | `src/routes/students.tsx` | OK — class selector + materials list with **Preview** and **Download** |
| `/contact` | `src/routes/contact.tsx` | ⚠️ Form still `console.log` only — not wired to backend |

### Admin routes (`/admin/*`)

| Route | Component | Status |
|-------|-----------|--------|
| `/admin/login` | Shared staff login (admin + faculty role select) | ✅ |
| `/admin/dashboard` | `AdminDashboard` | ✅ |
| `/admin/admissions` | `AdmissionsAdmin` — lead list, status, notes | ✅ |
| `/admin/faculty` | `FacultyAdmin` — public faculty directory CMS (`faculty_members`) | ✅ |
| `/admin/faculty-accounts` | `FacultyAccountsAdmin` — login provisioning (`faculty_profiles`) | ✅ |
| `/admin/gallery` | `GalleryAdmin` | ✅ |
| `/admin/class-materials` | `ClassMaterialsAdmin` | ✅ |
| `/admin/settings` | Settings view | ✅ Shell only |

### Faculty routes (`/faculty/portal/*`)

| Route | Component | Status |
|-------|-----------|--------|
| `/faculty/portal/profile` | `FacultyProfileView` | ✅ |
| `/faculty/portal/materials` | `FacultyMaterialsView` — upload/delete for assigned class | ✅ |

---

## 2. Database Schema (Supabase)

Migrations in `supabase/migrations/` (apply in order):

| Migration | Tables / changes |
|-----------|------------------|
| `20260615000000_sprint5_schema.sql` | `admission_enquiries`, `faculty_members`, `gallery_images`, `class_materials`, storage buckets |
| `20260615100000_sprint6_auth.sql` | `users`, auth helpers |
| `20260615200000_sprint7_admin.sql` | Admin RLS on CMS tables |
| `20260615300000_sprint8_faculty.sql` | `faculty_profiles`, faculty class-material RLS |
| `20260615400000_sprint9_auth_trigger_storage.sql` | `handle_new_auth_user` trigger, faculty storage policies |
| `20260616100000_faculty_profiles_is_active.sql` | `faculty_profiles.is_active` for temporary portal disable |

### Architecture decision: two faculty tables (kept as-is)

| Table | Purpose | Linked to auth? |
|-------|---------|-----------------|
| `faculty_members` | Public directory on Academics / homepage | No |
| `faculty_profiles` | Faculty portal login + assigned class | Yes (`user_id` → `users`) |

**Rationale:** Not every person shown on the website needs a login, and not every login needs a public listing. Admins maintain these separately. A future optional FK/link could reduce duplication if most faculty are 1:1.

---

## 3. Recent Changes (16 June 2026)

### Faculty account provisioning
- Fixed server-side Supabase admin client — added `ws` transport for Node.js 20 (`createSupabaseAdminClient` in `supabase.server.ts`)
- `.env` requires `SUPABASE_SERVICE_ROLE_KEY` for creating faculty logins
- Improved error messages in `FacultyAccountsAdmin` (server errors no longer masked as generic failure)
- Password minimum length: **6 characters** (Zod schema + form `minLength`)

### Faculty portal access toggle
- New `faculty_profiles.is_active` column (migration required on hosted Supabase)
- Admin **Portal access** switch on Faculty Accounts page
- Disabled faculty blocked at login and on faculty route guard

### Students / class materials UX
- **Preview** button on material cards — PDFs/images open in browser; Office files use Microsoft online viewer
- **Download** button retained
- File upload inputs in admin + faculty dialogs now use styled `Input` component (visible border/outline)

### Principal message
- `PRINCIPAL_PHOTO` constant in `PrincipalMessage.tsx` — set path e.g. `"/images/principal.jpg"` (file in `public/`)

---

## 4. Environment & Setup

Required in `.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-only; faculty account creation
```

Setup scripts:
- `npm run supabase:push` — apply migrations (needs Supabase CLI link)
- `npm run supabase:seed` — write `.env` + create dev admin/faculty accounts
- `npm run supabase:migrate` — direct SQL apply (needs `SUPABASE_DB_PASSWORD` or `DATABASE_URL`)

**Pending on hosted Supabase:** Run migration `20260616100000_faculty_profiles_is_active.sql` if portal access toggle errors (column missing).

---

## 5. Content Checklist (`src/lib/site.ts`)

| Item | Status |
|------|--------|
| `phone`, `phones`, `whatsapp`, `email`, `address`, `mapsQuery`, `mapsUrl` | ✅ Populated |
| `academicYear` | ✅ `2026–27` |
| `OFFICE_HOURS` | ✅ Populated |
| `SOCIAL_LINKS` | ⚠️ Generic Facebook/Instagram URLs — replace with real pages |
| `HOME_STATS` | ⚠️ Values present — verify accuracy with school |
| `LEADERSHIP` (4 slots) | ⚠️ Roles only — names/bios empty |
| `FACULTY` fallback (8 slots) | ⚠️ Roles only — superseded by Supabase when configured |
| `SCHOOL_HISTORY` | ⚠️ Generic copy — needs verified history |
| Principal photo (`PrincipalMessage.tsx`) | ⚠️ `PRINCIPAL_PHOTO = ""` — add image path |

CMS content (managed via admin, not `site.ts`):
- Public faculty directory → `/admin/faculty`
- Gallery → `/admin/gallery`
- Class materials → `/admin/class-materials` or faculty portal

---

## 6. Components Inventory

### Site components (public)

| Component | Used by |
|-----------|---------|
| `Header`, `Footer`, `WhatsAppButton` | `__root.tsx` |
| `PageHero`, `SectionHeader`, `FeatureCard`, `PersonCard` | Multiple routes |
| `FacultyPreview`, `PrincipalMessage`, `StatisticsSection`, etc. | Homepage / about |
| `ClassSelector`, `MaterialList` | `/students` |
| `GoogleMap` | `/contact` |

### Admin / portal components

| Component | Purpose |
|-----------|---------|
| `AdminShell`, `FacultyShell` | Portal layouts |
| `AdminDashboard`, `AdmissionsAdmin`, `FacultyAdmin`, `FacultyAccountsAdmin`, `GalleryAdmin`, `ClassMaterialsAdmin` | Admin CRUD |
| `FacultyProfileView`, `FacultyMaterialsView` | Faculty portal |

### UI (shadcn)

Many shadcn components are now **in active use** (button, dialog, input, table, switch, select, badge, avatar, etc.) across admin and faculty portals. Unused scaffold components remain tree-shaken.

---

## 7. Services Layer

| Service | Role |
|---------|------|
| `admissions.ts` | Submit + admin fetch/update enquiries |
| `faculty.ts` | Public `faculty_members` CRUD |
| `faculty-portal.ts` | Faculty profile, materials, portal access check |
| `class-materials.ts` | Class materials CRUD |
| `gallery.ts` | Gallery CRUD |
| `storage.ts` | Supabase storage upload/delete |
| `supabase/` + `supabase.server.ts` | Browser + server clients; admin client with `ws` |

Server functions:
- `faculty-accounts.server.ts` — `createFacultyAccountFn`, `listFacultyProfilesFn`, `setFacultyAccountActiveFn`

---

## 8. Known Issues & Open Work

| Item | Priority | Notes |
|------|----------|-------|
| Contact form not persisted | Medium | Still `console.log` in `contact.tsx` |
| `example.functions.ts` scaffold | Low | Unused TanStack Start example |
| Social links are placeholders | Low | Update in `site.ts` |
| Leadership / principal content | Medium | Names, bios, photo |
| Apply `is_active` migration on prod | High if using toggle | SQL in `20260616100000_faculty_profiles_is_active.sql` |
| Faculty members ↔ profiles sync | Low | Optional future link; currently manual |
| Contact form email notification | Medium | No email API wired |
| shadcn calendar/resizable TS errors | Low | Unused components only |

---

## 9. Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never prefix with `VITE_`
- RLS enabled on all public tables; admin/faculty policies enforced
- Faculty can only upload/delete materials for their assigned class
- Disabled faculty (`is_active = false`) cannot sign in or access portal routes

---

## 10. Files Modified in Latest Session (16 Jun 2026)

- `src/services/supabase.server.ts` — `createSupabaseAdminClient`, shared `ws` realtime config
- `src/lib/api/faculty-accounts.server.ts` — admin client, `setFacultyAccountActiveFn`, password min 6
- `src/components/admin/FacultyAccountsAdmin.tsx` — portal access toggle, error handling, password min 6
- `src/components/site/MaterialList.tsx` — Preview + Download buttons
- `src/lib/class-materials.ts` — `getMaterialPreviewUrl()`
- `src/components/admin/ClassMaterialsAdmin.tsx` — styled file input
- `src/components/faculty/FacultyMaterialsView.tsx` — styled file input
- `src/components/site/PrincipalMessage.tsx` — `PRINCIPAL_PHOTO` support
- `src/services/faculty-portal.ts` — `assertFacultyPortalAccess()`
- `src/lib/auth.ts` — block disabled faculty at login
- `src/lib/route-guards.ts` — block disabled faculty on portal routes
- `src/types/database.ts` — `faculty_profiles.is_active`
- `supabase/migrations/20260616100000_faculty_profiles_is_active.sql`
- `supabase/full-setup.sql` — `is_active` column
- `.env.example` — documents `SUPABASE_SERVICE_ROLE_KEY`

---

## 11. Sprint 0 Audit Archive (15 June 2026)

Original Sprint 0 scope was a 7-route marketing site with placeholder content centralized in `site.ts`. That work is complete. The site has since gained Supabase integration, admin/faculty portals, and a Students downloads page. See sections above for current state.

**Original Sprint 0 placeholder cleanup:** Fake phone numbers, addresses, and named faculty were removed or emptied. Many contact fields have since been repopulated with real school data in `site.ts`.

---

*Update this file when completing sprints, shipping features, or resolving open items.*
