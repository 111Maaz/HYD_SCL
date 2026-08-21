-- ERP foundation captured from consolidated platform SQL (master doc v3.0).
-- Versioned for Rule 6 — migrations-only replay.
-- Excludes: import_jobs/import_rows (app schema in 202608208), legacy CMS RLS (sprint 5–9 + 202608200+).
-- Run after CMS migrations 20260615000000–20260616100000, before 20260820000000.

begin;

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

create type public.academic_year_status as enum (
  'PLANNING',
  'ACTIVE',
  'CLOSED',
  'ARCHIVED'
);

create type public.student_status as enum (
  'ACTIVE',
  'WITHDRAWN',
  'TRANSFERRED',
  'GRADUATED',
  'ARCHIVED'
);

create type public.enrollment_status as enum (
  'ACTIVE',
  'PROMOTED',
  'REPEATED',
  'TRANSFERRED',
  'WITHDRAWN',
  'COMPLETED'
);

create type public.calendar_event_type as enum (
  'WORKING_DAY',
  'HOLIDAY',
  'SPECIAL_WORKING_DAY',
  'EXAM',
  'EVENT',
  'SCHOOL_CLOSURE'
);

create type public.attendance_status as enum (
  'PRESENT',
  'ABSENT',
  'LATE',
  'LEAVE',
  'HALF_DAY',
  'EXCUSED'
);

create type public.fee_charge_type as enum (
  'REGULAR',
  'ONE_TIME',
  'ADJUSTMENT',
  'CONCESSION'
);

create type public.payment_method as enum (
  'CASH',
  'UPI',
  'BANK_TRANSFER',
  'CHEQUE',
  'OTHER'
);

create type public.staff_status as enum (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'LEFT'
);

create type public.scope_type as enum (
  'SCHOOL',
  'CLASS',
  'SECTION'
);

create type public.import_status as enum (
  'UPLOADED',
  'VALIDATING',
  'VALIDATED',
  'FAILED',
  'APPROVED',
  'IMPORTED',
  'CANCELLED'
);

create type public.audit_action as enum (
  'INSERT',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'IMPORT',
  'EXPORT',
  'APPROVE',
  'REJECT',
  'ASSIGN',
  'UNASSIGN',
  'OTHER'
);

-- ============================================================
-- 2. SCHOOL CONFIGURATION
-- ============================================================

