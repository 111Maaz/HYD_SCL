-- Fix the parent-signup trigger's UUID lookup. PostgreSQL does not provide a
-- min(uuid) aggregate on every supported Supabase/Postgres version, which can
-- otherwise make auth.signUp fail with "Database error saving new user".

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

  if new.raw_user_meta_data->>'role' = 'parent' then
    v_email := lower(trim(new.email));

    select count(*) into v_guardian_matches
    from public.guardians
    where lower(trim(email)) = v_email;

    if v_guardian_matches > 1 then
      raise exception 'Multiple guardian records use this email; contact the school office.';
    elsif v_guardian_matches = 1 then
      select id into v_guardian_id
      from public.guardians
      where lower(trim(email)) = v_email;

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
