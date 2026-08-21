-- Consolidate legacy staff tables into staff_profiles + staff_roles.
-- Replaces: public.users, faculty_members, faculty_profiles
--
-- Run AFTER the ERP foundation schema and 20260820000000_fix_users_rls_recursion.sql

begin;

-- ---------------------------------------------------------------------------
-- 1. Allow directory-only staff (no login)
-- ---------------------------------------------------------------------------

alter table public.staff_profiles
  alter column auth_user_id drop not null;

alter table public.staff_profiles
  drop constraint if exists staff_profiles_auth_user_id_key;

create unique index if not exists staff_profiles_auth_user_id_unique
  on public.staff_profiles (auth_user_id)
  where auth_user_id is not null;

-- ---------------------------------------------------------------------------
-- 2. Migrate portal staff (users + faculty_profiles)
-- ---------------------------------------------------------------------------

insert into public.staff_profiles (
  auth_user_id,
  first_name,
  email,
  designation,
  bio,
  photo_url,
  assigned_class,
  is_public,
  status,
  display_order
)
select
  fp.user_id,
  fp.name,
  u.email,
  fp.role,
  fp.bio,
  fp.photo_url,
  fp.assigned_class,
  false,
  case when fp.is_active then 'ACTIVE'::public.staff_status else 'INACTIVE'::public.staff_status end,
  0
from public.faculty_profiles fp
join public.users u on u.id = fp.user_id
where not exists (
  select 1
  from public.staff_profiles sp
  where sp.auth_user_id = fp.user_id
);

insert into public.staff_roles (staff_id, role_id)
select sp.id, r.id
from public.staff_profiles sp
join public.users u on u.id = sp.auth_user_id and u.role = 'faculty'
cross join public.roles r
where r.role_key = 'TEACHER'
  and not exists (
    select 1
    from public.staff_roles sr
    where sr.staff_id = sp.id
      and sr.role_id = r.id
      and sr.active = true
  );

-- Admin accounts without staff profile yet
insert into public.staff_profiles (
  auth_user_id,
  first_name,
  email,
  designation,
  status,
  is_public
)
select
  u.id,
  coalesce(split_part(u.email, '@', 1), 'Admin'),
  u.email,
  'Administrator',
  'ACTIVE'::public.staff_status,
  false
from public.users u
where u.role = 'admin'
  and not exists (
    select 1
    from public.staff_profiles sp
    where sp.auth_user_id = u.id
  );

insert into public.staff_roles (staff_id, role_id)
select sp.id, r.id
from public.staff_profiles sp
join public.users u on u.id = sp.auth_user_id and u.role = 'admin'
cross join public.roles r
where r.role_key = 'PRINCIPAL'
  and not exists (
    select 1
    from public.staff_roles sr
    where sr.staff_id = sp.id
      and sr.role_id = r.id
      and sr.active = true
  );

-- ---------------------------------------------------------------------------
-- 3. Migrate public directory (faculty_members)
-- ---------------------------------------------------------------------------

-- Merge directory data onto existing portal staff when names match
update public.staff_profiles sp
set
  designation = coalesce(fm.role, sp.designation),
  bio = coalesce(fm.bio, sp.bio),
  photo_url = coalesce(fm.photo_url, sp.photo_url),
  initials = coalesce(fm.initials, sp.initials),
  accent = coalesce(fm.accent, sp.accent),
  display_order = fm.display_order,
  is_public = fm.is_active
from public.faculty_members fm
where sp.auth_user_id is not null
  and lower(trim(sp.first_name)) = lower(trim(fm.name));

-- Insert directory-only staff
insert into public.staff_profiles (
  first_name,
  designation,
  bio,
  photo_url,
  initials,
  accent,
  display_order,
  is_public,
  status
)
select
  fm.name,
  fm.role,
  fm.bio,
  fm.photo_url,
  fm.initials,
  fm.accent,
  fm.display_order,
  fm.is_active,
  case when fm.is_active then 'ACTIVE'::public.staff_status else 'INACTIVE'::public.staff_status end
from public.faculty_members fm
where not exists (
  select 1
  from public.staff_profiles sp
  where lower(trim(sp.first_name)) = lower(trim(fm.name))
);

-- ---------------------------------------------------------------------------
-- 4. Repoint class_materials.uploaded_by → auth.users
-- ---------------------------------------------------------------------------

alter table public.class_materials
  drop constraint if exists class_materials_uploaded_by_fkey;

alter table public.class_materials
  add constraint class_materials_uploaded_by_fkey
  foreign key (uploaded_by)
  references auth.users (id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- 5. Auth / role helpers (replace users-table checks)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    join public.staff_roles sr
      on sr.staff_id = sp.id
     and sr.active = true
     and sr.starts_at <= now()
     and (sr.ends_at is null or sr.ends_at > now())
    join public.roles r
      on r.id = sr.role_id
    where sp.auth_user_id = auth.uid()
      and sp.status = 'ACTIVE'
      and r.role_key in ('PRINCIPAL', 'VICE_PRINCIPAL')
  );
