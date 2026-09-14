-- Public parent registration must never provision a staff account.  Staff
-- provisioning is allowed only when a server-side admin client marks the auth
-- user with app_metadata.account_type = 'staff'.  App metadata is deliberately
-- used here because it cannot be supplied by a public browser signup.

begin;

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
  v_guardian_id uuid;
  v_guardian_matches integer;
  v_email text;
  v_name text;
begin
  -- This is the existing, authorised staff creation path.  Do not infer staff
  -- status from mutable user_metadata: public signups can supply that data.
  if new.raw_app_meta_data->>'account_type' = 'staff' then
    v_meta_role := coalesce(new.raw_user_meta_data->>'role', 'faculty');
    v_role_key := case v_meta_role
      when 'admin' then 'PRINCIPAL'
      else 'TEACHER'
    end;

    insert into public.staff_profiles (
      auth_user_id, first_name, email, designation, status
    ) values (
      new.id,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.email,
      case v_role_key when 'PRINCIPAL' then 'Administrator' else 'Teacher' end,
      'ACTIVE'::public.staff_status
    )
    on conflict (auth_user_id) where auth_user_id is not null
    do update set email = excluded.email, updated_at = now()
    returning id into v_staff_id;

    select id into v_role_id from public.roles where role_key = v_role_key;
    if v_role_id is not null and v_staff_id is not null then
      insert into public.staff_roles (staff_id, role_id)
      select v_staff_id, v_role_id
      where not exists (
        select 1 from public.staff_roles sr
        where sr.staff_id = v_staff_id and sr.role_id = v_role_id and sr.active = true
      );
    end if;

    return new;
  end if;

  -- Only the public Parent Create Account flow uses this marker.  Parent
  -- accounts are represented exclusively by guardians; no staff tables are
  -- touched and no student_guardians row is created here.
  if new.raw_user_meta_data->>'role' = 'parent' then
    v_email := lower(trim(new.email));

    select count(*), min(id)
      into v_guardian_matches, v_guardian_id
    from public.guardians
    where lower(trim(email)) = v_email;

    -- A single email match is the approved guardian matching rule.  Multiple
    -- historical matches are ambiguous, so fail safely instead of attaching or
    -- creating a duplicate record.
    if v_guardian_matches > 1 then
      raise exception 'Multiple guardian records use this email; contact the school office.';
    elsif v_guardian_matches = 1 then
      update public.guardians
      set auth_user_id = new.id,
          email = v_email,
          updated_at = now()
      where id = v_guardian_id
        and auth_user_id is null;

      if not found then
        raise exception 'This guardian record is already linked to another login.';
      end if;
    else
      v_name := nullif(trim(new.raw_user_meta_data->>'name'), '');
      insert into public.guardians (auth_user_id, first_name, email, active)
      values (
        new.id,
        coalesce(nullif(split_part(coalesce(v_name, ''), ' ', 1), ''), 'Parent'),
        v_email,
        true
      );
    end if;
  end if;

  return new;
end;
$$;

commit;