create table public.school_config (
  id uuid primary key default gen_random_uuid(),

  school_code text not null unique,
  school_name text not null,

  logo_url text,
  favicon_url text,

  address text,
  city text,
  state text,
  postal_code text,

  phone text,
  email text,
  website text,

  timezone text not null default 'Asia/Kolkata',

  academic_year_start_month smallint
    check (academic_year_start_month between 1 and 12),

  academic_year_end_month smallint
    check (academic_year_end_month between 1 and 12),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. MODULE CONFIGURATION
-- ============================================================

create table public.school_modules (
  id uuid primary key default gen_random_uuid(),

  module_key text not null unique,
  module_name text not null,

  enabled boolean not null default true,

  settings jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. ACADEMIC YEARS
-- ============================================================

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  start_date date not null,
  end_date date not null,

  status public.academic_year_status not null default 'PLANNING',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint academic_year_dates_valid
    check (end_date > start_date),

  constraint academic_year_name_unique
    unique (name)
);

-- ============================================================
-- 5. MASTER CLASS LIST
-- ============================================================

create table public.classes (
  id uuid primary key default gen_random_uuid(),

  class_code text not null unique,
  class_name text not null,

  display_order integer not null,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint class_display_order_positive
    check (display_order > 0)
);

-- ============================================================
-- 6. CLASS FOR A PARTICULAR ACADEMIC YEAR
-- ============================================================

create table public.class_years (
  id uuid primary key default gen_random_uuid(),

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  class_id uuid not null
    references public.classes(id)
    on delete restrict,

  expected_student_count integer not null default 0
    check (expected_student_count >= 0),

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (academic_year_id, class_id)
);

-- ============================================================
-- 7. SECTIONS
-- ============================================================

create table public.sections (
  id uuid primary key default gen_random_uuid(),

  class_year_id uuid not null
    references public.class_years(id)
    on delete restrict,

  section_name text not null,

  capacity integer
    check (capacity is null or capacity > 0),

  display_order integer not null default 1,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (class_year_id, section_name),

  unique (id, class_year_id)
);

-- ============================================================
-- 8. STUDENTS
-- ============================================================

create table public.students (
  id uuid primary key default gen_random_uuid(),

  student_number text not null unique,

  first_name text not null,
  middle_name text,
  last_name text,

  date_of_birth date,

  gender text,

  phone text,
  email text,

  address text,

  admission_date date,

  status public.student_status not null default 'ACTIVE',

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 9. PARENTS / GUARDIANS
-- ============================================================

create table public.guardians (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid unique
    references auth.users(id)
    on delete set null,

  first_name text not null,
  last_name text,

  relationship text,

  phone text,
  email text,

  address text,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_guardians (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  guardian_id uuid not null
    references public.guardians(id)
    on delete restrict,

  is_primary boolean not null default false,

  can_view_attendance boolean not null default true,
  can_view_fees boolean not null default true,
  can_view_academic_data boolean not null default true,

  created_at timestamptz not null default now(),

  unique (student_id, guardian_id)
);

-- ============================================================
-- 10. NEW ERP STAFF PROFILES
-- ============================================================

create table public.staff_profiles (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid not null unique
    references auth.users(id)
    on delete restrict,

  employee_number text unique,

  first_name text not null,
  last_name text,

  phone text,
  email text,

  designation text,

  status public.staff_status not null default 'ACTIVE',

  joined_date date,
  leaving_date date,

  -- Existing website-compatible fields
  bio text,
  photo_url text,
  initials text,
  accent text,
  display_order integer not null default 0,
  is_public boolean not null default false,

  -- Existing faculty portal compatibility
  assigned_class integer
    check (assigned_class is null or assigned_class between 1 and 10),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 11. ROLES
-- ============================================================

create table public.roles (
  id uuid primary key default gen_random_uuid(),

  role_key text not null unique,
  role_name text not null,

  description text,

  system_role boolean not null default false,

  created_at timestamptz not null default now()
);

insert into public.roles
(role_key, role_name, description, system_role)
values
(
  'PRINCIPAL',
  'Principal / Owner',
  'Full school-level administrative authority',
  true
),
(
  'VICE_PRINCIPAL',
  'Vice Principal',
  'Administrative authority assigned by principal',
  true
),
(
  'ACADEMIC_INCHARGE',
  'Academic Incharge',
  'Manages academic structure and enrollment operations',
  true
),
(
  'ATTENDANCE_INCHARGE',
  'Attendance Incharge',
  'Manages attendance operations',
  true
),
(
  'FEES_INCHARGE',
  'Fees Incharge',
  'Manages fee records and collections',
  true
),
(
  'OPERATIONS_INCHARGE',
  'Operations Incharge',
  'Manages assigned operational workflows',
  true
),
(
  'TEACHER',
  'Teacher',
  'Takes attendance and performs assigned teaching operations',
  true
),
(
  'STAFF',
  'Staff',
  'General staff account',
  true
);

-- ============================================================
-- 12. PERMISSIONS
-- ============================================================

create table public.permissions (
  id uuid primary key default gen_random_uuid(),

  permission_key text not null unique,
  permission_name text not null,

  description text,

  created_at timestamptz not null default now()
);

insert into public.permissions
(permission_key, permission_name, description)
values
('students.view', 'View Students', 'View student records'),
('students.create', 'Create Students', 'Create student records'),
('students.update', 'Update Students', 'Modify student records'),
('students.archive', 'Archive Students', 'Archive student records'),

('academic.view', 'View Academic Structure', 'View classes and sections'),
('academic.manage', 'Manage Academic Structure', 'Create/change classes, sections and capacities'),

('enrollment.view', 'View Enrollment', 'View enrollment records'),
('enrollment.manage', 'Manage Enrollment', 'Create and modify enrollment records'),
('enrollment.promote', 'Promote Students', 'Perform academic year promotion'),

('attendance.view', 'View Attendance', 'View attendance'),
('attendance.mark', 'Mark Attendance', 'Mark student attendance'),
('attendance.correct', 'Correct Attendance', 'Correct existing attendance'),
('attendance.manage', 'Manage Attendance', 'Manage attendance operations'),

('fees.view', 'View Fees', 'View fee information'),
('fees.manage', 'Manage Fees', 'Manage fee charges'),
('fees.record_payment', 'Record Fee Payment', 'Record manual fee payment'),
('fees.correct', 'Correct Fee Records', 'Correct fee records'),

('staff.view', 'View Staff', 'View staff'),
('staff.manage', 'Manage Staff', 'Manage staff accounts'),

('roles.view', 'View Roles', 'View roles'),
('roles.manage', 'Manage Roles', 'Manage roles and assignments'),

('calendar.view', 'View Calendar', 'View school calendar'),
('calendar.manage', 'Manage Calendar', 'Manage calendar'),

('reports.view', 'View Reports', 'View reports'),

('audit.view', 'View Audit Logs', 'View audit history'),

('migration.view', 'View Imports', 'View import jobs'),
('migration.manage', 'Manage Imports', 'Manage data migration/imports'),

('admissions.view', 'View Admissions', 'View admission enquiries'),
('admissions.manage', 'Manage Admissions', 'Manage admission enquiries and workflow'),

('website.manage', 'Manage Website Content', 'Manage public website content'),

('faculty.manage', 'Manage Faculty Content', 'Manage faculty-facing website content'),

('materials.manage', 'Manage Class Materials', 'Manage class materials')
;

-- ============================================================
-- 13. ROLE → PERMISSION
-- ============================================================

create table public.role_permissions (
  role_id uuid not null
    references public.roles(id)
    on delete cascade,

  permission_id uuid not null
    references public.permissions(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  primary key (role_id, permission_id)
);

-- Principal
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.role_key = 'PRINCIPAL';

-- Vice Principal
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'students.create',
    'students.update',
    'academic.view',
    'academic.manage',
    'enrollment.view',
    'enrollment.manage',
    'enrollment.promote',
    'attendance.view',
    'attendance.manage',
    'fees.view',
    'staff.view',
    'calendar.view',
    'calendar.manage',
    'reports.view',
    'audit.view',
    'admissions.view',
    'admissions.manage'
  )
where r.role_key = 'VICE_PRINCIPAL';

-- Academic Incharge
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'students.create',
    'students.update',
    'academic.view',
    'academic.manage',
    'enrollment.view',
    'enrollment.manage',
    'enrollment.promote',
    'calendar.view',
    'reports.view',
    'admissions.view',
    'admissions.manage'
  )
where r.role_key = 'ACADEMIC_INCHARGE';

-- Attendance Incharge
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'enrollment.view',
    'attendance.view',
    'attendance.mark',
    'attendance.correct',
    'attendance.manage',
    'calendar.view',
    'reports.view'
  )
where r.role_key = 'ATTENDANCE_INCHARGE';

-- Fees Incharge
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'enrollment.view',
    'fees.view',
    'fees.manage',
    'fees.record_payment',
    'fees.correct',
    'reports.view'
  )
where r.role_key = 'FEES_INCHARGE';

-- Operations Incharge
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'enrollment.view',
    'calendar.view',
    'calendar.manage',
    'reports.view',
    'admissions.view',
    'admissions.manage'
  )