$$;

create or replace function public.is_faculty()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    join public.staff_roles sr
      on sr.staff_id = sp.id
     and sr.active = true
     and sr.starts_at <= now()
     and (sr.ends_at is null or sr.ends_at > now())
    join public.roles r
      on r.id = sr.role_id
    where sp.auth_user_id = auth.uid()
      and sp.status = 'ACTIVE'
      and r.role_key = 'TEACHER'
  );
$$;

create or replace function public.get_faculty_assigned_class()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select sp.assigned_class
  from public.staff_profiles sp
  where sp.auth_user_id = auth.uid()
    and sp.status = 'ACTIVE'
  limit 1;
$$;

create or replace function public.get_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_admin() then 'admin'
    when public.is_faculty() then 'faculty'
    else null
  end;
$$;

grant execute on function public.get_app_role() to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Auth trigger → staff_profiles + staff_roles
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid;
  v_role_key text;
  v_role_id uuid;
  v_meta_role text;
begin
  v_meta_role := coalesce(new.raw_user_meta_data->>'role', 'faculty');
  v_role_key := case v_meta_role
    when 'admin' then 'PRINCIPAL'
    else 'TEACHER'
  end;

  insert into public.staff_profiles (
    auth_user_id,
    first_name,
    email,
    designation,
    status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    case v_role_key when 'PRINCIPAL' then 'Administrator' else 'Teacher' end,
    'ACTIVE'::public.staff_status
  )
  on conflict (auth_user_id) where auth_user_id is not null
  do update set
    email = excluded.email,
    updated_at = now()
  returning id into v_staff_id;

  if v_staff_id is null then
    select id into v_staff_id
    from public.staff_profiles
    where auth_user_id = new.id;
  end if;

  select id into v_role_id
  from public.roles
  where role_key = v_role_key;

  if v_role_id is not null and v_staff_id is not null then
    insert into public.staff_roles (staff_id, role_id)
    select v_staff_id, v_role_id
    where not exists (
      select 1
      from public.staff_roles sr
      where sr.staff_id = v_staff_id
        and sr.role_id = v_role_id
        and sr.active = true
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- 7. staff_profiles RLS (website + ERP)
-- ---------------------------------------------------------------------------

drop policy if exists staff_profiles_read on public.staff_profiles;
drop policy if exists staff_profiles_manage on public.staff_profiles;
drop policy if exists staff_public_read on public.staff_profiles;
drop policy if exists staff_profiles_self_read on public.staff_profiles;
drop policy if exists staff_profiles_admin_manage on public.staff_profiles;

create policy staff_public_read
  on public.staff_profiles
  for select
  to anon, authenticated
  using (is_public = true and status = 'ACTIVE');

create policy staff_profiles_self_read
  on public.staff_profiles
  for select
  to authenticated
  using (auth_user_id = auth.uid() or public.is_admin());

create policy staff_profiles_self_update
  on public.staff_profiles
  for update
  to authenticated
  using (auth_user_id = auth.uid() or public.is_admin())
  with check (auth_user_id = auth.uid() or public.is_admin());

create policy staff_profiles_admin_manage
  on public.staff_profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy staff_profiles_erp_read
  on public.staff_profiles
  for select
  to authenticated
  using (public.user_has_permission('staff.view'));

-- ---------------------------------------------------------------------------
-- 8. Update legacy CMS RLS to use is_admin() (already non-recursive)
-- ---------------------------------------------------------------------------

-- class_materials: restore assigned-class check for faculty inserts
drop policy if exists class_materials_faculty_manage on public.class_materials;

create policy class_materials_faculty_manage
  on public.class_materials
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      public.is_faculty()
      and class_number = public.get_faculty_assigned_class()
      and uploaded_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 9. Drop legacy tables
-- ---------------------------------------------------------------------------

drop policy if exists users_self_read on public.users;
drop policy if exists users_admin_manage on public.users;
drop policy if exists faculty_members_public_read on public.faculty_members;
drop policy if exists faculty_members_admin_manage on public.faculty_members;
drop policy if exists faculty_profiles_self_read on public.faculty_profiles;
drop policy if exists faculty_profiles_self_update on public.faculty_profiles;
drop policy if exists faculty_profiles_admin_insert on public.faculty_profiles;
drop policy if exists faculty_profiles_admin_delete on public.faculty_profiles;

drop trigger if exists set_updated_at_faculty_profiles on public.faculty_profiles;

drop table if exists public.faculty_profiles cascade;
drop table if exists public.faculty_members cascade;
drop table if exists public.users cascade;

commit;
