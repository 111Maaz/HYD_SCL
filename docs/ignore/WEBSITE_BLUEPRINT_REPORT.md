# Hyderabad School — Complete Website Blueprint

> **⚠️ HISTORICAL (17 June 2026)** — Pre-ERP CMS era. References dropped tables (`users`, `faculty_profiles`). Do not use for AI prompts or ERP work.  
> **Current status:** [`docs/PLATFORM_PROGRESS_REPORT.md`](../docs/PLATFORM_PROGRESS_REPORT.md)  
> **Forward plan:** [`docs/PLATFORM_IMPLEMENTATION_PLAN.md`](../docs/PLATFORM_IMPLEMENTATION_PLAN.md)

> **Purpose**: This document is the single source of truth for understanding, maintaining, debugging, and restoring every aspect of the Hyderabad School website. If something breaks, this report tells you **what** exists, **how** it works, and **why** it was built that way.

> **Last Updated**: 2026-06-17

---

## Table of Contents

1. [Tech Stack Overview](#1-tech-stack-overview)
2. [Project Structure](#2-project-structure)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Environment Variables](#4-environment-variables)
5. [Routing & Pages](#5-routing--pages)
6. [Components Inventory](#6-components-inventory)
7. [Services Layer](#7-services-layer)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Database Schema](#9-database-schema)
10. [Row Level Security (RLS) Policies](#10-row-level-security-rls-policies)
11. [Storage Buckets](#11-storage-buckets)
12. [Database Migrations](#12-database-migrations)
13. [Design System & Styling](#13-design-system--styling)
14. [Build & Deployment](#14-build--deployment)
15. [Scripts & Setup](#15-scripts--setup)
16. [Data Flow Diagrams](#16-data-flow-diagrams)
17. [Troubleshooting Guide](#17-troubleshooting-guide)
18. [Known Configuration & Gotchas](#18-known-configuration--gotchas)

---

## 1. Tech Stack Overview

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| **Framework** | TanStack Start (React) | ^1.167 | Full-stack SSR React framework with file-based routing, server functions, and streaming |
| **UI Library** | React | ^19.2 | Component-based UI with hooks |
| **Router** | TanStack Router | ^1.168 | Type-safe file-based routing with loaders, guards, and preloading |
| **Data Fetching** | TanStack React Query | ^5.83 | Client-side caching, mutations, optimistic updates, stale-while-revalidate |
| **Backend / BaaS** | Supabase | ^2.108 | Postgres database, auth, storage, real-time, RLS — all in one |
| **SSR Auth** | @supabase/ssr | ^0.12 | Cookie-based auth for server-side rendering |
| **Styling** | Tailwind CSS v4 | ^4.2 | Utility-first CSS with design tokens via `@theme` |
| **UI Primitives** | shadcn/ui + Radix UI | various | Accessible, unstyled component primitives |
| **Animations** | Framer Motion | ^12.40 | Declarative scroll/enter animations |
| **Forms** | React Hook Form + Zod | ^7.79 / ^4.4 | Performant forms with schema validation |
| **Bundler** | Vite | ^7.3 | Fast HMR dev server and optimized production builds |
| **Server Runtime** | Nitro | ^3.0-beta | Universal server output (Cloudflare, Node, etc.) |
| **Language** | TypeScript | ^5.8 | Type safety across the entire codebase |
| **Package Manager** | Bun | latest | Fast installs via `bun.lock` (npm `package-lock.json` also present) |
| **Toasts** | Sonner | ^2.0 | Toast notifications |
| **Icons** | Lucide React | ^1.18 | Consistent icon set |
| **Fonts** | Playfair Display + Inter | Google Fonts | Display headings + body text |

### Why This Stack?

- **TanStack Start** was chosen for SSR + file-based routing + server functions in one framework, avoiding Next.js dependency.
- **Supabase** provides a complete backend (Postgres + Auth + Storage + RLS) without running custom servers.
- **Tailwind v4** with `@theme` tokens gives a design system without config files.
- **shadcn/ui** provides copy-paste accessible components that are fully customizable.
- **Framer Motion** adds premium scroll-reveal and hover animations.

---

## 2. Project Structure

```
HS_Web/
├── .env                          # Environment secrets (git-ignored)
├── .env.example                  # Template for environment variables
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite + TanStack Start + Tailwind config
├── tsconfig.json                 # TypeScript configuration
├── components.json               # shadcn/ui configuration
│
├── public/
│   ├── robots.txt                # Search engine crawling rules
│   └── WEBSITE_BLUEPRINT.md      # THIS FILE
│
├── scripts/
│   ├── apply-migrations.mjs      # Applies SQL migrations to Supabase
│   └── setup-supabase.mjs        # Seeds buckets & dev accounts
│
├── supabase/
│   ├── config.toml               # Supabase CLI project config
│   ├── full-setup.sql            # Complete schema (all migrations combined)
│   ├── seed.sql                  # Seed data
│   └── migrations/               # Incremental SQL migrations (6 files)
│
└── src/
    ├── start.ts                  # Client-side hydration entry
    ├── server.ts                 # Server-side SSR entry (error wrapper)
    ├── router.tsx                # TanStack Router creation
    ├── routeTree.gen.ts          # Auto-generated route tree (DO NOT EDIT)
    ├── styles.css                # Global CSS + design tokens
    ├── vite-env.d.ts             # Vite type declarations
    │
    ├── assets/                   # Static images (hero, campus blocks, logo, etc.)
    │
    ├── routes/                   # File-based route pages
    │   ├── __root.tsx            # Root layout (HTML shell, Navbar, Footer)
    │   ├── index.tsx             # Home page (/)
    │   ├── about.tsx             # About page (/about)
    │   ├── academics.tsx         # Academics page (/academics)
    │   ├── admissions.tsx        # Admissions + enquiry form (/admissions)
    │   ├── contact.tsx           # Contact page (/contact)
    │   ├── gallery.tsx           # Photo gallery (/gallery)
    │   ├── students.tsx          # Students + class materials (/students)
    │   ├── islamic-education.tsx  # Islamic Education page (/islamic-education)
    │   ├── admin/                # Admin panel routes (protected)
    │   └── faculty/              # Faculty portal routes (protected)
    │
    ├── components/
    │   ├── site/                 # Public site components (21 files)
    │   ├── admin/                # Admin panel components (7 files)
    │   ├── faculty/              # Faculty portal components (2 files)
    │   ├── portal/               # Portal shell layouts (3 files)
    │   └── ui/                   # shadcn/ui primitives (46 files)
    │
    ├── services/                 # Supabase data access layer
    │   ├── supabase.ts           # Browser Supabase client
    │   ├── supabase.server.ts    # Server Supabase clients (SSR + admin)
    │   ├── supabase/middleware.ts # Cookie session refresh middleware
    │   ├── admissions.ts         # Admission enquiries CRUD
    │   ├── faculty.ts            # Faculty members CRUD + photo upload
    │   ├── gallery.ts            # Gallery images CRUD + upload
    │   ├── class-materials.ts    # Class materials CRUD + file upload
    │   ├── faculty-portal.ts     # Faculty portal profile & materials
    │   └── storage.ts            # Generic storage upload/delete helpers
    │
    ├── lib/                      # Utilities & configuration
    │   ├── site.ts               # Site constants (name, phones, address, nav links)
    │   ├── auth.ts               # Auth helpers (requireAdmin, signOut)
    │   ├── get-auth-state.ts     # Server function: read session → {user, role}
    │   ├── route-guards.ts       # Route guard functions (requireAdmin, requireFaculty)
    │   ├── require-faculty.ts    # Faculty-specific guard with portal access check
    │   ├── class-materials.ts    # Subjects list, class labels, colors
    │   ├── admin-nav.ts          # Admin sidebar navigation items
    │   ├── faculty-nav.ts        # Faculty portal navigation items
    │   ├── config.server.ts      # Server-only env var reader
    │   ├── motion.tsx            # Framer Motion re-export
    │   ├── utils.ts              # cn() class name merger utility
    │   ├── error-capture.ts      # Error capture for SSR
    │   ├── error-page.ts         # Static error page HTML renderer
    │   ├── lovable-error-reporting.ts # Lovable.dev error reporting
    │   └── api/
    │       ├── faculty-accounts.server.ts  # Server functions for faculty account CRUD
    │       └── example.functions.ts        # Example server function template
    │
    ├── hooks/
    │   ├── useAuth.tsx           # Auth hook: user, role, isAdmin, isFaculty, signOut
    │   └── use-mobile.tsx        # Mobile breakpoint detection hook
    │
    └── types/
        └── database.ts           # TypeScript types matching Supabase schema
```

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│   src/start.ts → hydrateRoot()                                  │
│        │                                                        │
│   src/router.tsx → TanStack Router                              │
│        │                                                        │
│   src/routes/__root.tsx                                         │
│   ├── <Navbar />         (site header, nav links)               │
│   ├── <Footer />         (site footer, contact, office hours)   │
│   ├── <WhatsAppButton /> (floating CTA)                         │
│   ├── <Toaster />        (toast notifications)                  │
│   └── <Outlet />         (renders matched child route)          │
│        │                                                        │
│   ┌────┴────────────────────────────────────────┐               │
│   │ PUBLIC ROUTES          PROTECTED ROUTES      │               │
│   │ /              (Home)  /admin/*  (Admin)     │               │
│   │ /about                 /faculty/* (Faculty)  │               │
│   │ /academics                                   │               │
│   │ /admissions                                  │               │
│   │ /contact                                     │               │
│   │ /gallery                                     │               │
│   │ /students                                    │               │
│   │ /islamic-education                           │               │
│   └──────────────────────────────────────────────┘               │
│        │                                                        │
│   services/*.ts → Supabase Browser Client                       │
│   (supabase.ts creates client using VITE_* env vars)            │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────┴───────────────────────────────────────────┐
│                    SERVER (Nitro / SSR)                          │
│                                                                 │
│   src/server.ts → SSR handler + error wrapper                   │
│   src/lib/get-auth-state.ts → createServerFn()                  │
│   src/lib/api/faculty-accounts.server.ts → createServerFn()     │
│   src/services/supabase.server.ts → Server Supabase clients     │
│        │                                                        │
│   Uses: SUPABASE_SERVICE_ROLE_KEY (admin operations)            │
│         Cookie-based session for SSR auth                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────┴───────────────────────────────────────────┐
│                     SUPABASE (Backend)                           │
│                                                                 │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────────┐         │
│   │   Postgres   │  │     Auth     │  │    Storage    │         │
│   │              │  │              │  │               │         │
│   │ 6 tables     │  │ Email/Pass   │  │ 3 buckets     │         │
│   │ RLS enabled  │  │ JWT tokens   │  │ Public read   │         │
│   │ 2 functions  │  │ 2 roles      │  │ Role-based    │         │
│   │ 1 trigger    │  │              │  │   write       │         │
│   └─────────────┘  └──────────────┘  └───────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Environment Variables

### `.env` (Required)

| Variable | Scope | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | Browser + Server | Supabase project URL (e.g., `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Browser + Server | Supabase anon/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server ONLY | Service role key — bypasses RLS, used for admin operations (creating faculty auth accounts). **NEVER expose to browser.** |

> **Why two sets of keys?** `VITE_` prefixed variables are bundled into the browser JavaScript by Vite. Non-prefixed variables stay server-side only. The service role key must NEVER reach the browser because it bypasses all Row Level Security.

### Dev Seed Accounts (created by `npm run supabase:seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hyderabadschool.test` | `Admin123!` |
| Faculty | `faculty@hyderabadschool.test` | `Faculty123!` |

---

## 5. Routing & Pages

### Route Map

| URL | File | Type | Auth | Description |
|-----|------|------|------|-------------|
| `/` | `routes/index.tsx` | Public | None | Home page — hero, stats, sections, CTA |
| `/about` | `routes/about.tsx` | Public | None | About — mission, values, leadership, history |
| `/academics` | `routes/academics.tsx` | Public | None | Academic programs, curriculum, faculty roster |
| `/admissions` | `routes/admissions.tsx` | Public | None | Admissions process + enquiry form |
| `/contact` | `routes/contact.tsx` | Public | None | Contact info, Google Maps, contact form |
| `/gallery` | `routes/gallery.tsx` | Public | None | Photo/video gallery from Supabase |
| `/students` | `routes/students.tsx` | Public | None | Student life + class materials browser |
| `/islamic-education` | `routes/islamic-education.tsx` | Public | None | Islamic education showcase page |
| `/admin/login` | `routes/admin/login.tsx` | Public | Redirect if authed | Admin + Faculty login form |
| `/admin/dashboard` | `routes/admin/dashboard.tsx` | Admin | `requireAdmin()` | Stats overview + quick links |
| `/admin/admissions` | `routes/admin/admissions.tsx` | Admin | `requireAdmin()` | Manage admission enquiry leads |
| `/admin/faculty` | `routes/admin/faculty.tsx` | Admin | `requireAdmin()` | Manage public faculty roster |
| `/admin/gallery` | `routes/admin/gallery.tsx` | Admin | `requireAdmin()` | Manage gallery images/videos |
| `/admin/class-materials` | `routes/admin/class-materials.tsx` | Admin | `requireAdmin()` | Manage study materials |
| `/admin/faculty-accounts` | `routes/admin/faculty-accounts.tsx` | Admin | `requireAdmin()` | Create/manage faculty portal accounts |
| `/admin/settings` | `routes/admin/settings.tsx` | Admin | `requireAdmin()` | Account info & settings |
| `/faculty/portal/profile` | `routes/faculty/portal/profile.tsx` | Faculty | `requireFaculty()` | View own profile |
| `/faculty/portal/materials` | `routes/faculty/portal/materials.tsx` | Faculty | `requireFaculty()` | Manage class materials for assigned class |

### Route Guard Flow

```
User visits protected route
    │
    ▼
__root.tsx beforeLoad
    │ calls getAuthState() (server function)
    │ reads cookies → Supabase session → queries users table for role
    │ returns { user, role } in route context
    │
    ▼
admin/route.tsx or faculty/route.tsx beforeLoad
    │ checks context.user and context.role
    │
    ├── user is null → redirect to /admin/login
    ├── role mismatch → redirect to correct dashboard
    └── authorized → render page
```

### Data Fetching Per Page

| Page | Query Key | Table | What It Fetches |
|------|-----------|-------|-----------------|
| `/academics` | `faculty-members` | `faculty_members` | Active faculty, ordered by `display_order` |
| `/admissions` | — (mutation) | `admission_enquiries` | Submits new enquiry |
| `/gallery` | `gallery-images` | `gallery_images` | Active images, ordered by `display_order` |
| `/students` | `class-materials` | `class_materials` | All materials, filterable by class |
| `/about` | `faculty-members` | `faculty_members` | Faculty for leadership section |
| `/admin/dashboard` | Multiple admin keys | All tables | Count statistics |
| `/admin/admissions` | `admin.admission-leads` | `admission_enquiries` | All leads with status/notes |
| `/admin/faculty` | `admin.faculty-members` | `faculty_members` | All members (including inactive) |
| `/admin/gallery` | `admin.gallery-images` | `gallery_images` | All images (including inactive) |
| `/admin/class-materials` | `admin.class-materials` | `class_materials` | All materials |
| `/admin/faculty-accounts` | `admin.faculty-accounts` | `faculty_profiles` | All faculty portal accounts |
| `/faculty/portal/profile` | `faculty.profile` | `faculty_profiles` | Own profile |
| `/faculty/portal/materials` | `faculty.materials` | `class_materials` | Materials for assigned class |

---

## 6. Components Inventory

### 6.1 Site Components (`src/components/site/`) — 21 files

| Component | Purpose | Data Source |
|-----------|---------|-------------|
| `Header.tsx` | Sticky top nav with logo, links, "Apply Now" CTA, mobile menu | `NAV_LINKS` from `site.ts` |
| `Footer.tsx` | 4-column footer: branding, explore links, contact, office hours | `SITE`, `NAV_LINKS`, `OFFICE_HOURS` |
| `ScrollProgressIndicator.tsx` | Vertical nav dots showing scroll position (desktop) | `IntersectionObserver` |
| `PageHero.tsx` | Reusable hero banner with gradient + Islamic pattern | Props: `title`, `eyebrow` |
| `SectionHeader.tsx` | Reusable section header with badge + title + subtitle | Props |
| `PersonCard.tsx` | Faculty/person card with photo or initials, name, role, bio | Props: `Person` object |
| `FeatureCard.tsx` | Animated card with icon, title, description | Props |
| `StatisticsSection.tsx` | Gold number stats bar (students, faculty, years, pass rate) | `HOME_STATS` from `site.ts` |
| `WhyParentsChoose.tsx` | Feature grid with reasons parents choose the school | Static data |
| `PrincipalMessage.tsx` | Principal's quote/message section | `LEADERSHIP[0]` from `site.ts` |
| `CampusStructure.tsx` | Campus blocks grid (Boys, Girls, KG) with images | Static data + imported images |
| `StudentDevelopment.tsx` | 6 development pillars grid | Static data |
| `AdmissionsCTA.tsx` | Full-width admissions call-to-action banner | Static |
| `FacultyPreview.tsx` | 4 faculty preview cards (currently **NOT used** on home page) | `useQuery → faculty_members` |
| `FacultySection.tsx` | Full faculty listing grid | Props: `members[]` |
| `IslamicEducationShowcase.tsx` | Full Islamic education page content | Static data |
| `ClassSelector.tsx` | Class number (1-10) tab selector | Props: `selected`, `onSelect` |
| `MaterialList.tsx` | Study materials grid with preview/download | Props: `materials[]` |
| `GoogleMap.tsx` | Google Maps iframe embed | `SITE.mapsUrl` |
| `WhatsAppButton.tsx` | Floating WhatsApp chat button (bottom-right) | `SITE.whatsapp` |
| `MotionProvider.tsx` | `LazyMotion` wrapper for Framer Motion tree-shaking | — |
| `SchoolTimeline.tsx` | Vertical timeline of school milestones | Static data |

### 6.2 Admin Components (`src/components/admin/`) — 7 files

| Component | Purpose | Tables Accessed |
|-----------|---------|-----------------|
| `AdminDashboard.tsx` | Stats cards + module quick links | All 4 main tables (counts) |
| `AdminPageHeader.tsx` | Reusable admin page header + loading/error states | — |
| `AdmissionsAdmin.tsx` | Lead management table with status/notes | `admission_enquiries` |
| `FacultyAdmin.tsx` | Faculty roster CRUD + photo upload + reorder | `faculty_members`, `faculty-photos` bucket |
| `GalleryAdmin.tsx` | Gallery CRUD + image/video upload + reorder | `gallery_images`, `gallery-images` bucket |
| `ClassMaterialsAdmin.tsx` | Materials CRUD + file upload | `class_materials`, `class-materials` bucket |
| `FacultyAccountsAdmin.tsx` | Faculty portal account management | `faculty_profiles`, `users`, Supabase Auth |

### 6.3 Faculty Components (`src/components/faculty/`) — 2 files

| Component | Purpose | Tables Accessed |
|-----------|---------|-----------------|
| `FacultyProfileView.tsx` | Display own profile (read-only) | `faculty_profiles` |
| `FacultyMaterialsView.tsx` | Upload/manage materials for assigned class | `class_materials`, `class-materials` bucket |

### 6.4 Portal Shell Components (`src/components/portal/`) — 3 files

| Component | Purpose |
|-----------|---------|
| `AdminShell.tsx` | Admin layout wrapper with collapsible sidebar |
| `FacultyShell.tsx` | Faculty layout wrapper with sidebar |
| `PortalShell.tsx` | Generic portal layout (fallback) |

### 6.5 UI Primitives (`src/components/ui/`) — 46 shadcn/ui components

Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, Context Menu, Dialog, Drawer, Dropdown Menu, Form, Hover Card, Input, Input OTP, Label, Menubar, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Switch, Table, Tabs, Textarea, Toggle, Toggle Group, Tooltip.

---

## 7. Services Layer

All services live in `src/services/` and provide the data access layer between components and Supabase.

### `supabase.ts` — Browser Client

```typescript
// Creates singleton browser-side Supabase client
// Uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
// Used by all client-side data fetching
```

### `supabase.server.ts` — Server Clients

```typescript
// createSupabaseServerClient() — SSR client with cookie-based auth
// createSupabaseAdminClient() — Service role client (bypasses RLS)
//   Used for: creating/deleting auth users, admin operations
```

### `admissions.ts`

| Function | Operation | Table |
|----------|-----------|-------|
| `submitAdmissionEnquiry(data)` | INSERT | `admission_enquiries` |
| `fetchAdmissionLeads()` | SELECT all, ordered by `created_at DESC` | `admission_enquiries` |
| `updateAdmissionStatus(id, status)` | UPDATE `status` | `admission_enquiries` |
| `updateAdmissionNotes(id, notes)` | UPDATE `notes` | `admission_enquiries` |

### `faculty.ts`

| Function | Operation | Table/Bucket |
|----------|-----------|-------------|
| `fetchFacultyMembers()` | SELECT active, ordered by `display_order` | `faculty_members` |
| `fetchAllFacultyMembers()` | SELECT all (admin view) | `faculty_members` |
| `createFacultyMember(data)` | INSERT | `faculty_members` |
| `updateFacultyMember(id, data)` | UPDATE | `faculty_members` |
| `deleteFacultyMember(id)` | DELETE | `faculty_members` |
| `reorderFacultyMembers(ids)` | Batch UPDATE `display_order` | `faculty_members` |
| `uploadFacultyPhoto(file, memberId)` | Upload to storage | `faculty-photos` bucket |
| `removeFacultyPhoto(memberId)` | Delete from storage | `faculty-photos` bucket |

### `gallery.ts`

| Function | Operation | Table/Bucket |
|----------|-----------|-------------|
| `fetchGalleryImages(fallback?)` | SELECT active, ordered | `gallery_images` |
| `fetchAllGalleryImages()` | SELECT all (admin) | `gallery_images` |
| `uploadGalleryImage(file, caption, spanClass?)` | INSERT + upload | `gallery_images` + `gallery-images` bucket |
| `deleteGalleryImage(id)` | DELETE + remove file | `gallery_images` + `gallery-images` bucket |
| `reorderGalleryImages(ids)` | Batch UPDATE `display_order` | `gallery_images` |

### `class-materials.ts`

| Function | Operation | Table/Bucket |
|----------|-----------|-------------|
| `fetchClassMaterials()` | SELECT all | `class_materials` |
| `fetchAllClassMaterials()` | SELECT all (admin) | `class_materials` |
| `fetchFacultyClassMaterials(classNum)` | SELECT by class_number | `class_materials` |
| `uploadClassMaterial(data, file)` | INSERT + upload | `class_materials` + `class-materials` bucket |
| `replaceClassMaterialFile(id, file)` | UPDATE file_url + re-upload | `class_materials` + bucket |
| `updateClassMaterial(id, data)` | UPDATE metadata | `class_materials` |
| `deleteClassMaterial(id)` | DELETE + remove file | `class_materials` + bucket |

### `faculty-portal.ts`

| Function | Operation | Table |
|----------|-----------|-------|
| `fetchOwnFacultyProfile(userId)` | SELECT own profile | `faculty_profiles` |
| `assertFacultyPortalAccess(userId)` | Check `is_active` on profile | `faculty_profiles` |

### `storage.ts`

Generic helpers: `uploadToStorage(bucket, path, file)`, `removeFromStorage(bucket, path)`, `getStoragePublicUrl(bucket, path)`.

### Server Functions (`src/lib/api/faculty-accounts.server.ts`)

These run **exclusively on the server** using TanStack Start's `createServerFn`:

| Function | Operation | Why Server-Only |
|----------|-----------|-----------------|
| `createFacultyAccountFn` | Create Supabase Auth user + `faculty_profiles` row | Needs admin auth API (service role key) |
| `listFacultyProfilesFn` | List all faculty profiles | Admin-only server query |
| `updateFacultyAccountFn` | Update profile + sync auth metadata | Needs admin auth API |
| `setFacultyAccountActiveFn` | Toggle `is_active` flag | Needs admin client to bypass self-RLS |

---

## 8. Authentication & Authorization

### Auth Flow

```
1. User visits /admin/login or /faculty/login
2. Enters email + password
3. supabase.auth.signInWithPassword() → returns session
4. Session stored as HTTP-only cookie (via @supabase/ssr)
5. On every page load:
   a. __root.tsx beforeLoad → getAuthState() (server function)
   b. Server reads cookie → supabase.auth.getUser() → queries users table
   c. Returns { user, role } in route context
6. Protected route guards check context.role
7. Components use useAuth() hook to read user/role from context
```

### Roles

| Role | Access | Guard Function |
|------|--------|---------------|
| `admin` | Full admin panel, all CRUD, faculty account management | `requireAdmin()` in `route-guards.ts` |
| `faculty` | Faculty portal only — own profile, materials for assigned class | `requireFaculty()` in `require-faculty.ts` |
| `anon` (not logged in) | Public pages only, can submit admission enquiries | No guard (default) |

### Key Auth Files

| File | Purpose |
|------|---------|
| `src/lib/get-auth-state.ts` | Server function: reads cookie session, returns `{user, role}` |
| `src/lib/auth.ts` | `requireAdmin()`, `requireAuth()`, `signOut()` |
| `src/lib/route-guards.ts` | `requireRole()`, `requireAdmin()`, `redirectIfAuthenticated()` |
| `src/lib/require-faculty.ts` | `requireFaculty()` with portal access verification |
| `src/hooks/useAuth.tsx` | React hook: `{user, role, isAdmin, isFaculty, signOut}` |

### Auth Trigger (Database)

When a new user is created in `auth.users`, a Postgres trigger (`on_auth_user_created`) automatically creates a corresponding row in `public.users`:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
```

The trigger reads `raw_user_meta_data->>'role'` (set during `createUser()`) and inserts the user with that role. Defaults to `'faculty'` if not specified.

---

## 9. Database Schema

### Entity Relationship Diagram

```
┌──────────────────────┐     ┌───────────────────────────────┐
│     auth.users       │     │    public.users                │
│  (Supabase Auth)     │────▶│                                │
│                      │ 1:1 │  id (PK, FK→auth ON DELETE     │
│  id                  │     │       CASCADE)                 │
│  email               │     │  email (UNIQUE)                │
│  encrypted_password  │     │  role: admin|faculty            │
└──────────────────────┘     │  created_at                    │
                              └──────────┬─────────────────────┘
                                        │ 1:1
                              ┌─────────▼─────────────┐
                              │  faculty_profiles      │
                              │                        │
                              │  id (PK)               │
                              │  user_id (FK→users      │
                              │       ON DELETE CASCADE)│
                              │  name, role, bio       │
                              │  photo_url             │
                              │  assigned_class (1-10) │
                              │  is_active             │
                              │  created_at, updated_at│
                              └────────────────────────┘

┌─────────────────────────┐   ┌─────────────────────────┐
│  admission_enquiries    │   │    faculty_members       │
│                         │   │    (public roster)       │
│  id (PK)                │   │                          │
│  parent_name            │   │  id (PK)                 │
│  email, phone           │   │  name, role, bio         │
│  student_name           │   │  photo_url, initials     │
│  grade                  │   │  accent                  │
│  message                │   │  display_order           │
│  status (enum)          │   │  is_active               │
│  notes                  │   │  created_at              │
│  created_at             │   └──────────────────────────┘
└─────────────────────────┘

┌─────────────────────────┐   ┌─────────────────────────┐
│    gallery_images       │   │    class_materials       │
│                         │   │                          │
│  id (PK)                │   │  id (PK)                 │
│  image_url              │   │  class_number (1-10)     │
│  caption                │   │  title, subject          │
│  span_class             │   │  description             │
│  display_order          │   │  file_url, file_name     │
│  is_active              │   │  uploaded_by (FK→users   │
│                          │   │       ON DELETE SET NULL)│
│  created_at             │   │  created_at, updated_at  │
└─────────────────────────┘   └──────────────────────────┘
```

### Full Table Definitions

#### `public.users`

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **Note**: The `ON DELETE CASCADE` ensures that if a Supabase Auth user is deleted, the corresponding `public.users` row is automatically removed.

**Why**: Bridges Supabase Auth with application roles. Auth provides authentication; this table provides authorization (role-based access).

#### `public.faculty_profiles`

Original CREATE TABLE (Sprint 8):

```sql
CREATE TABLE IF NOT EXISTS public.faculty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,                                       -- e.g., "Mathematics Teacher"
  bio TEXT,
  photo_url TEXT,
  assigned_class INTEGER NOT NULL CHECK (assigned_class BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Column added later (after Sprint 9):

```sql
ALTER TABLE public.faculty_profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
```

> **Note**: `is_active` was **not** part of the original Sprint 8 CREATE TABLE — it was added via a separate ALTER TABLE migration. The final schema includes it, but be aware of this if restoring from individual migration files.

**Why**: Extended profile for faculty portal users. `assigned_class` determines which class materials they can manage. `is_active` controls portal access without deleting the account.

#### `public.admission_enquiries`

```sql
CREATE TABLE public.admission_enquiries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  student_name text NOT NULL,
  grade text NOT NULL,                                      -- "Nursery" to "Class 10"
  message text,
  status text NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Contacted', 'Visit Scheduled', 'Enrolled', 'Rejected')),
  notes text,                                               -- Internal admin notes
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
```

**Why**: Captures admission interest from the public website. Status workflow tracks leads from initial enquiry to enrollment/rejection.

#### `public.faculty_members`

```sql
CREATE TABLE public.faculty_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,                                       -- e.g., "Principal", "Science Teacher"
  bio text,
  photo_url text,                                           -- URL from faculty-photos bucket
  initials text,                                            -- Fallback when no photo
  accent text,                                              -- CSS color for avatar background
  display_order integer NOT NULL DEFAULT 0,                 -- Controls sort order on public pages
  is_active boolean NOT NULL DEFAULT true,                  -- Show/hide on public pages
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
```

**Why**: Public-facing faculty roster displayed on Academics and Students pages. Separate from `faculty_profiles` — this is managed by admin; `faculty_profiles` is tied to auth users.

#### `public.gallery_images`

```sql
CREATE TABLE public.gallery_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  image_url text NOT NULL,                                  -- URL from gallery-images bucket
  caption text NOT NULL,
  span_class text,                                          -- CSS class for grid span size
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
```

**Why**: Dynamic photo/video gallery managed through admin panel. `span_class` allows varied grid layouts. `is_active` allows hiding without deleting.

#### `public.class_materials`

Original CREATE TABLE (Sprint 5):

```sql
CREATE TABLE IF NOT EXISTS public.class_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_number INTEGER NOT NULL CHECK (class_number BETWEEN 1 AND 10),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,                                    -- From predefined subjects list
  description TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL,                                   -- URL from class-materials bucket
  file_name TEXT NOT NULL,                                  -- Original filename
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Column added in Sprint 8:

```sql
ALTER TABLE public.class_materials
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
```

> **Note**: `uploaded_by` was **not** part of the original Sprint 5 CREATE TABLE — it was added via ALTER TABLE in Sprint 8 when the faculty portal was introduced.

**Why**: Study materials (PDFs, documents) organized by class and subject. Both admins and faculty can upload. `uploaded_by` tracks ownership for faculty delete permissions.

### Current Final Table Rebuild SQL

This block reflects the **current live schema** verified from Supabase introspection output. It recreates the public tables and table constraints in dependency order. For a complete rebuild including RLS policies, functions, triggers, storage buckets, and storage policies, use `supabase/full-setup.sql`.

```sql
CREATE TABLE IF NOT EXISTS public.admission_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Contacted', 'Visit Scheduled', 'Enrolled', 'Rejected')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faculty_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  initials TEXT,
  accent TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  span_class TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faculty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  assigned_class INTEGER NOT NULL CHECK (assigned_class BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.class_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_number INTEGER NOT NULL CHECK (class_number BETWEEN 1 AND 10),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);
```

### Database Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `public.is_admin()` | `boolean` | Checks if current auth user has `role = 'admin'` in `users` table. Used in RLS policies. |
| `public.is_faculty()` | `boolean` | Checks if current auth user has `role = 'faculty'` in `users` table. Used in RLS policies. |
| `public.get_faculty_assigned_class()` | `integer` | Returns the `assigned_class` from `faculty_profiles` for the current auth user. Used in RLS to restrict faculty to their assigned class. |
| `public.handle_new_auth_user()` | `trigger` | Auto-creates `users` row when `auth.users` row is inserted. Reads role from `raw_user_meta_data`. |

---

## 10. Row Level Security (RLS) Policies

> All tables have RLS **enabled**. Policies control who can read/write what.

### `admission_enquiries`

| Policy | Operation | Role | Condition |
|--------|-----------|------|-----------|
| Anyone can submit admission enquiries | INSERT | `anon`, `authenticated` | `true` (anyone can submit) |
| Admins can read admission enquiries | SELECT | `authenticated` | `is_admin()` |
| Admins can update admission enquiries | UPDATE | `authenticated` | `is_admin()` |

### `faculty_members`

| Policy | Operation | Role | Condition |
|--------|-----------|------|-----------|
| Public read faculty members | SELECT | `anon`, `authenticated` | `is_active = true` |
| Admins can read all faculty members | SELECT | `authenticated` | `is_admin()` (includes inactive) |
| Admins can insert faculty members | INSERT | `authenticated` | `is_admin()` |
| Admins can update faculty members | UPDATE | `authenticated` | `is_admin()` |
| Admins can delete faculty members | DELETE | `authenticated` | `is_admin()` |

### `gallery_images`

| Policy | Operation | Role | Condition |
|--------|-----------|------|-----------|
| Public read gallery images | SELECT | `anon`, `authenticated` | `is_active = true` |
| Admins can read all gallery images | SELECT | `authenticated` | `is_admin()` |
| Admins can insert gallery images | INSERT | `authenticated` | `is_admin()` |
| Admins can update gallery images | UPDATE | `authenticated` | `is_admin()` |
| Admins can delete gallery images | DELETE | `authenticated` | `is_admin()` |

### `class_materials`

| Policy | Operation | Role | Condition |
|--------|-----------|------|-----------|
| Public read class materials | SELECT | `anon`, `authenticated` | `true` |
| Admins can insert class materials | INSERT | `authenticated` | `is_admin()` |
| Admins can update class materials | UPDATE | `authenticated` | `is_admin()` |
| Admins can delete class materials | DELETE | `authenticated` | `is_admin()` |
| Faculty can insert for assigned class | INSERT | `authenticated` | `is_faculty() AND class_number = get_faculty_assigned_class() AND uploaded_by = auth.uid()` |
| Faculty can delete own materials | DELETE | `authenticated` | `is_faculty() AND uploaded_by = auth.uid() AND class_number = get_faculty_assigned_class()` |

### `faculty_profiles`

| Policy | Operation | Role | Condition |
|--------|-----------|------|-----------|
| Faculty can read own profile | SELECT | `authenticated` | `user_id = auth.uid() AND is_faculty()` |
| Admins can read all faculty profiles | SELECT | `authenticated` | `is_admin()` |
| Admins can insert faculty profiles | INSERT | `authenticated` | `is_admin()` |
| Admins can update faculty profiles | UPDATE | `authenticated` | `is_admin()` |
| Admins can delete faculty profiles | DELETE | `authenticated` | `is_admin()` |

### `users`

| Policy | Operation | Role | Condition |
|--------|-----------|------|-----------|
| Users can read own profile | SELECT | `authenticated` | `auth.uid() = id` |

> **Note**: This is the only RLS policy on the `users` table. Users can only read their own row. Write operations to `users` are handled either by the `handle_new_auth_user()` trigger (on INSERT) or by server functions using the service role key (which bypasses RLS).

---

## 11. Storage Buckets

| Bucket | Public Read | Write Access | Purpose |
|--------|------------|--------------|---------|
| `faculty-photos` | ✅ Yes | Admin only | Faculty roster photos |
| `gallery-images` | ✅ Yes | Admin only | Gallery photos/videos |
| `class-materials` | ✅ Yes | Admin + Faculty | Study materials (PDFs, docs) |

### Storage RLS Policies

#### `faculty-photos`
- Public read for all
- Admin insert, update, delete

#### `gallery-images`
- Public read for all
- Admin insert, update, delete

#### `class-materials`
- Public read for all
- Admin insert, update, delete
- Faculty insert (path must start with `auth.uid()/`)
- Faculty delete own (path matches `auth.uid()/` OR exists in `class_materials` with matching `uploaded_by`)

---

## 12. Database Migrations

Migrations are in `supabase/migrations/` and are applied in order:

| # | File | Sprint | What It Does |
|---|------|--------|-------------|
| 1 | `20260615000000_sprint5_schema.sql` | Sprint 5 | Creates core tables (`admission_enquiries`, `faculty_members`, `gallery_images`, `class_materials`), public read RLS policies, storage buckets with public read + authenticated write |
| 2 | `20260615100000_sprint6_auth.sql` | Sprint 6 | Creates `users` table with role enum, links to `auth.users` with `ON DELETE CASCADE`, adds "Users can read own profile" RLS policy |
| 3 | `20260615200000_sprint7_admin.sql` | Sprint 7 | Adds `status`/`notes` to enquiries, creates `is_admin()` function, admin RLS for all tables and storage |
| 4 | `20260615300000_sprint8_faculty.sql` | Sprint 8 | Creates `faculty_profiles` table, `is_faculty()` + `get_faculty_assigned_class()` functions, adds `uploaded_by` to `class_materials`, faculty RLS for materials |
| 5 | `20260615400000_sprint9_auth_trigger_storage.sql` | Sprint 9 | Creates `handle_new_auth_user()` trigger, tightens faculty storage policies (path-based ownership) |
| 6 | `20260616100000_faculty_profiles_is_active.sql` | Patch | Adds `is_active` column to `faculty_profiles` |

### How to Apply Migrations

```bash
# Via npm script (uses scripts/apply-migrations.mjs with pg)
npm run supabase:migrate

# Or via Supabase CLI
npx supabase db push
```

---

## 13. Design System & Styling

### CSS Architecture

The design system is defined in `src/styles.css` using **Tailwind CSS v4** `@theme` tokens:

```css
@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";
```

### Color Palette

| Token | Light Mode | Purpose |
|-------|-----------|---------|
| `--primary` | `oklch(0.42 0.13 160)` | Emerald green — Islamic heritage |
| `--primary-glow` | `oklch(0.55 0.15 158)` | Lighter emerald for gradients |
| `--gold` | `oklch(0.76 0.14 80)` | Warm gold accent |
| `--background` | `oklch(0.99 0.005 95)` | Off-white page background |
| `--foreground` | `oklch(0.18 0.03 160)` | Dark text |
| `--card` | `oklch(1 0 0)` | Pure white cards |
| `--muted-foreground` | `oklch(0.48 0.03 160)` | Subdued text |
| `--destructive` | `oklch(0.55 0.22 25)` | Red for errors/delete |

### Typography

| Token | Font | Usage |
|-------|------|-------|
| `--font-display` | Playfair Display, Georgia, serif | Headings (h1–h4) |
| `--font-sans` | Inter, system-ui, sans-serif | Body text |

### Custom Utilities

| Utility | What It Does |
|---------|-------------|
| `text-gradient-primary` | Gradient text clip (emerald) |
| `bg-gradient-hero` | Hero section gradient background |
| `shadow-elegant` | Premium elevated shadow with primary tint |
| `shadow-soft` | Subtle soft shadow |
| `shadow-gold` | Gold-tinted glow shadow |
| `pattern-islamic` | Radial dot pattern overlay (Islamic geometric) |

### Dark Mode

Full dark mode support via `.dark` class with all tokens redefined for dark backgrounds.

---

## 14. Build & Deployment

### NPM Scripts

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build via Vite (SSR + client bundles) |
| `npm run build:dev` | Development build (unminified) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

### Build Configuration (`vite.config.ts`)

- Uses `@lovable.dev/vite-tanstack-config` which bundles: TanStack Start, Vite React, Tailwind CSS, tsconfig paths, Nitro (Cloudflare target), and component tagger.
- **Manual chunks** for optimized code splitting:
  - `framer-motion` → separate chunk (large animation library)
  - `@radix-ui` → separate chunk (UI primitives)
  - `@tanstack/react-query` + `@tanstack/react-router` → `tanstack` chunk
  - `@supabase` → `supabase` chunk
- Custom server entry: `src/server.ts` (SSR error wrapper)

### Server Runtime

**Nitro** compiles the app for deployment targets. Default target is **Cloudflare Workers** (configured by `@lovable.dev/vite-tanstack-config`). The server entry (`src/server.ts`) wraps the TanStack Start handler with error recovery:

- Catches catastrophic SSR errors (h3 swallowed 500s)
- Returns a static error page HTML instead of JSON error
- Preserves the original error for logging

---

## 15. Scripts & Setup

### `scripts/apply-migrations.mjs`

Connects to Postgres using `DATABASE_URL` or constructed from Supabase URL, then applies all `.sql` files from `supabase/migrations/` in alphabetical order.

### `scripts/setup-supabase.mjs`

Seeds the project:
1. Creates storage buckets (`gallery`, `faculty-photos`, `class-materials`) with public access
2. Creates dev seed accounts (admin + faculty)
3. Writes `.env` file with project credentials

### Full Setup Flow

```bash
# 1. Clone repo
git clone <repo-url> && cd HS_Web

# 2. Install dependencies
bun install  # or npm install

# 3. Create Supabase project at supabase.com

# 4. Link to Supabase
npx supabase login && npx supabase link --project-ref <ref>

# 5. Apply migrations
npm run supabase:migrate

# 6. Seed dev data
npm run supabase:seed

# 7. Copy .env.example → .env and fill in keys

# 8. Start dev server
npm run dev
```

---

## 16. Data Flow Diagrams

### Public Admission Enquiry Flow

```
Visitor fills form on /admissions
    │
    ▼
react-hook-form + Zod validation
    │
    ▼
submitAdmissionEnquiry(data)
    │
    ▼
supabase.from('admission_enquiries').insert(data)
    │ (RLS: anon INSERT allowed)
    ▼
Row created with status='New'
    │
    ▼
Admin sees new lead on /admin/admissions
    │
    ▼
Admin updates status: New → Contacted → Visit Scheduled → Enrolled/Rejected
```

### Faculty Portal Materials Flow

```
Admin creates faculty account on /admin/faculty-accounts
    │
    ▼
Server function → supabase.auth.admin.createUser()
    │ + INSERT into faculty_profiles (assigned_class=N)
    ▼
Auth trigger → INSERT into public.users (role='faculty')
    │
    ▼
Faculty logs in at /admin/login (selects Faculty role)
    │
    ▼
Faculty portal: /faculty/portal/materials
    │ sees materials for assigned class N only
    ▼
Faculty uploads material
    │ file → class-materials bucket (path: userId/filename)
    │ metadata → class_materials table (class_number=N, uploaded_by=userId)
    ▼
Material visible on public /students page
```

### Gallery Image Management Flow

```
Admin visits /admin/gallery
    │
    ▼
Admin uploads image/video
    │ file → gallery-images storage bucket
    │ metadata → gallery_images table
    ▼
Image appears on public /gallery page
    │ (filtered by is_active=true, ordered by display_order)
    ▼
Admin can reorder, toggle visibility, or delete
```

---

## 17. Troubleshooting Guide

### Common Issues & Fixes

#### ❌ "Failed to fetch" or blank pages

**Cause**: Missing or invalid Supabase environment variables.

**Fix**:
1. Check `.env` has all 3 variables filled in correctly
2. Verify `VITE_SUPABASE_URL` starts with `https://`
3. Restart dev server after changing `.env`

#### ❌ Admin login works but shows "Unauthorized"

**Cause**: User exists in `auth.users` but not in `public.users`, or has wrong role.

**Fix**:
1. Check if the `on_auth_user_created` trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. If missing, re-run migration `20260615400000_sprint9_auth_trigger_storage.sql`
3. Manually insert into `users` table if needed:
   ```sql
   INSERT INTO public.users (id, email, role) VALUES ('<auth-user-id>', '<email>', 'admin');
   ```

#### ❌ Faculty can't upload materials

**Cause**: Missing `faculty_profiles` entry, wrong `assigned_class`, or `is_active = false`.

**Fix**:
1. Check faculty profile exists:
   ```sql
   SELECT * FROM faculty_profiles WHERE user_id = '<user-id>';
   ```
2. Verify `is_active = true`
3. Verify the class they're uploading to matches `assigned_class`
4. Check storage RLS: faculty upload path must be `<user-id>/<filename>`

#### ❌ Images not loading on gallery/faculty pages

**Cause**: Storage bucket not public, or bucket doesn't exist.

**Fix**:
1. In Supabase Dashboard → Storage, verify buckets exist:
   - `faculty-photos` (public: true)
   - `gallery-images` (public: true)
   - `class-materials` (public: true)
2. If missing, run `npm run supabase:seed` or create manually
3. Check storage RLS policies exist (see Section 11)

#### ❌ SSR Error: "h3 swallowed SSR error"

**Cause**: Server-side rendering crash, often from missing server env vars.

**Fix**:
1. Check server logs for the original error
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set (server-only, no `VITE_` prefix)
3. Check `src/lib/config.server.ts` — it throws if env vars are missing

#### ❌ Routes not found / 404 on valid URLs

**Cause**: `routeTree.gen.ts` is out of date.

**Fix**:
1. Restart the dev server — the TanStack Router plugin regenerates `routeTree.gen.ts` automatically
2. If still broken, delete `routeTree.gen.ts` and restart

#### ❌ Faculty portal shows "No access"

**Cause**: `faculty_profiles.is_active` is `false` for the user.

**Fix**:
```sql
UPDATE faculty_profiles SET is_active = true WHERE user_id = '<user-id>';
```
Or toggle via Admin Panel → Faculty Accounts.

#### ❌ Build fails with duplicate plugin errors

**Cause**: Manually adding plugins already included by `@lovable.dev/vite-tanstack-config`.

**Fix**: Do NOT add `tailwindcss`, `viteReact`, `tanstackStart`, or `tsConfigPaths` to `vite.config.ts` — they're already included by the config preset. See the comment at the top of the file.

### How to Reset Everything

```bash
# 1. Drop all tables and recreate
npm run supabase:migrate

# 2. Reseed dev accounts and storage
npm run supabase:seed

# 3. Clear browser storage
# In browser DevTools → Application → Clear site data

# 4. Restart dev server
npm run dev
```

---

## 18. Known Configuration & Gotchas

1. **`routeTree.gen.ts` is auto-generated** — Never edit it manually. It's regenerated by `@tanstack/router-plugin` on dev server start and build.

2. **Two separate "faculty" concepts**:
   - `faculty_members` = Public-facing roster (managed by admin, displayed on website)
   - `faculty_profiles` = Portal login accounts (linked to `auth.users`, have `assigned_class`)
   - These are **independent tables** — a person can exist in one but not the other.

3. **Social links are commented out** in `Footer.tsx` — The Facebook and Instagram icon links are wrapped in `{/* ... */}`. To re-enable, remove the JSX comment wrapper.

4. **Homepage faculty preview prioritizes leadership roles** — `FacultyPreview.tsx` shows Principal, Vice Principal — Academics, Director — Islamic Studies, and Director — Administration first when those roles exist in `faculty_members`, then fills remaining slots with other active faculty.

5. **`/islamic-education` renders its own page** — The route renders `IslamicEducationShowcase.tsx` directly.

6. **Contact form is a mock** — The `/contact` page's contact form does `console.log` and `setTimeout` — it does NOT save to Supabase. Only the `/admissions` form saves data.

7. **`SUPABASE_SERVICE_ROLE_KEY` is required for faculty account management** — Without it, the admin cannot create, activate, or deactivate faculty portal accounts. The key is server-only and never exposed to the browser.

8. **Storage file paths matter for faculty RLS** — Faculty can only delete storage objects where the path starts with their `auth.uid()`. The upload service enforces this by prefixing paths with the user ID.

9. **Gallery supports videos** — The gallery component checks `isGalleryVideoUrl()` and renders `<video>` tags for video URLs.

10. **Class materials subjects are hardcoded** — The subjects list (Mathematics, Science, English, Urdu, Hindi, Social Studies, Arabic, Islamic Studies, Computer Science, General Knowledge) is defined in `src/lib/class-materials.ts`, not in the database.

11. **Dark mode is supported** — CSS tokens exist for `.dark` class but there's no UI toggle currently visible. The `next-themes` package is installed.

12. **Admin login page serves both roles** — `/admin/login` has a radio group to select Admin or Faculty role before signing in. Both roles authenticate through the same page.

---

> **This document should be updated whenever significant architectural changes are made to the website.**