where r.role_key = 'OPERATIONS_INCHARGE';

-- Teacher
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'enrollment.view',
    'attendance.view',
    'attendance.mark',
    'calendar.view',
    'materials.manage'
  )
where r.role_key = 'TEACHER';

-- General staff
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'calendar.view'
  )
where r.role_key = 'STAFF';

-- ============================================================
-- 14. STAFF ROLE ASSIGNMENTS
-- ============================================================

create table public.staff_roles (
  id uuid primary key default gen_random_uuid(),

  staff_id uuid not null
    references public.staff_profiles(id)
    on delete cascade,

  role_id uuid not null
    references public.roles(id)
    on delete restrict,

  starts_at timestamptz not null default now(),
  ends_at timestamptz,

  active boolean not null default true,

  created_at timestamptz not null default now(),

  constraint staff_role_dates_valid
    check (ends_at is null or ends_at > starts_at)
);

-- ============================================================
-- 15. STAFF SCOPES
-- ============================================================

create table public.staff_scopes (
  id uuid primary key default gen_random_uuid(),

  staff_role_id uuid not null
    references public.staff_roles(id)
    on delete cascade,

  scope_type public.scope_type not null,

  class_id uuid
    references public.classes(id)
    on delete restrict,

  section_id uuid
    references public.sections(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  constraint valid_scope_definition check (
    (scope_type = 'SCHOOL'
      and class_id is null
      and section_id is null)

    or

    (scope_type = 'CLASS'
      and class_id is not null
      and section_id is null)

    or

    (scope_type = 'SECTION'
      and section_id is not null)
  )
);

-- ============================================================
-- 16. ENROLLMENTS
-- ============================================================

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  class_year_id uuid not null
    references public.class_years(id)
    on delete restrict,

  section_id uuid not null,

  roll_number integer,

  status public.enrollment_status not null default 'ACTIVE',

  enrollment_date date not null default current_date,

  leaving_date date,

  previous_enrollment_id uuid
    references public.enrollments(id)
    on delete restrict,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint enrollment_section_matches_class_year
    foreign key (section_id, class_year_id)
    references public.sections(id, class_year_id)
    on delete restrict,

  constraint roll_number_positive
    check (roll_number is null or roll_number > 0)
);

create unique index one_active_enrollment_per_student_year
on public.enrollments(student_id, academic_year_id)
where status = 'ACTIVE';

create unique index unique_active_roll_number
on public.enrollments(academic_year_id, section_id, roll_number)
where status = 'ACTIVE'
  and roll_number is not null;

-- ============================================================
-- 17. CALENDAR
-- ============================================================

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  event_date date not null,

  event_type public.calendar_event_type not null,

  title text not null,

  description text,

  applies_to_all boolean not null default true,

  class_id uuid
    references public.classes(id)
    on delete restrict,

  section_id uuid
    references public.sections(id)
    on delete restrict,

  is_attendance_day boolean not null default false,

  created_by uuid
    references public.staff_profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint calendar_scope_valid check (
    applies_to_all = true
    or class_id is not null
    or section_id is not null
  )
);

