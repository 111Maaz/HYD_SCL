-- Expand app role helpers for ERP staff roles (login + admin shell).
-- Safe / additive: PRINCIPAL still maps to admin; TEACHER still faculty.

begin;

-- ---------------------------------------------------------------------------
-- is_admin(): management roles that use the admin portal
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
      and r.role_key in (
        'PRINCIPAL',
        'VICE_PRINCIPAL',
        'ACADEMIC_INCHARGE',
        'ATTENDANCE_INCHARGE',
        'FEES_INCHARGE',
        'OPERATIONS_INCHARGE'
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- is_faculty(): teaching / general staff → faculty portal
-- ---------------------------------------------------------------------------

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
      and r.role_key in ('TEACHER', 'STAFF')
  );
$$;

-- ---------------------------------------------------------------------------
-- get_app_role(): 'admin' | 'faculty' | null (unchanged return type)
-- Prefer admin if the user has any management role.
-- ---------------------------------------------------------------------------

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
-- get_staff_role_key(): primary ERP role for UI display (new)
-- ---------------------------------------------------------------------------

create or replace function public.get_staff_role_key()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.role_key
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
  order by case r.role_key
    when 'PRINCIPAL' then 1
    when 'VICE_PRINCIPAL' then 2
    when 'ACADEMIC_INCHARGE' then 3
    when 'ATTENDANCE_INCHARGE' then 4
    when 'FEES_INCHARGE' then 5
    when 'OPERATIONS_INCHARGE' then 6
    when 'TEACHER' then 7
    when 'STAFF' then 8
    else 9
  end
  limit 1;
$$;

grant execute on function public.get_staff_role_key() to authenticated;

commit;
