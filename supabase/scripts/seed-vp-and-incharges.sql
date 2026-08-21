-- TEST ONLY: Vice Principal + category incharges
-- Password for all: 131126
-- Run in Supabase SQL Editor (service / postgres role).
-- Safe to re-run: skips emails that already exist in auth.users.

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  r record;
  v_user_id uuid;
  v_staff_id uuid;
  v_role_id uuid;
  v_password text := '131126';
begin
  for r in
    select *
    from (
      values
        (
          'hs.viceprincipal@gmail.com',
          'Vice Principal',
          'VICE_PRINCIPAL',
          'Vice Principal'
        ),
        (
          'hs.academic.incharge@gmail.com',
          'Academic Incharge',
          'ACADEMIC_INCHARGE',
          'Academic Incharge'
        ),
        (
          'hs.attendance.incharge@gmail.com',
          'Attendance Incharge',
          'ATTENDANCE_INCHARGE',
          'Attendance Incharge'
        ),
        (
          'hs.fees.incharge@gmail.com',
          'Fees Incharge',
          'FEES_INCHARGE',
          'Fees Incharge'
        ),
        (
          'hs.operations.incharge@gmail.com',
          'Operations Incharge',
          'OPERATIONS_INCHARGE',
          'Operations Incharge'
        )
    ) as t(email, display_name, role_key, designation)
  loop
    -- Skip if auth user already exists
    select id into v_user_id
    from auth.users
    where lower(email) = lower(r.email);

    if v_user_id is null then
      v_user_id := gen_random_uuid();

      insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      )
      values (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        lower(r.email),
        extensions.crypt(v_password, extensions.gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
          'role', 'admin',
          'name', r.display_name,
          'staff_role_key', r.role_key
        ),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );

      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      )
      values (
        gen_random_uuid(),
        v_user_id,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', lower(r.email),
          'email_verified', true
        ),
        'email',
        v_user_id::text,
        now(),
        now(),
        now()
      );
    end if;

    -- Ensure staff profile (trigger may already have created it)
    select id into v_staff_id
    from public.staff_profiles
    where auth_user_id = v_user_id;

    if v_staff_id is null then
      insert into public.staff_profiles (
        auth_user_id,
        first_name,
        email,
        designation,
        status
      )
      values (
        v_user_id,
        r.display_name,
        lower(r.email),
        r.designation,
        'ACTIVE'::public.staff_status
      )
      returning id into v_staff_id;
    else
      update public.staff_profiles
      set
        first_name = r.display_name,
        email = lower(r.email),
        designation = r.designation,
        status = 'ACTIVE'::public.staff_status,
        updated_at = now()
      where id = v_staff_id;
    end if;

    select id into v_role_id
    from public.roles
    where role_key = r.role_key;

    if v_role_id is null then
      raise exception 'Missing roles.role_key=% — run ERP role seed migrations first.', r.role_key;
    end if;

    -- Deactivate other active roles, then assign the intended one.
    -- ends_at must be strictly after starts_at (staff_role_dates_valid).
    update public.staff_roles
    set
      active = false,
      ends_at = starts_at + interval '1 second'
    where staff_id = v_staff_id
      and active = true
      and role_id <> v_role_id;

    insert into public.staff_roles (staff_id, role_id, active)
    select v_staff_id, v_role_id, true
    where not exists (
      select 1
      from public.staff_roles sr
      where sr.staff_id = v_staff_id
        and sr.role_id = v_role_id
        and sr.active = true
    );

    raise notice 'Ready: % → %', lower(r.email), r.role_key;
  end loop;
end $$;