create index calendar_events_date_idx
on public.calendar_events(event_date);

create index calendar_events_year_idx
on public.calendar_events(academic_year_id);

-- ============================================================
-- 18. ATTENDANCE
-- ============================================================

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),

  enrollment_id uuid not null
    references public.enrollments(id)
    on delete restrict,

  attendance_date date not null,

  status public.attendance_status not null,

  remarks text,

  marked_by uuid
    references public.staff_profiles(id)
    on delete set null,

  marked_at timestamptz not null default now(),

  corrected_at timestamptz,

  corrected_by uuid
    references public.staff_profiles(id)
    on delete set null,

  correction_reason text,

  sync_client_id text,
  sync_version bigint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (enrollment_id, attendance_date)
);

create index attendance_date_idx
on public.attendance_records(attendance_date);

create index attendance_enrollment_idx
on public.attendance_records(enrollment_id);

-- ============================================================
-- 19. FEE STRUCTURES
-- ============================================================

create table public.fee_structures (
  id uuid primary key default gen_random_uuid(),

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  class_year_id uuid
    references public.class_years(id)
    on delete restrict,

  fee_name text not null,

  amount numeric(12,2) not null
    check (amount >= 0),

  due_date date,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 20. STUDENT FEE CHARGES
-- ============================================================

create table public.fee_charges (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  fee_structure_id uuid
    references public.fee_structures(id)
    on delete restrict,

  charge_type public.fee_charge_type not null default 'REGULAR',

  description text not null,

  amount numeric(12,2) not null
    check (amount >= 0),

  concession_amount numeric(12,2) not null default 0
    check (concession_amount >= 0),

  due_date date,

  created_by uuid
    references public.staff_profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint concession_not_greater_than_amount
    check (concession_amount <= amount)
);

-- ============================================================
-- 21. FEE PAYMENTS
-- ============================================================

create table public.fee_payments (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  amount numeric(12,2) not null
    check (amount > 0),

  payment_date date not null default current_date,

  payment_method public.payment_method not null,

  reference_number text,

  receipt_number text unique,

  notes text,

  recorded_by uuid
    references public.staff_profiles(id)
    on delete set null,

  cancelled boolean not null default false,

  cancelled_at timestamptz,

  cancelled_by uuid
    references public.staff_profiles(id)
    on delete set null,

  cancellation_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fee_payments_student_idx
on public.fee_payments(student_id);

create index fee_payments_year_idx
on public.fee_payments(academic_year_id);

-- ============================================================
-- 23. AUDIT LOG
-- ============================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  actor_user_id uuid
    references auth.users(id)
    on delete set null,

  actor_staff_id uuid
    references public.staff_profiles(id)
    on delete set null,

  action public.audit_action not null,

  table_name text,

  record_id uuid,

  old_data jsonb,
  new_data jsonb,

  metadata jsonb not null default '{}'::jsonb,

  ip_address inet,

  user_agent text,

  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx
on public.audit_logs(actor_user_id);

create index audit_logs_table_record_idx
on public.audit_logs(table_name, record_id);

create index audit_logs_created_idx
on public.audit_logs(created_at);

-- ============================================================
-- 24. EXISTING WEBSITE AUTH USERS COMPATIBILITY
-- ============================================================
--
-- This table is retained because the existing website/faculty
-- portal already uses it.
--
-- The new ERP authorization model uses:
--
-- auth.users
--      ↓
-- staff_profiles
--      ↓
-- staff_roles
--      ↓
-- permissions
--
-- The old users table remains as a compatibility layer for the
-- existing application until the frontend is migrated.
-- ============================================================

-- create table public.users (
--   id uuid primary key
--     references auth.users(id)
--     on delete cascade,

--   email text not null unique,

--   role text not null
--     check (role = any (
--       array[
--         'admin'::text,
--         'faculty'::text
--       ]
--     )),

--   created_at timestamptz not null default now()
-- );

-- ============================================================
-- 25. EXISTING WEBSITE FACULTY DIRECTORY
-- ============================================================

-- create table public.faculty_members (
--   id uuid primary key default gen_random_uuid(),

--   name text not null,
--   role text not null,

--   bio text,

--   photo_url text,

--   initials text,

--   accent text,

--   display_order integer not null default 0,

--   is_active boolean not null default true,

--   created_at timestamptz not null default now()
-- );

-- ============================================================
-- 26. EXISTING FACULTY PORTAL PROFILE
-- ============================================================

-- create table public.faculty_profiles (
--   id uuid primary key default gen_random_uuid(),

--   user_id uuid not null unique
--     references public.users(id)
--     on delete cascade,

--   name text not null,

--   role text not null,

--   bio text,

--   photo_url text,

--   assigned_class integer not null
--     check (assigned_class between 1 and 10),

--   created_at timestamptz not null default now(),

--   updated_at timestamptz not null default now(),

--   is_active boolean not null default true
-- );

-- ============================================================
-- 27. EXISTING CLASS MATERIALS
-- ============================================================

-- create table public.class_materials (
--   id uuid primary key default gen_random_uuid(),

--   class_number integer not null
--     check (class_number >= 1 and class_number <= 10),

--   title text not null,

--   subject text not null,

--   description text not null default '',

--   file_url text not null,

--   file_name text not null,

--   created_at timestamptz not null default now(),

--   updated_at timestamptz not null default now(),

--   uploaded_by uuid
--     references public.users(id)
--     on delete set null
-- );

-- ============================================================
-- 28. EXISTING GALLERY
-- ============================================================

-- create table public.gallery_images (
--   id uuid primary key default gen_random_uuid(),

--   image_url text not null,

--   caption text not null,

--   span_class text,

--   display_order integer not null default 0,

--   is_active boolean not null default true,

--   created_at timestamptz not null default now()
-- );

-- ============================================================
-- 29. EXISTING ADMISSION ENQUIRIES
-- ============================================================

-- create table public.admission_enquiries (
--   id uuid primary key default gen_random_uuid(),

--   parent_name text not null,

--   email text not null,

--   phone text not null,

--   student_name text not null,

--   grade text not null,

--   message text,

--   created_at timestamptz not null default now(),

--   status text not null default 'New'
--     check (
--       status = any (
--         array[
--           'New'::text,
--           'Contacted'::text,
--           'Visit Scheduled'::text,
--           'Enrolled'::text,
--           'Rejected'::text
--         ]
--       )
--     ),

--   notes text
-- );

-- ============================================================
-- 30. GENERIC UPDATED-AT FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 31. UPDATED-AT TRIGGERS
-- ============================================================

create trigger set_updated_at_school_config
before update on public.school_config
for each row execute function public.set_updated_at();

create trigger set_updated_at_school_modules
before update on public.school_modules
for each row execute function public.set_updated_at();

create trigger set_updated_at_academic_years
before update on public.academic_years
for each row execute function public.set_updated_at();

create trigger set_updated_at_classes
before update on public.classes
for each row execute function public.set_updated_at();

create trigger set_updated_at_class_years
before update on public.class_years
for each row execute function public.set_updated_at();

create trigger set_updated_at_sections
before update on public.sections
for each row execute function public.set_updated_at();

create trigger set_updated_at_students
before update on public.students
for each row execute function public.set_updated_at();

create trigger set_updated_at_guardians
before update on public.guardians
for each row execute function public.set_updated_at();

create trigger set_updated_at_staff_profiles
before update on public.staff_profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at_enrollments
before update on public.enrollments
for each row execute function public.set_updated_at();

create trigger set_updated_at_calendar
before update on public.calendar_events
for each row execute function public.set_updated_at();

create trigger set_updated_at_attendance
before update on public.attendance_records
for each row execute function public.set_updated_at();

create trigger set_updated_at_fee_structures
before update on public.fee_structures
for each row execute function public.set_updated_at();

create trigger set_updated_at_fee_charges
before update on public.fee_charges
for each row execute function public.set_updated_at();

create trigger set_updated_at_fee_payments
before update on public.fee_payments
for each row execute function public.set_updated_at();

create trigger set_updated_at_import_jobs
before update on public.import_jobs
for each row execute function public.set_updated_at();

create trigger set_updated_at_faculty_profiles
before update on public.faculty_profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at_class_materials
before update on public.class_materials
for each row execute function public.set_updated_at();

-- ============================================================
-- 32. PERMISSION HELPER
-- ============================================================

create or replace function public.user_has_permission(
  requested_permission text
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    join public.staff_roles sr
      on sr.staff_id = sp.id
    join public.role_permissions rp
      on rp.role_id = sr.role_id
    join public.permissions p
      on p.id = rp.permission_id
    where sp.auth_user_id = auth.uid()
      and sp.status = 'ACTIVE'
      and sr.active = true
      and sr.starts_at <= now()
      and (
        sr.ends_at is null
        or sr.ends_at > now()
      )
      and p.permission_key = requested_permission
  );
$$;

-- ============================================================
-- 33. PRINCIPAL CHECK
-- ============================================================

create or replace function public.is_principal()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    join public.staff_roles sr
      on sr.staff_id = sp.id
    join public.roles r
      on r.id = sr.role_id
    where sp.auth_user_id = auth.uid()
      and sp.status = 'ACTIVE'
      and sr.active = true
      and r.role_key = 'PRINCIPAL'
      and sr.starts_at <= now()
      and (
        sr.ends_at is null
        or sr.ends_at > now()
      )
  );
$$;

-- ============================================================
-- 34. AUDIT FUNCTION
-- ============================================================

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_staff uuid;
  record_uuid uuid;
begin

  select id
  into actor_staff
  from public.staff_profiles
  where auth_user_id = auth.uid()
  limit 1;

  if tg_op = 'INSERT' then

    record_uuid := (to_jsonb(new)->>'id')::uuid;

    insert into public.audit_logs (
      actor_user_id,
      actor_staff_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    )
    values (
      auth.uid(),
      actor_staff,
      'INSERT',
      tg_table_name,
      record_uuid,
      null,
      to_jsonb(new)
    );

    return new;

  elsif tg_op = 'UPDATE' then

    record_uuid := (to_jsonb(new)->>'id')::uuid;

    insert into public.audit_logs (
      actor_user_id,
      actor_staff_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    )
    values (
      auth.uid(),
      actor_staff,
      'UPDATE',
      tg_table_name,
      record_uuid,
      to_jsonb(old),
      to_jsonb(new)
    );

    return new;

  elsif tg_op = 'DELETE' then

    record_uuid := (to_jsonb(old)->>'id')::uuid;

    insert into public.audit_logs (
      actor_user_id,
      actor_staff_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    )
    values (
      auth.uid(),
      actor_staff,
      'DELETE',
      tg_table_name,
      record_uuid,
      to_jsonb(old),
      null
    );

    return old;

  end if;

  return null;
end;
$$;

-- ============================================================
-- 35. AUDIT TRIGGERS
-- ============================================================

create trigger audit_students
after insert or update or delete on public.students
for each row execute function public.write_audit_log();

create trigger audit_guardians
after insert or update or delete on public.guardians
for each row execute function public.write_audit_log();

create trigger audit_student_guardians
after insert or update or delete on public.student_guardians
for each row execute function public.write_audit_log();

create trigger audit_staff
after insert or update or delete on public.staff_profiles
for each row execute function public.write_audit_log();

create trigger audit_enrollments
after insert or update or delete on public.enrollments
for each row execute function public.write_audit_log();

create trigger audit_attendance
after insert or update or delete on public.attendance_records
for each row execute function public.write_audit_log();

create trigger audit_fee_charges
after insert or update or delete on public.fee_charges
for each row execute function public.write_audit_log();

create trigger audit_fee_payments
after insert or update or delete on public.fee_payments
for each row execute function public.write_audit_log();

create trigger audit_staff_roles
after insert or update or delete on public.staff_roles
for each row execute function public.write_audit_log();

-- ============================================================
-- 36. ENABLE RLS — ERP TABLES
-- ============================================================

alter table public.school_config enable row level security;
alter table public.school_modules enable row level security;
alter table public.academic_years enable row level security;
alter table public.classes enable row level security;
alter table public.class_years enable row level security;
alter table public.sections enable row level security;
alter table public.students enable row level security;
alter table public.guardians enable row level security;
alter table public.student_guardians enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.staff_roles enable row level security;
alter table public.staff_scopes enable row level security;
alter table public.enrollments enable row level security;
alter table public.calendar_events enable row level security;
alter table public.attendance_records enable row level security;
alter table public.fee_structures enable row level security;
alter table public.fee_charges enable row level security;
alter table public.fee_payments enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;
alter table public.audit_logs enable row level security;

-- ============================================================
-- 37. ERP RLS POLICIES
-- ============================================================

create policy school_config_read
on public.school_config
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or public.is_principal()
);

