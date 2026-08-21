-- Fix infinite recursion on staff_profiles RLS
-- Cause: staff_profiles_staff_directory selected from staff_profiles inside its own policy.

begin;

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
