-- Sprint J + K: Parent read RLS + Import Centre tables

begin;

-- ---------------------------------------------------------------------------
-- Parent helpers (security definer — no RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function public.current_guardian_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select g.id
  from public.guardians g
  where g.auth_user_id = auth.uid()
    and g.active = true
  limit 1;
$$;

grant execute on function public.current_guardian_id() to authenticated;

create or replace function public.guardian_can_view_student(
  p_student_id uuid,
  p_permission text default 'any'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_guardians sg
    where sg.guardian_id = public.current_guardian_id()
      and sg.student_id = p_student_id
      and (
        p_permission = 'any'
        or (p_permission = 'attendance' and sg.can_view_attendance)
        or (p_permission = 'fees' and sg.can_view_fees)
        or (p_permission = 'academic' and sg.can_view_academic_data)
      )
  );
$$;

grant execute on function public.guardian_can_view_student(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Parent read policies
-- ---------------------------------------------------------------------------

drop policy if exists guardians_self_read on public.guardians;
create policy guardians_self_read
  on public.guardians
  for select
  to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists student_guardians_parent_read on public.student_guardians;
create policy student_guardians_parent_read
  on public.student_guardians
  for select
  to authenticated
  using (guardian_id = public.current_guardian_id());

drop policy if exists students_parent_read on public.students;
create policy students_parent_read
  on public.students
  for select
  to authenticated
  using (public.guardian_can_view_student(id, 'any'));

drop policy if exists enrollments_parent_read on public.enrollments;
create policy enrollments_parent_read
  on public.enrollments
  for select
  to authenticated
  using (public.guardian_can_view_student(student_id, 'academic'));

drop policy if exists attendance_parent_read on public.attendance_records;
create policy attendance_parent_read
  on public.attendance_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = attendance_records.enrollment_id
        and public.guardian_can_view_student(e.student_id, 'attendance')
    )
  );

drop policy if exists fee_charges_parent_read on public.fee_charges;
create policy fee_charges_parent_read
  on public.fee_charges
  for select
  to authenticated
  using (public.guardian_can_view_student(student_id, 'fees'));

drop policy if exists fee_payments_parent_read on public.fee_payments;
create policy fee_payments_parent_read
  on public.fee_payments
  for select
  to authenticated
  using (public.guardian_can_view_student(student_id, 'fees'));

-- ---------------------------------------------------------------------------
-- Import Centre (Sprint K)
-- ---------------------------------------------------------------------------
-- Consolidated ERP schema may already define import_jobs/import_rows with a
-- different column layout (e.g. import_job_id). Drop and recreate so the app
-- schema matches. Safe while Import Centre has no production data yet.

drop table if exists public.import_rows cascade;
drop table if exists public.import_jobs cascade;

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in ('ADMISSIONS', 'GUARDIAN_LINK')),
  file_name text not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'VALIDATED', 'COMMITTED', 'FAILED')),
  row_count int not null default 0,
  valid_count int not null default 0,
  error_count int not null default 0,
  created_by_staff_id uuid references public.staff_profiles (id) on delete set null,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.import_jobs (id) on delete cascade,
  row_number int not null,
  raw_data jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'VALID', 'ERROR', 'COMMITTED', 'SKIPPED')),
  error_message text,
  target_student_id uuid references public.students (id) on delete set null,
  target_guardian_id uuid references public.guardians (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists import_rows_job_idx on public.import_rows (job_id);

alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;

drop policy if exists import_jobs_admin on public.import_jobs;
create policy import_jobs_admin
  on public.import_jobs
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists import_rows_admin on public.import_rows;
create policy import_rows_admin
  on public.import_rows
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

commit;