create policy school_config_manage
on public.school_config
for all
to authenticated
using (public.is_principal())
with check (public.is_principal());

create policy school_modules_read
on public.school_modules
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or public.is_principal()
);

create policy school_modules_manage
on public.school_modules
for all
to authenticated
using (public.is_principal())
with check (public.is_principal());

create policy academic_years_read
on public.academic_years
for select
to authenticated
using (
  public.user_has_permission('academic.view')
);

create policy academic_years_manage
on public.academic_years
for all
to authenticated
using (public.user_has_permission('academic.manage'))
with check (public.user_has_permission('academic.manage'));

create policy classes_read
on public.classes
for select
to authenticated
using (
  public.user_has_permission('academic.view')
);

create policy classes_manage
on public.classes
for all
to authenticated
using (public.user_has_permission('academic.manage'))
with check (public.user_has_permission('academic.manage'));

create policy class_years_read
on public.class_years
for select
to authenticated
using (
  public.user_has_permission('academic.view')
);

create policy class_years_manage
on public.class_years
for all
to authenticated
using (public.user_has_permission('academic.manage'))
with check (public.user_has_permission('academic.manage'));

create policy sections_read
on public.sections
for select
to authenticated
using (
  public.user_has_permission('academic.view')
);

create policy sections_manage
on public.sections
for all
to authenticated
using (public.user_has_permission('academic.manage'))
with check (public.user_has_permission('academic.manage'));

