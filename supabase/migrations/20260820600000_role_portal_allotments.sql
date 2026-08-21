-- Role portals: attendance teacher allotments + secondary cover + staff photo storage
-- Additive only.

begin;

-- ---------------------------------------------------------------------------
-- 1. Secondary teacher cover (primary picks a substitute for a date range)
-- ---------------------------------------------------------------------------

create table if not exists public.secondary_teacher_allotments (
  id uuid primary key default gen_random_uuid(),
  primary_staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  secondary_staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint secondary_allotment_dates_valid check (ends_on >= starts_on),
  constraint secondary_allotment_distinct check (primary_staff_id <> secondary_staff_id)
);

create index if not exists secondary_teacher_allotments_primary_idx
  on public.secondary_teacher_allotments (primary_staff_id)
  where active = true;

create index if not exists secondary_teacher_allotments_secondary_idx
  on public.secondary_teacher_allotments (secondary_staff_id)
  where active = true;

alter table public.secondary_teacher_allotments enable row level security;

drop policy if exists secondary_allotments_select on public.secondary_teacher_allotments;
create policy secondary_allotments_select
  on public.secondary_teacher_allotments
  for select
  to authenticated
  using (
    public.is_admin()
    or primary_staff_id in (
      select sp.id from public.staff_profiles sp where sp.auth_user_id = auth.uid()
    )
    or secondary_staff_id in (
      select sp.id from public.staff_profiles sp where sp.auth_user_id = auth.uid()
    )
  );

drop policy if exists secondary_allotments_insert on public.secondary_teacher_allotments;
create policy secondary_allotments_insert
  on public.secondary_teacher_allotments
  for insert
  to authenticated
  with check (
    public.is_admin()
    or primary_staff_id in (
      select sp.id from public.staff_profiles sp
      where sp.auth_user_id = auth.uid() and sp.status = 'ACTIVE'
    )
  );

drop policy if exists secondary_allotments_update on public.secondary_teacher_allotments;
create policy secondary_allotments_update
  on public.secondary_teacher_allotments
  for update
  to authenticated
  using (
    public.is_admin()
    or primary_staff_id in (
      select sp.id from public.staff_profiles sp where sp.auth_user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or primary_staff_id in (
      select sp.id from public.staff_profiles sp where sp.auth_user_id = auth.uid()
    )
  );

drop policy if exists secondary_allotments_delete on public.secondary_teacher_allotments;
create policy secondary_allotments_delete
  on public.secondary_teacher_allotments
  for delete
  to authenticated
  using (
    public.is_admin()
    or primary_staff_id in (
      select sp.id from public.staff_profiles sp where sp.auth_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Attendance class teacher allotment (incharge assigns teacher → section)
-- ---------------------------------------------------------------------------

create table if not exists public.attendance_teacher_allotments (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id) on delete cascade,
  section_id uuid not null references public.sections (id) on delete cascade,
  teacher_staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  allotted_by_staff_id uuid references public.staff_profiles (id) on delete set null,
  active boolean not null default true,
  starts_on date not null default (timezone('utc', now()))::date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_allotment_dates_valid
    check (ends_on is null or ends_on >= starts_on)
);

create unique index if not exists attendance_teacher_allotments_one_active_section
  on public.attendance_teacher_allotments (section_id)
  where active = true;

create index if not exists attendance_teacher_allotments_teacher_idx
  on public.attendance_teacher_allotments (teacher_staff_id)
  where active = true;

create index if not exists attendance_teacher_allotments_year_idx
  on public.attendance_teacher_allotments (academic_year_id);

alter table public.attendance_teacher_allotments enable row level security;

drop policy if exists attendance_allotments_select on public.attendance_teacher_allotments;
create policy attendance_allotments_select
  on public.attendance_teacher_allotments
  for select
  to authenticated
  using (
    public.is_admin()
    or teacher_staff_id in (
      select sp.id from public.staff_profiles sp where sp.auth_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.secondary_teacher_allotments sec
      join public.staff_profiles me on me.id = sec.secondary_staff_id
      where me.auth_user_id = auth.uid()
        and sec.primary_staff_id = attendance_teacher_allotments.teacher_staff_id
        and sec.active = true
        and sec.starts_on <= (timezone('utc', now()))::date
        and sec.ends_on >= (timezone('utc', now()))::date
    )
  );

drop policy if exists attendance_allotments_insert on public.attendance_teacher_allotments;
create policy attendance_allotments_insert
  on public.attendance_teacher_allotments
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists attendance_allotments_update on public.attendance_teacher_allotments;
create policy attendance_allotments_update
  on public.attendance_teacher_allotments
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists attendance_allotments_delete on public.attendance_teacher_allotments;
create policy attendance_allotments_delete
  on public.attendance_teacher_allotments
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Staff photos storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('staff-photos', 'staff-photos', true)
on conflict (id) do nothing;

drop policy if exists staff_photos_public_read on storage.objects;
create policy staff_photos_public_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'staff-photos');

drop policy if exists staff_photos_auth_upload on storage.objects;
create policy staff_photos_auth_upload
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'staff-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists staff_photos_auth_update on storage.objects;
create policy staff_photos_auth_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'staff-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists staff_photos_auth_delete on storage.objects;
create policy staff_photos_auth_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'staff-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists staff_photos_admin_all on storage.objects;
create policy staff_photos_admin_all
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'staff-photos' and public.is_admin())
  with check (bucket_id = 'staff-photos' and public.is_admin());

-- Teachers need a staff directory to pick secondary cover / allotment targets.
-- MUST use security definer helper — querying staff_profiles inside its own
-- RLS policy causes "infinite recursion detected in policy for relation staff_profiles".
create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.auth_user_id = auth.uid()
      and sp.status = 'ACTIVE'
  );
$$;

grant execute on function public.is_active_staff() to authenticated;

drop policy if exists staff_profiles_staff_directory on public.staff_profiles;
create policy staff_profiles_staff_directory
  on public.staff_profiles
  for select
  to authenticated
  using (
    status = 'ACTIVE'
    and auth_user_id is not null
    and public.is_active_staff()
  );

commit;
