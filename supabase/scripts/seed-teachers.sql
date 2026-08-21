-- TEST ONLY: 10 teacher accounts
-- Password for all: 131126
-- Emails: teacher1@gmail.com … teacher10@gmail.com
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
  select id into v_role_id
  from public.roles
  where role_key = 'TEACHER';

  if v_role_id is null then
    raise exception 'Missing roles.role_key=TEACHER — run ERP role seed migrations first.';
  end if;

  for r in
    select *
    from (
      values
        ('teacher1@gmail.com',  'Ayesha Rahman',     1,  'Class Teacher — Class 1'),
        ('teacher2@gmail.com',  'Rohan Mehta',       2,  'Class Teacher — Class 2'),
        ('teacher3@gmail.com',  'Fatima Siddiqui',   3,  'Class Teacher — Class 3'),
        ('teacher4@gmail.com',  'Vikram Reddy',      4,  'Class Teacher — Class 4'),
        ('teacher5@gmail.com',  'Sneha Iyer',        5,  'Class Teacher — Class 5'),
        ('teacher6@gmail.com',  'Imran Qureshi',     6,  'Class Teacher — Class 6'),
        ('teacher7@gmail.com',  'Priya Nair',        7,  'Class Teacher — Class 7'),
        ('teacher8@gmail.com',  'Arjun Deshmukh',    8,  'Class Teacher — Class 8'),
        ('teacher9@gmail.com',  'Zara Khan',         9,  'Class Teacher — Class 9'),
        ('teacher10@gmail.com', 'Karthik Sharma',   10,  'Class Teacher — Class 10')
    ) as t(email, display_name, assigned_class, designation)
  loop
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
          'role', 'faculty',
          'name', r.display_name,
          'staff_role_key', 'TEACHER'
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

    select id into v_staff_id
    from public.staff_profiles
    where auth_user_id = v_user_id;

    if v_staff_id is null then
      insert into public.staff_profiles (
        auth_user_id,
        first_name,
        email,
        designation,
        assigned_class,
        status
      )
      values (
        v_user_id,
        r.display_name,
        lower(r.email),
        r.designation,
        r.assigned_class,
        'ACTIVE'::public.staff_status
      )
      returning id into v_staff_id;
    else
      update public.staff_profiles
      set
        first_name = r.display_name,
        email = lower(r.email),
        designation = r.designation,
        assigned_class = r.assigned_class,
        status = 'ACTIVE'::public.staff_status,
        updated_at = now()
      where id = v_staff_id;
    end if;

    -- ends_at must be strictly after starts_at (staff_role_dates_valid)
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

    raise notice 'Ready: % → TEACHER (Class %)', lower(r.email), r.assigned_class;
  end loop;
end $$;