create policy students_read
on public.students
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or exists (
    select 1
    from public.student_guardians sg
    join public.guardians g
      on g.id = sg.guardian_id
    where sg.student_id = students.id
      and g.auth_user_id = auth.uid()
      and g.active = true
  )
);

create policy students_insert
on public.students
for insert
to authenticated
with check (
  public.user_has_permission('students.create')
);

create policy students_update
on public.students
for update
to authenticated
using (
  public.user_has_permission('students.update')
)
with check (
  public.user_has_permission('students.update')
);

create policy guardians_read
on public.guardians
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or auth_user_id = auth.uid()
);

create policy guardians_manage
on public.guardians
for all
to authenticated
using (
  public.user_has_permission('students.update')
)
with check (
  public.user_has_permission('students.update')
);

create policy student_guardians_read
on public.student_guardians
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or exists (
    select 1
    from public.guardians g
    where g.id = student_guardians.guardian_id
      and g.auth_user_id = auth.uid()
  )
);

create policy student_guardians_manage
on public.student_guardians
for all
to authenticated
using (
  public.user_has_permission('students.update')
)
with check (
  public.user_has_permission('students.update')
);

create policy staff_profiles_read
on public.staff_profiles
for select
to authenticated
using (
  public.user_has_permission('staff.view')
  or auth_user_id = auth.uid()
);

