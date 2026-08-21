-- Fix staff login for non-Principal roles.
-- Cause: auth.ts joined public.roles via PostgREST, but roles_read requires roles.view
-- which TEACHER / VP / incharges do not have. Principal gets all permissions so only
-- Principal could log in.
-- Fix: security-definer helper returns the caller's active ERP role keys.

begin;

create or replace function public.get_my_staff_role_keys()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array_agg(r.role_key order by case r.role_key
      when 'PRINCIPAL' then 1
      when 'VICE_PRINCIPAL' then 2
      when 'ACADEMIC_INCHARGE' then 3
      when 'ATTENDANCE_INCHARGE' then 4
      when 'FEES_INCHARGE' then 5
      when 'OPERATIONS_INCHARGE' then 6
      when 'TEACHER' then 7
      when 'STAFF' then 8
      else 9
    end),
    '{}'::text[]
  )
  from public.staff_profiles sp
  join public.staff_roles sr
    on sr.staff_id = sp.id
   and sr.active = true
   and sr.starts_at <= now()
   and (sr.ends_at is null or sr.ends_at > now())
  join public.roles r
    on r.id = sr.role_id
  where sp.auth_user_id = auth.uid()
    and sp.status = 'ACTIVE';
$$;

grant execute on function public.get_my_staff_role_keys() to authenticated;

-- Allow authenticated users to read only roles they hold (for any client joins).
drop policy if exists roles_self_read on public.roles;

create policy roles_self_read
  on public.roles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.staff_profiles sp
      join public.staff_roles sr
        on sr.staff_id = sp.id
       and sr.active = true
       and sr.starts_at <= now()
       and (sr.ends_at is null or sr.ends_at > now())
      where sp.auth_user_id = auth.uid()
        and sp.status = 'ACTIVE'
        and sr.role_id = roles.id
    )
  );

commit;
