-- Ensure the Principal can log in.
-- Login looks up staff_profiles by auth.uid(), then requires an active
-- staff_roles row (PRINCIPAL). Designation "Principal" is display-only and
-- does not grant portal access. Seeded teachers have TEACHER roles; the
-- original Principal account often does not.

begin;

-- 1. Relink staff_profiles.auth_user_id to auth.users by email
--    (stale UUID is a common cause of "no profile found" after re-invites).
update public.staff_profiles sp
set
  auth_user_id = u.id,
  updated_at = now()
from auth.users u
where sp.email is not null
  and trim(sp.email) <> ''
  and lower(trim(u.email)) = lower(trim(sp.email))
  and sp.auth_user_id is distinct from u.id
  and not exists (
    select 1
    from public.staff_profiles other
    where other.auth_user_id = u.id
      and other.id <> sp.id
  );

-- 2. Grant PRINCIPAL where the person is clearly the school principal
--    and does not already hold an active PRINCIPAL assignment.
insert into public.staff_roles (staff_id, role_id, active, starts_at)
select sp.id, r.id, true, now()
from public.staff_profiles sp
cross join public.roles r
where r.role_key = 'PRINCIPAL'
  and sp.status = 'ACTIVE'
  and (
    lower(trim(coalesce(sp.email, ''))) = 'maazali53093@gmail.com'
    or lower(trim(coalesce(sp.designation, ''))) = 'principal'
  )
  and not exists (
    select 1
    from public.staff_roles sr
    where sr.staff_id = sp.id
      and sr.role_id = r.id
      and sr.active = true
      and sr.starts_at <= now()
      and (sr.ends_at is null or sr.ends_at > now())
  );

commit;