create policy staff_profiles_manage
on public.staff_profiles
for all
to authenticated
using (
  public.user_has_permission('staff.manage')
)
with check (
  public.user_has_permission('staff.manage')
);

create policy roles_read
on public.roles
for select
to authenticated
using (
  public.user_has_permission('roles.view')
);

create policy roles_manage
on public.roles
for all
to authenticated
using (
  public.user_has_permission('roles.manage')
)
with check (
  public.user_has_permission('roles.manage')
);

create policy permissions_read
on public.permissions
for select
to authenticated
using (
  public.user_has_permission('roles.view')
);

create policy role_permissions_read
on public.role_permissions
for select
to authenticated
using (
  public.user_has_permission('roles.view')
);

create policy role_permissions_manage
on public.role_permissions
for all
to authenticated
using (
  public.user_has_permission('roles.manage')
)
with check (
  public.user_has_permission('roles.manage')
);

create policy staff_roles_read
on public.staff_roles
for select
to authenticated
using (
  public.user_has_permission('roles.view')
  or exists (
    select 1
    from public.staff_profiles sp
    where sp.id = staff_roles.staff_id
      and sp.auth_user_id = auth.uid()
  )
);

create policy staff_roles_manage
on public.staff_roles
for all
to authenticated
using (
  public.user_has_permission('roles.manage')
)
with check (
  public.user_has_permission('roles.manage')
);

create policy staff_scopes_read
on public.staff_scopes
for select
to authenticated
using (
  public.user_has_permission('roles.view')
);

create policy staff_scopes_manage
on public.staff_scopes
for all
to authenticated
using (
  public.user_has_permission('roles.manage')
)
with check (
  public.user_has_permission('roles.manage')
);

create policy enrollments_read
on public.enrollments
for select
to authenticated
using (
  public.user_has_permission('enrollment.view')
  or exists (
    select 1
    from public.student_guardians sg
    join public.guardians g
      on g.id = sg.guardian_id
    where sg.student_id = enrollments.student_id
      and g.auth_user_id = auth.uid()
      and g.active = true
  )
);

create policy enrollments_manage
on public.enrollments
for all
to authenticated
using (
  public.user_has_permission('enrollment.manage')
)
with check (
  public.user_has_permission('enrollment.manage')
);

create policy calendar_read
on public.calendar_events
for select
to authenticated
using (
  public.user_has_permission('calendar.view')
);

create policy calendar_manage
on public.calendar_events
for all
to authenticated
using (
  public.user_has_permission('calendar.manage')
)
with check (
  public.user_has_permission('calendar.manage')
);

create policy attendance_read
on public.attendance_records
for select
to authenticated
using (
  public.user_has_permission('attendance.view')
  or exists (
    select 1
    from public.enrollments e
    join public.student_guardians sg
      on sg.student_id = e.student_id
    join public.guardians g
      on g.id = sg.guardian_id
    where e.id = attendance_records.enrollment_id
      and g.auth_user_id = auth.uid()
      and g.active = true
      and sg.can_view_attendance = true
  )
);

create policy attendance_insert
on public.attendance_records
for insert
to authenticated
with check (
  public.user_has_permission('attendance.mark')
  or public.user_has_permission('attendance.manage')
);

create policy attendance_update
on public.attendance_records
for update
to authenticated
using (
  public.user_has_permission('attendance.correct')
  or public.user_has_permission('attendance.manage')
)
with check (
  public.user_has_permission('attendance.correct')
  or public.user_has_permission('attendance.manage')
);

create policy fee_structures_read
on public.fee_structures
for select
to authenticated
using (
  public.user_has_permission('fees.view')
);

create policy fee_structures_manage
on public.fee_structures
for all
to authenticated
using (
  public.user_has_permission('fees.manage')
)
with check (
  public.user_has_permission('fees.manage')
);

create policy fee_charges_read
on public.fee_charges
for select
to authenticated
using (
  public.user_has_permission('fees.view')
  or exists (
    select 1
    from public.student_guardians sg
    join public.guardians g
      on g.id = sg.guardian_id
    where sg.student_id = fee_charges.student_id
      and g.auth_user_id = auth.uid()
      and g.active = true
      and sg.can_view_fees = true
  )
);

create policy fee_charges_manage
on public.fee_charges
for all
to authenticated
using (
  public.user_has_permission('fees.manage')
)
with check (
  public.user_has_permission('fees.manage')
);

create policy fee_payments_read
on public.fee_payments
for select
to authenticated
using (
  public.user_has_permission('fees.view')
  or exists (
    select 1
    from public.student_guardians sg
    join public.guardians g
      on g.id = sg.guardian_id
    where sg.student_id = fee_payments.student_id
      and g.auth_user_id = auth.uid()
      and g.active = true
      and sg.can_view_fees = true
  )
);

create policy fee_payments_insert
on public.fee_payments
for insert
to authenticated
with check (
  public.user_has_permission('fees.record_payment')
);

create policy fee_payments_update
on public.fee_payments
for update
to authenticated
using (
  public.user_has_permission('fees.correct')
)
with check (
  public.user_has_permission('fees.correct')
);

create policy import_jobs_read
on public.import_jobs
for select
to authenticated
using (
  public.user_has_permission('migration.view')
);

create policy import_jobs_manage
on public.import_jobs
for all
to authenticated
using (
  public.user_has_permission('migration.manage')
)
with check (
  public.user_has_permission('migration.manage')
);

create policy import_rows_read
on public.import_rows
for select
to authenticated
using (
  public.user_has_permission('migration.view')
);

create policy import_rows_manage
on public.import_rows
for all
to authenticated
using (
  public.user_has_permission('migration.manage')
)
with check (
  public.user_has_permission('migration.manage')
);

create policy audit_read
on public.audit_logs
for select
to authenticated
using (
  public.user_has_permission('audit.view')
);

-- ============================================================
-- 39. INDEXES
-- ============================================================

create index enrollments_student_idx
on public.enrollments(student_id);

create index enrollments_class_year_idx
on public.enrollments(class_year_id);

create index enrollments_section_idx
on public.enrollments(section_id);

create index sections_class_year_idx
on public.sections(class_year_id);

create index staff_roles_staff_idx
on public.staff_roles(staff_id);

create index staff_scopes_role_idx
on public.staff_scopes(staff_role_id);

create index student_guardians_student_idx
on public.student_guardians(student_id);

create index student_guardians_guardian_idx
on public.student_guardians(guardian_id);

create index class_materials_class_idx
on public.class_materials(class_number);

create index class_materials_uploaded_by_idx
on public.class_materials(uploaded_by);

create index faculty_members_display_order_idx
on public.faculty_members(display_order);

create index gallery_images_display_order_idx
on public.gallery_images(display_order);

create index admission_enquiries_status_idx
on public.admission_enquiries(status);

create index admission_enquiries_created_at_idx
on public.admission_enquiries(created_at);

-- ============================================================
-- 40. INITIAL MODULES
-- ============================================================

insert into public.school_modules
(module_key, module_name, enabled)
values
('students', 'Student Management', true),
('admissions', 'Admissions', true),
('academics', 'Academic Management', true),
('attendance', 'Attendance', true),
('fees', 'Fee Management', true),
('parents', 'Parent Portal', true),
('staff', 'Staff Management', true),
('calendar', 'School Calendar', true),
('reports', 'Reports', true),
('audit', 'Audit System', true),
('migration', 'Data Migration', true),
('notifications', 'Notifications', false),
('website', 'Public Website', true),
('faculty_portal', 'Faculty Portal', true),
('gallery', 'Gallery', true),
('class_materials', 'Class Materials', true);

-- ============================================================
-- 41. DEFAULT SCHOOL CONFIG
-- ============================================================

insert into public.school_config (
  school_code,
  school_name,
  timezone
)
values (
  'HYDERABAD_SCHOOL',
  'Hyderabad School',
  'Asia/Kolkata'
);

-- ============================================================
-- 42. DEFAULT CLASS MASTER
-- ============================================================

insert into public.classes
(class_code, class_name, display_order)
values
('CLASS_01', 'Class 1', 1),
('CLASS_02', 'Class 2', 2),
('CLASS_03', 'Class 3', 3),
('CLASS_04', 'Class 4', 4),
('CLASS_05', 'Class 5', 5),
('CLASS_06', 'Class 6', 6),
('CLASS_07', 'Class 7', 7),
('CLASS_08', 'Class 8', 8),
('CLASS_09', 'Class 9', 9),
('CLASS_10', 'Class 10', 10);

-- ============================================================

commit;
