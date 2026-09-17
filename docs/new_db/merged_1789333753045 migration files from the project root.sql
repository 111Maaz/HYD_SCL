-- ═══════════════════════════════════════
-- Source: full-setup.sql
-- ═══════════════════════════════════════
-- =============================================================================
-- HS_Web — full database setup (run once in Supabase SQL Editor)
-- Dashboard → SQL Editor → New query → paste all → Run
-- =============================================================================

-- ── Sprint 5: public data layer ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admission_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admission_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit admission enquiries"
  ON public.admission_enquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.faculty_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  initials TEXT,
  accent TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faculty_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read faculty members"
  ON public.faculty_members
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  span_class TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read gallery images"
  ON public.gallery_images
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS public.class_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_number INTEGER NOT NULL CHECK (class_number BETWEEN 1 AND 10),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read class materials"
  ON public.class_materials
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('faculty-photos', 'faculty-photos', true),
  ('gallery-images', 'gallery-images', true),
  ('class-materials', 'class-materials', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

CREATE POLICY "Public read faculty photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'faculty-photos');

CREATE POLICY "Public read gallery images storage"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'gallery-images');

CREATE POLICY "Public read class materials storage"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'class-materials');

CREATE POLICY "Authenticated upload class materials"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'class-materials');

CREATE POLICY "Authenticated update class materials"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'class-materials');

CREATE POLICY "Authenticated delete class materials"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'class-materials');

-- ── Sprint 6: auth users table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- ── Sprint 7: admin RLS ──────────────────────────────────────────────────────

ALTER TABLE public.admission_enquiries
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Contacted', 'Visit Scheduled', 'Enrolled', 'Rejected')),
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE POLICY "Admins can read admission enquiries"
  ON public.admission_enquiries FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update admission enquiries"
  ON public.admission_enquiries FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can read all faculty members"
  ON public.faculty_members FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert faculty members"
  ON public.faculty_members FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update faculty members"
  ON public.faculty_members FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete faculty members"
  ON public.faculty_members FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can read all gallery images"
  ON public.gallery_images FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert gallery images"
  ON public.gallery_images FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update gallery images"
  ON public.gallery_images FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete gallery images"
  ON public.gallery_images FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert class materials"
  ON public.class_materials FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update class materials"
  ON public.class_materials FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete class materials"
  ON public.class_materials FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins upload faculty photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'faculty-photos' AND public.is_admin());

CREATE POLICY "Admins update faculty photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'faculty-photos' AND public.is_admin());

CREATE POLICY "Admins delete faculty photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'faculty-photos' AND public.is_admin());

CREATE POLICY "Admins upload gallery images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery-images' AND public.is_admin());

CREATE POLICY "Admins update gallery images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery-images' AND public.is_admin());

CREATE POLICY "Admins delete gallery images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery-images' AND public.is_admin());

-- ── Sprint 8: faculty portal ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'faculty'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_faculty_assigned_class()
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT assigned_class FROM public.faculty_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE TABLE IF NOT EXISTS public.faculty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  assigned_class INTEGER NOT NULL CHECK (assigned_class BETWEEN 1 AND 10),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faculty_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faculty can read own profile"
  ON public.faculty_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_faculty());

CREATE POLICY "Admins can read all faculty profiles"
  ON public.faculty_profiles FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert faculty profiles"
  ON public.faculty_profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update faculty profiles"
  ON public.faculty_profiles FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete faculty profiles"
  ON public.faculty_profiles FOR DELETE TO authenticated
  USING (public.is_admin());

ALTER TABLE public.class_materials
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE POLICY "Faculty can insert class materials for assigned class"
  ON public.class_materials FOR INSERT TO authenticated
  WITH CHECK (
    public.is_faculty()
    AND class_number = public.get_faculty_assigned_class()
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Faculty can delete own class materials"
  ON public.class_materials FOR DELETE TO authenticated
  USING (
    public.is_faculty()
    AND uploaded_by = auth.uid()
    AND class_number = public.get_faculty_assigned_class()
  );

DROP POLICY IF EXISTS "Authenticated upload class materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update class materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete class materials" ON storage.objects;

CREATE POLICY "Admins upload class materials storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'class-materials' AND public.is_admin());

CREATE POLICY "Admins update class materials storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'class-materials' AND public.is_admin());

CREATE POLICY "Admins delete class materials storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'class-materials' AND public.is_admin());

CREATE POLICY "Faculty upload class materials storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'class-materials' AND public.is_faculty());

CREATE POLICY "Faculty delete own class materials storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'class-materials' AND public.is_faculty());

-- ── Sprint 9: auth trigger + storage RLS ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'faculty');
  IF user_role NOT IN ('admin', 'faculty') THEN user_role := 'faculty'; END IF;
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, user_role)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

DROP POLICY IF EXISTS "Faculty delete own class materials storage" ON storage.objects;
CREATE POLICY "Faculty delete own class materials storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'class-materials' AND public.is_faculty()
    AND (
      name LIKE auth.uid()::text || '/%'
      OR EXISTS (
        SELECT 1 FROM public.class_materials cm
        WHERE cm.uploaded_by = auth.uid() AND cm.file_url LIKE '%' || storage.objects.name
      )
    )
  );

DROP POLICY IF EXISTS "Faculty upload class materials storage" ON storage.objects;
CREATE POLICY "Faculty upload class materials storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'class-materials' AND public.is_faculty()
    AND name LIKE auth.uid()::text || '/%'
  );

-- ── Seed sample data ─────────────────────────────────────────────────────────

INSERT INTO public.admission_enquiries (
  parent_name, email, phone, student_name, grade, message, status, notes
) VALUES (
  'Ayesha Khan', 'ayesha.khan@example.com', '+92 300 1234567',
  'Zain Khan', 'Grade 3',
  'Interested in admission for the upcoming academic year.', 'New', NULL
);

INSERT INTO public.faculty_members (
  name, role, bio, initials, accent, display_order, is_active
) VALUES (
  'Dr. Sarah Ahmed', 'Principal',
  'Leading Hyderabad School with a focus on academic excellence and character development.',
  'SA', 'bg-primary/10 text-primary', 1, true
);

-- ═══════════════════════════════════════
-- Source: seed.sql
-- ═══════════════════════════════════════
-- Dev seed data (optional). Admin/faculty accounts are created via:
--   npm run supabase:seed
-- because Supabase Auth users should be created through the Admin API.

-- Sample admission enquiry for the admin dashboard
INSERT INTO public.admission_enquiries (
  parent_name,
  email,
  phone,
  student_name,
  grade,
  message,
  status,
  notes
)
VALUES (
  'Ayesha Khan',
  'ayesha.khan@example.com',
  '+92 300 1234567',
  'Zain Khan',
  'Grade 3',
  'Interested in admission for the upcoming academic year.',
  'New',
  NULL
)
ON CONFLICT DO NOTHING;

-- Sample public faculty member (website directory — not a login account)
INSERT INTO public.faculty_members (
  name,
  role,
  bio,
  initials,
  accent,
  display_order,
  is_active
)
VALUES (
  'Dr. Sarah Ahmed',
  'Principal',
  'Leading Hyderabad School with a focus on academic excellence and character development.',
  'SA',
  'bg-primary/10 text-primary',
  1,
  true
)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════
-- Source: seed-teachers.sql
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- Source: seed-vp-and-incharges.sql
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- Source: verify-erp-tables.sql
-- ═══════════════════════════════════════
-- Quick check: which ERP tables exist on your Supabase project?
-- Run in SQL Editor and inspect results.

select
  t.table_name,
  case
    when t.table_name is not null then 'OK'
    else 'MISSING'
  end as status
from (
  values
    ('contact_enquiries'),
    ('academic_years'),
    ('classes'),
    ('class_years'),
    ('sections'),
    ('students'),
    ('enrollments'),
    ('calendar_events'),
    ('attendance_records'),
    ('fee_structures'),
    ('fee_charges'),
    ('fee_payments'),
    ('audit_logs'),
    ('staff_profiles'),
    ('staff_roles'),
    ('roles')
) as expected(table_name)
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = expected.table_name
order by expected.table_name;

-- Check your admin has PRINCIPAL role (replace email)
select
  sp.email,
  sp.status,
  r.role_key,
  sr.active as role_active
from public.staff_profiles sp
left join public.staff_roles sr on sr.staff_id = sp.id and sr.active = true
left join public.roles r on r.id = sr.role_id
where sp.email = 'YOUR_ADMIN_EMAIL@example.com';

-- ═══════════════════════════════════════
-- Source: 20260615000000_sprint5_schema.sql
-- ═══════════════════════════════════════
-- Sprint 5: Hyderabad School public data layer
-- Tables, RLS policies, and storage buckets

-- ---------------------------------------------------------------------------
-- admission_enquiries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admission_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admission_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit admission enquiries"
  ON public.admission_enquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- faculty_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  initials TEXT,
  accent TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faculty_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read faculty members"
  ON public.faculty_members
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ---------------------------------------------------------------------------
-- gallery_images
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  span_class TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read gallery images"
  ON public.gallery_images
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ---------------------------------------------------------------------------
-- class_materials
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_number INTEGER NOT NULL CHECK (class_number BETWEEN 1 AND 10),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read class materials"
  ON public.class_materials
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('faculty-photos', 'faculty-photos', true),
  ('gallery-images', 'gallery-images', true),
  ('class-materials', 'class-materials', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- faculty-photos: public read
CREATE POLICY "Public read faculty photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'faculty-photos');

-- gallery-images: public read
CREATE POLICY "Public read gallery images storage"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'gallery-images');

-- class-materials: public read, authenticated write
CREATE POLICY "Public read class materials storage"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'class-materials');

CREATE POLICY "Authenticated upload class materials"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'class-materials');

CREATE POLICY "Authenticated update class materials"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'class-materials');

CREATE POLICY "Authenticated delete class materials"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'class-materials');

-- ═══════════════════════════════════════
-- Source: 20260615100000_sprint6_auth.sql
-- ═══════════════════════════════════════
-- Sprint 6: Hyderabad School authentication layer
-- users table linked to Supabase Auth

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ═══════════════════════════════════════
-- Source: 20260615200000_sprint7_admin.sql
-- ═══════════════════════════════════════
-- Sprint 7: Hyderabad School admin dashboard
-- Admission lead management, admin RLS, storage write policies

-- ---------------------------------------------------------------------------
-- admission_enquiries: status + notes
-- ---------------------------------------------------------------------------
ALTER TABLE public.admission_enquiries
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Contacted', 'Visit Scheduled', 'Enrolled', 'Rejected')),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ---------------------------------------------------------------------------
-- is_admin() helper for RLS policies
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- admission_enquiries: admin read + update
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can read admission enquiries"
  ON public.admission_enquiries
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update admission enquiries"
  ON public.admission_enquiries
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- faculty_members: admin CRUD + read inactive
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can read all faculty members"
  ON public.faculty_members
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert faculty members"
  ON public.faculty_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update faculty members"
  ON public.faculty_members
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete faculty members"
  ON public.faculty_members
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- gallery_images: admin CRUD
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can read all gallery images"
  ON public.gallery_images
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert gallery images"
  ON public.gallery_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update gallery images"
  ON public.gallery_images
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete gallery images"
  ON public.gallery_images
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- class_materials: admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can insert class materials"
  ON public.class_materials
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update class materials"
  ON public.class_materials
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete class materials"
  ON public.class_materials
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: admin upload for faculty-photos and gallery-images
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins upload faculty photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'faculty-photos' AND public.is_admin());

CREATE POLICY "Admins update faculty photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'faculty-photos' AND public.is_admin());

CREATE POLICY "Admins delete faculty photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'faculty-photos' AND public.is_admin());

CREATE POLICY "Admins upload gallery images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gallery-images' AND public.is_admin());

CREATE POLICY "Admins update gallery images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'gallery-images' AND public.is_admin());

CREATE POLICY "Admins delete gallery images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'gallery-images' AND public.is_admin());

-- ═══════════════════════════════════════
-- Source: 20260615300000_sprint8_faculty.sql
-- ═══════════════════════════════════════
-- Sprint 8: Hyderabad School faculty portal
-- faculty_profiles, class material ownership, faculty RLS

-- ---------------------------------------------------------------------------
-- is_faculty() + assigned class helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'faculty'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_faculty_assigned_class()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT assigned_class
  FROM public.faculty_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- faculty_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  assigned_class INTEGER NOT NULL CHECK (assigned_class BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faculty_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faculty can read own profile"
  ON public.faculty_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.is_faculty());

CREATE POLICY "Admins can read all faculty profiles"
  ON public.faculty_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert faculty profiles"
  ON public.faculty_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update faculty profiles"
  ON public.faculty_profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete faculty profiles"
  ON public.faculty_profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- class_materials: ownership
-- ---------------------------------------------------------------------------
ALTER TABLE public.class_materials
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE POLICY "Faculty can insert class materials for assigned class"
  ON public.class_materials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_faculty()
    AND class_number = public.get_faculty_assigned_class()
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Faculty can delete own class materials"
  ON public.class_materials
  FOR DELETE
  TO authenticated
  USING (
    public.is_faculty()
    AND uploaded_by = auth.uid()
    AND class_number = public.get_faculty_assigned_class()
  );

-- ---------------------------------------------------------------------------
-- Storage: tighten class-materials write access
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated upload class materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update class materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete class materials" ON storage.objects;

CREATE POLICY "Admins upload class materials storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'class-materials' AND public.is_admin());

CREATE POLICY "Admins update class materials storage"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'class-materials' AND public.is_admin());

CREATE POLICY "Admins delete class materials storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'class-materials' AND public.is_admin());

CREATE POLICY "Faculty upload class materials storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'class-materials' AND public.is_faculty());

CREATE POLICY "Faculty delete own class materials storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'class-materials' AND public.is_faculty());

-- ═══════════════════════════════════════
-- Source: 20260615400000_sprint9_auth_trigger_storage.sql
-- ═══════════════════════════════════════
-- Sprint 9: auth.users → public.users trigger, faculty storage RLS

-- ---------------------------------------------------------------------------
-- Auto-create public.users when auth.users row is inserted
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'faculty');

  IF user_role NOT IN ('admin', 'faculty') THEN
    user_role := 'faculty';
  END IF;

  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, user_role)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Storage: faculty may only delete own class-materials objects
-- Path must start with auth.uid(), or match a class_materials row they own
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Faculty delete own class materials storage" ON storage.objects;

CREATE POLICY "Faculty delete own class materials storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'class-materials'
    AND public.is_faculty()
    AND (
      name LIKE auth.uid()::text || '/%'
      OR EXISTS (
        SELECT 1
        FROM public.class_materials cm
        WHERE cm.uploaded_by = auth.uid()
          AND cm.file_url LIKE '%' || storage.objects.name
      )
    )
  );

DROP POLICY IF EXISTS "Faculty upload class materials storage" ON storage.objects;

CREATE POLICY "Faculty upload class materials storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'class-materials'
    AND public.is_faculty()
    AND name LIKE auth.uid()::text || '/%'
  );

-- ═══════════════════════════════════════
-- Source: 20260616100000_faculty_profiles_is_active.sql
-- ═══════════════════════════════════════
-- Allow admins to temporarily disable faculty portal access
ALTER TABLE public.faculty_profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ═══════════════════════════════════════
-- Source: 20260701000000_erp_foundation.sql
-- ═══════════════════════════════════════
-- ERP foundation captured from consolidated platform SQL (master doc v3.0).
-- Versioned for Rule 6 — migrations-only replay.
-- Excludes: import_jobs/import_rows (app schema in 202608208), legacy CMS RLS (sprint 5–9 + 202608200+).
-- Run after CMS migrations 20260615000000–20260616100000, before 20260820000000.

begin;

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

create type public.academic_year_status as enum (
  'PLANNING',
  'ACTIVE',
  'CLOSED',
  'ARCHIVED'
);

create type public.student_status as enum (
  'ACTIVE',
  'WITHDRAWN',
  'TRANSFERRED',
  'GRADUATED',
  'ARCHIVED'
);

create type public.enrollment_status as enum (
  'ACTIVE',
  'PROMOTED',
  'REPEATED',
  'TRANSFERRED',
  'WITHDRAWN',
  'COMPLETED'
);

create type public.calendar_event_type as enum (
  'WORKING_DAY',
  'HOLIDAY',
  'SPECIAL_WORKING_DAY',
  'EXAM',
  'EVENT',
  'SCHOOL_CLOSURE'
);

create type public.attendance_status as enum (
  'PRESENT',
  'ABSENT',
  'LATE',
  'LEAVE',
  'HALF_DAY',
  'EXCUSED'
);

create type public.fee_charge_type as enum (
  'REGULAR',
  'ONE_TIME',
  'ADJUSTMENT',
  'CONCESSION'
);

create type public.payment_method as enum (
  'CASH',
  'UPI',
  'BANK_TRANSFER',
  'CHEQUE',
  'OTHER'
);

create type public.staff_status as enum (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'LEFT'
);

create type public.scope_type as enum (
  'SCHOOL',
  'CLASS',
  'SECTION'
);

create type public.import_status as enum (
  'UPLOADED',
  'VALIDATING',
  'VALIDATED',
  'FAILED',
  'APPROVED',
  'IMPORTED',
  'CANCELLED'
);

create type public.audit_action as enum (
  'INSERT',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'IMPORT',
  'EXPORT',
  'APPROVE',
  'REJECT',
  'ASSIGN',
  'UNASSIGN',
  'OTHER'
);

-- ============================================================
-- 2. SCHOOL CONFIGURATION
-- ============================================================

create table public.school_config (
  id uuid primary key default gen_random_uuid(),

  school_code text not null unique,
  school_name text not null,

  logo_url text,
  favicon_url text,

  address text,
  city text,
  state text,
  postal_code text,

  phone text,
  email text,
  website text,

  timezone text not null default 'Asia/Kolkata',

  academic_year_start_month smallint
    check (academic_year_start_month between 1 and 12),

  academic_year_end_month smallint
    check (academic_year_end_month between 1 and 12),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. MODULE CONFIGURATION
-- ============================================================

create table public.school_modules (
  id uuid primary key default gen_random_uuid(),

  module_key text not null unique,
  module_name text not null,

  enabled boolean not null default true,

  settings jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. ACADEMIC YEARS
-- ============================================================

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  start_date date not null,
  end_date date not null,

  status public.academic_year_status not null default 'PLANNING',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint academic_year_dates_valid
    check (end_date > start_date),

  constraint academic_year_name_unique
    unique (name)
);

-- ============================================================
-- 5. MASTER CLASS LIST
-- ============================================================

create table public.classes (
  id uuid primary key default gen_random_uuid(),

  class_code text not null unique,
  class_name text not null,

  display_order integer not null,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint class_display_order_positive
    check (display_order > 0)
);

-- ============================================================
-- 6. CLASS FOR A PARTICULAR ACADEMIC YEAR
-- ============================================================

create table public.class_years (
  id uuid primary key default gen_random_uuid(),

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  class_id uuid not null
    references public.classes(id)
    on delete restrict,

  expected_student_count integer not null default 0
    check (expected_student_count >= 0),

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (academic_year_id, class_id)
);

-- ============================================================
-- 7. SECTIONS
-- ============================================================

create table public.sections (
  id uuid primary key default gen_random_uuid(),

  class_year_id uuid not null
    references public.class_years(id)
    on delete restrict,

  section_name text not null,

  capacity integer
    check (capacity is null or capacity > 0),

  display_order integer not null default 1,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (class_year_id, section_name),

  unique (id, class_year_id)
);

-- ============================================================
-- 8. STUDENTS
-- ============================================================

create table public.students (
  id uuid primary key default gen_random_uuid(),

  student_number text not null unique,

  first_name text not null,
  middle_name text,
  last_name text,

  date_of_birth date,

  gender text,

  phone text,
  email text,

  address text,

  admission_date date,

  status public.student_status not null default 'ACTIVE',

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 9. PARENTS / GUARDIANS
-- ============================================================

create table public.guardians (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid unique
    references auth.users(id)
    on delete set null,

  first_name text not null,
  last_name text,

  relationship text,

  phone text,
  email text,

  address text,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_guardians (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  guardian_id uuid not null
    references public.guardians(id)
    on delete restrict,

  is_primary boolean not null default false,

  can_view_attendance boolean not null default true,
  can_view_fees boolean not null default true,
  can_view_academic_data boolean not null default true,

  created_at timestamptz not null default now(),

  unique (student_id, guardian_id)
);

-- ============================================================
-- 10. NEW ERP STAFF PROFILES
-- ============================================================

create table public.staff_profiles (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid not null unique
    references auth.users(id)
    on delete restrict,

  employee_number text unique,

  first_name text not null,
  last_name text,

  phone text,
  email text,

  designation text,

  status public.staff_status not null default 'ACTIVE',

  joined_date date,
  leaving_date date,

  -- Existing website-compatible fields
  bio text,
  photo_url text,
  initials text,
  accent text,
  display_order integer not null default 0,
  is_public boolean not null default false,

  -- Existing faculty portal compatibility
  assigned_class integer
    check (assigned_class is null or assigned_class between 1 and 10),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 11. ROLES
-- ============================================================

create table public.roles (
  id uuid primary key default gen_random_uuid(),

  role_key text not null unique,
  role_name text not null,

  description text,

  system_role boolean not null default false,

  created_at timestamptz not null default now()
);

insert into public.roles
(role_key, role_name, description, system_role)
values
(
  'PRINCIPAL',
  'Principal / Owner',
  'Full school-level administrative authority',
  true
),
(
  'VICE_PRINCIPAL',
  'Vice Principal',
  'Administrative authority assigned by principal',
  true
),
(
  'ACADEMIC_INCHARGE',
  'Academic Incharge',
  'Manages academic structure and enrollment operations',
  true
),
(
  'ATTENDANCE_INCHARGE',
  'Attendance Incharge',
  'Manages attendance operations',
  true
),
(
  'FEES_INCHARGE',
  'Fees Incharge',
  'Manages fee records and collections',
  true
),
(
  'OPERATIONS_INCHARGE',
  'Operations Incharge',
  'Manages assigned operational workflows',
  true
),
(
  'TEACHER',
  'Teacher',
  'Takes attendance and performs assigned teaching operations',
  true
),
(
  'STAFF',
  'Staff',
  'General staff account',
  true
);

-- ============================================================
-- 12. PERMISSIONS
-- ============================================================

create table public.permissions (
  id uuid primary key default gen_random_uuid(),

  permission_key text not null unique,
  permission_name text not null,

  description text,

  created_at timestamptz not null default now()
);

insert into public.permissions
(permission_key, permission_name, description)
values
('students.view', 'View Students', 'View student records'),
('students.create', 'Create Students', 'Create student records'),
('students.update', 'Update Students', 'Modify student records'),
('students.archive', 'Archive Students', 'Archive student records'),

('academic.view', 'View Academic Structure', 'View classes and sections'),
('academic.manage', 'Manage Academic Structure', 'Create/change classes, sections and capacities'),

('enrollment.view', 'View Enrollment', 'View enrollment records'),
('enrollment.manage', 'Manage Enrollment', 'Create and modify enrollment records'),
('enrollment.promote', 'Promote Students', 'Perform academic year promotion'),

('attendance.view', 'View Attendance', 'View attendance'),
('attendance.mark', 'Mark Attendance', 'Mark student attendance'),
('attendance.correct', 'Correct Attendance', 'Correct existing attendance'),
('attendance.manage', 'Manage Attendance', 'Manage attendance operations'),

('fees.view', 'View Fees', 'View fee information'),
('fees.manage', 'Manage Fees', 'Manage fee charges'),
('fees.record_payment', 'Record Fee Payment', 'Record manual fee payment'),
('fees.correct', 'Correct Fee Records', 'Correct fee records'),

('staff.view', 'View Staff', 'View staff'),
('staff.manage', 'Manage Staff', 'Manage staff accounts'),

('roles.view', 'View Roles', 'View roles'),
('roles.manage', 'Manage Roles', 'Manage roles and assignments'),

('calendar.view', 'View Calendar', 'View school calendar'),
('calendar.manage', 'Manage Calendar', 'Manage calendar'),

('reports.view', 'View Reports', 'View reports'),

('audit.view', 'View Audit Logs', 'View audit history'),

('migration.view', 'View Imports', 'View import jobs'),
('migration.manage', 'Manage Imports', 'Manage data migration/imports'),

('admissions.view', 'View Admissions', 'View admission enquiries'),
('admissions.manage', 'Manage Admissions', 'Manage admission enquiries and workflow'),

('website.manage', 'Manage Website Content', 'Manage public website content'),

('faculty.manage', 'Manage Faculty Content', 'Manage faculty-facing website content'),

('materials.manage', 'Manage Class Materials', 'Manage class materials')
;

-- ============================================================
-- 13. ROLE → PERMISSION
-- ============================================================

create table public.role_permissions (
  role_id uuid not null
    references public.roles(id)
    on delete cascade,

  permission_id uuid not null
    references public.permissions(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  primary key (role_id, permission_id)
);

-- Principal
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.role_key = 'PRINCIPAL';

-- Vice Principal
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'students.create',
    'students.update',
    'academic.view',
    'academic.manage',
    'enrollment.view',
    'enrollment.manage',
    'enrollment.promote',
    'attendance.view',
    'attendance.manage',
    'fees.view',
    'staff.view',
    'calendar.view',
    'calendar.manage',
    'reports.view',
    'audit.view',
    'admissions.view',
    'admissions.manage'
  )
where r.role_key = 'VICE_PRINCIPAL';

-- Academic Incharge
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'students.create',
    'students.update',
    'academic.view',
    'academic.manage',
    'enrollment.view',
    'enrollment.manage',
    'enrollment.promote',
    'calendar.view',
    'reports.view',
    'admissions.view',
    'admissions.manage'
  )
where r.role_key = 'ACADEMIC_INCHARGE';

-- Attendance Incharge
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'enrollment.view',
    'attendance.view',
    'attendance.mark',
    'attendance.correct',
    'attendance.manage',
    'calendar.view',
    'reports.view'
  )
where r.role_key = 'ATTENDANCE_INCHARGE';

-- Fees Incharge
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'enrollment.view',
    'fees.view',
    'fees.manage',
    'fees.record_payment',
    'fees.correct',
    'reports.view'
  )
where r.role_key = 'FEES_INCHARGE';

-- Operations Incharge
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'enrollment.view',
    'calendar.view',
    'calendar.manage',
    'reports.view',
    'admissions.view',
    'admissions.manage'
  )
where r.role_key = 'OPERATIONS_INCHARGE';

-- Teacher
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'enrollment.view',
    'attendance.view',
    'attendance.mark',
    'calendar.view',
    'materials.manage'
  )
where r.role_key = 'TEACHER';

-- General staff
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'calendar.view'
  )
where r.role_key = 'STAFF';

-- ============================================================
-- 14. STAFF ROLE ASSIGNMENTS
-- ============================================================

create table public.staff_roles (
  id uuid primary key default gen_random_uuid(),

  staff_id uuid not null
    references public.staff_profiles(id)
    on delete cascade,

  role_id uuid not null
    references public.roles(id)
    on delete restrict,

  starts_at timestamptz not null default now(),
  ends_at timestamptz,

  active boolean not null default true,

  created_at timestamptz not null default now(),

  constraint staff_role_dates_valid
    check (ends_at is null or ends_at > starts_at)
);

-- ============================================================
-- 15. STAFF SCOPES
-- ============================================================

create table public.staff_scopes (
  id uuid primary key default gen_random_uuid(),

  staff_role_id uuid not null
    references public.staff_roles(id)
    on delete cascade,

  scope_type public.scope_type not null,

  class_id uuid
    references public.classes(id)
    on delete restrict,

  section_id uuid
    references public.sections(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  constraint valid_scope_definition check (
    (scope_type = 'SCHOOL'
      and class_id is null
      and section_id is null)

    or

    (scope_type = 'CLASS'
      and class_id is not null
      and section_id is null)

    or

    (scope_type = 'SECTION'
      and section_id is not null)
  )
);

-- ============================================================
-- 16. ENROLLMENTS
-- ============================================================

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  class_year_id uuid not null
    references public.class_years(id)
    on delete restrict,

  section_id uuid not null,

  roll_number integer,

  status public.enrollment_status not null default 'ACTIVE',

  enrollment_date date not null default current_date,

  leaving_date date,

  previous_enrollment_id uuid
    references public.enrollments(id)
    on delete restrict,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint enrollment_section_matches_class_year
    foreign key (section_id, class_year_id)
    references public.sections(id, class_year_id)
    on delete restrict,

  constraint roll_number_positive
    check (roll_number is null or roll_number > 0)
);

create unique index one_active_enrollment_per_student_year
on public.enrollments(student_id, academic_year_id)
where status = 'ACTIVE';

create unique index unique_active_roll_number
on public.enrollments(academic_year_id, section_id, roll_number)
where status = 'ACTIVE'
  and roll_number is not null;

-- ============================================================
-- 17. CALENDAR
-- ============================================================

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  event_date date not null,

  event_type public.calendar_event_type not null,

  title text not null,

  description text,

  applies_to_all boolean not null default true,

  class_id uuid
    references public.classes(id)
    on delete restrict,

  section_id uuid
    references public.sections(id)
    on delete restrict,

  is_attendance_day boolean not null default false,

  created_by uuid
    references public.staff_profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint calendar_scope_valid check (
    applies_to_all = true
    or class_id is not null
    or section_id is not null
  )
);

create index calendar_events_date_idx
on public.calendar_events(event_date);

create index calendar_events_year_idx
on public.calendar_events(academic_year_id);

-- ============================================================
-- 18. ATTENDANCE
-- ============================================================

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),

  enrollment_id uuid not null
    references public.enrollments(id)
    on delete restrict,

  attendance_date date not null,

  status public.attendance_status not null,

  remarks text,

  marked_by uuid
    references public.staff_profiles(id)
    on delete set null,

  marked_at timestamptz not null default now(),

  corrected_at timestamptz,

  corrected_by uuid
    references public.staff_profiles(id)
    on delete set null,

  correction_reason text,

  sync_client_id text,
  sync_version bigint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (enrollment_id, attendance_date)
);

create index attendance_date_idx
on public.attendance_records(attendance_date);

create index attendance_enrollment_idx
on public.attendance_records(enrollment_id);

-- ============================================================
-- 19. FEE STRUCTURES
-- ============================================================

create table public.fee_structures (
  id uuid primary key default gen_random_uuid(),

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  class_year_id uuid
    references public.class_years(id)
    on delete restrict,

  fee_name text not null,

  amount numeric(12,2) not null
    check (amount >= 0),

  due_date date,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 20. STUDENT FEE CHARGES
-- ============================================================

create table public.fee_charges (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  fee_structure_id uuid
    references public.fee_structures(id)
    on delete restrict,

  charge_type public.fee_charge_type not null default 'REGULAR',

  description text not null,

  amount numeric(12,2) not null
    check (amount >= 0),

  concession_amount numeric(12,2) not null default 0
    check (concession_amount >= 0),

  due_date date,

  created_by uuid
    references public.staff_profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint concession_not_greater_than_amount
    check (concession_amount <= amount)
);

-- ============================================================
-- 21. FEE PAYMENTS
-- ============================================================

create table public.fee_payments (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  amount numeric(12,2) not null
    check (amount > 0),

  payment_date date not null default current_date,

  payment_method public.payment_method not null,

  reference_number text,

  receipt_number text unique,

  notes text,

  recorded_by uuid
    references public.staff_profiles(id)
    on delete set null,

  cancelled boolean not null default false,

  cancelled_at timestamptz,

  cancelled_by uuid
    references public.staff_profiles(id)
    on delete set null,

  cancellation_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fee_payments_student_idx
on public.fee_payments(student_id);

create index fee_payments_year_idx
on public.fee_payments(academic_year_id);

-- ============================================================
-- 23. AUDIT LOG
-- ============================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  actor_user_id uuid
    references auth.users(id)
    on delete set null,

  actor_staff_id uuid
    references public.staff_profiles(id)
    on delete set null,

  action public.audit_action not null,

  table_name text,

  record_id uuid,

  old_data jsonb,
  new_data jsonb,

  metadata jsonb not null default '{}'::jsonb,

  ip_address inet,

  user_agent text,

  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx
on public.audit_logs(actor_user_id);

create index audit_logs_table_record_idx
on public.audit_logs(table_name, record_id);

create index audit_logs_created_idx
on public.audit_logs(created_at);

-- ============================================================
-- 24. EXISTING WEBSITE AUTH USERS COMPATIBILITY
-- ============================================================
--
-- This table is retained because the existing website/faculty
-- portal already uses it.
--
-- The new ERP authorization model uses:
--
-- auth.users
--      ↓
-- staff_profiles
--      ↓
-- staff_roles
--      ↓
-- permissions
--
-- The old users table remains as a compatibility layer for the
-- existing application until the frontend is migrated.
-- ============================================================

-- create table public.users (
--   id uuid primary key
--     references auth.users(id)
--     on delete cascade,

--   email text not null unique,

--   role text not null
--     check (role = any (
--       array[
--         'admin'::text,
--         'faculty'::text
--       ]
--     )),

--   created_at timestamptz not null default now()
-- );

-- ============================================================
-- 25. EXISTING WEBSITE FACULTY DIRECTORY
-- ============================================================

-- create table public.faculty_members (
--   id uuid primary key default gen_random_uuid(),

--   name text not null,
--   role text not null,

--   bio text,

--   photo_url text,

--   initials text,

--   accent text,

--   display_order integer not null default 0,

--   is_active boolean not null default true,

--   created_at timestamptz not null default now()
-- );

-- ============================================================
-- 26. EXISTING FACULTY PORTAL PROFILE
-- ============================================================

-- create table public.faculty_profiles (
--   id uuid primary key default gen_random_uuid(),

--   user_id uuid not null unique
--     references public.users(id)
--     on delete cascade,

--   name text not null,

--   role text not null,

--   bio text,

--   photo_url text,

--   assigned_class integer not null
--     check (assigned_class between 1 and 10),

--   created_at timestamptz not null default now(),

--   updated_at timestamptz not null default now(),

--   is_active boolean not null default true
-- );

-- ============================================================
-- 27. EXISTING CLASS MATERIALS
-- ============================================================

-- create table public.class_materials (
--   id uuid primary key default gen_random_uuid(),

--   class_number integer not null
--     check (class_number >= 1 and class_number <= 10),

--   title text not null,

--   subject text not null,

--   description text not null default '',

--   file_url text not null,

--   file_name text not null,

--   created_at timestamptz not null default now(),

--   updated_at timestamptz not null default now(),

--   uploaded_by uuid
--     references public.users(id)
--     on delete set null
-- );

-- ============================================================
-- 28. EXISTING GALLERY
-- ============================================================

-- create table public.gallery_images (
--   id uuid primary key default gen_random_uuid(),

--   image_url text not null,

--   caption text not null,

--   span_class text,

--   display_order integer not null default 0,

--   is_active boolean not null default true,

--   created_at timestamptz not null default now()
-- );

-- ============================================================
-- 29. EXISTING ADMISSION ENQUIRIES
-- ============================================================

-- create table public.admission_enquiries (
--   id uuid primary key default gen_random_uuid(),

--   parent_name text not null,

--   email text not null,

--   phone text not null,

--   student_name text not null,

--   grade text not null,

--   message text,

--   created_at timestamptz not null default now(),

--   status text not null default 'New'
--     check (
--       status = any (
--         array[
--           'New'::text,
--           'Contacted'::text,
--           'Visit Scheduled'::text,
--           'Enrolled'::text,
--           'Rejected'::text
--         ]
--       )
--     ),

--   notes text
-- );

-- ============================================================
-- 30. GENERIC UPDATED-AT FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 31. UPDATED-AT TRIGGERS
-- ============================================================

create trigger set_updated_at_school_config
before update on public.school_config
for each row execute function public.set_updated_at();

create trigger set_updated_at_school_modules
before update on public.school_modules
for each row execute function public.set_updated_at();

create trigger set_updated_at_academic_years
before update on public.academic_years
for each row execute function public.set_updated_at();

create trigger set_updated_at_classes
before update on public.classes
for each row execute function public.set_updated_at();

create trigger set_updated_at_class_years
before update on public.class_years
for each row execute function public.set_updated_at();

create trigger set_updated_at_sections
before update on public.sections
for each row execute function public.set_updated_at();

create trigger set_updated_at_students
before update on public.students
for each row execute function public.set_updated_at();

create trigger set_updated_at_guardians
before update on public.guardians
for each row execute function public.set_updated_at();

create trigger set_updated_at_staff_profiles
before update on public.staff_profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at_enrollments
before update on public.enrollments
for each row execute function public.set_updated_at();

create trigger set_updated_at_calendar
before update on public.calendar_events
for each row execute function public.set_updated_at();

create trigger set_updated_at_attendance
before update on public.attendance_records
for each row execute function public.set_updated_at();

create trigger set_updated_at_fee_structures
before update on public.fee_structures
for each row execute function public.set_updated_at();

create trigger set_updated_at_fee_charges
before update on public.fee_charges
for each row execute function public.set_updated_at();

create trigger set_updated_at_fee_payments
before update on public.fee_payments
for each row execute function public.set_updated_at();

create trigger set_updated_at_import_jobs
before update on public.import_jobs
for each row execute function public.set_updated_at();

create trigger set_updated_at_faculty_profiles
before update on public.faculty_profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at_class_materials
before update on public.class_materials
for each row execute function public.set_updated_at();

-- ============================================================
-- 32. PERMISSION HELPER
-- ============================================================

create or replace function public.user_has_permission(
  requested_permission text
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    join public.staff_roles sr
      on sr.staff_id = sp.id
    join public.role_permissions rp
      on rp.role_id = sr.role_id
    join public.permissions p
      on p.id = rp.permission_id
    where sp.auth_user_id = auth.uid()
      and sp.status = 'ACTIVE'
      and sr.active = true
      and sr.starts_at <= now()
      and (
        sr.ends_at is null
        or sr.ends_at > now()
      )
      and p.permission_key = requested_permission
  );
$$;

-- ============================================================
-- 33. PRINCIPAL CHECK
-- ============================================================

create or replace function public.is_principal()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    join public.staff_roles sr
      on sr.staff_id = sp.id
    join public.roles r
      on r.id = sr.role_id
    where sp.auth_user_id = auth.uid()
      and sp.status = 'ACTIVE'
      and sr.active = true
      and r.role_key = 'PRINCIPAL'
      and sr.starts_at <= now()
      and (
        sr.ends_at is null
        or sr.ends_at > now()
      )
  );
$$;

-- ============================================================
-- 34. AUDIT FUNCTION
-- ============================================================

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_staff uuid;
  record_uuid uuid;
begin

  select id
  into actor_staff
  from public.staff_profiles
  where auth_user_id = auth.uid()
  limit 1;

  if tg_op = 'INSERT' then

    record_uuid := (to_jsonb(new)->>'id')::uuid;

    insert into public.audit_logs (
      actor_user_id,
      actor_staff_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    )
    values (
      auth.uid(),
      actor_staff,
      'INSERT',
      tg_table_name,
      record_uuid,
      null,
      to_jsonb(new)
    );

    return new;

  elsif tg_op = 'UPDATE' then

    record_uuid := (to_jsonb(new)->>'id')::uuid;

    insert into public.audit_logs (
      actor_user_id,
      actor_staff_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    )
    values (
      auth.uid(),
      actor_staff,
      'UPDATE',
      tg_table_name,
      record_uuid,
      to_jsonb(old),
      to_jsonb(new)
    );

    return new;

  elsif tg_op = 'DELETE' then

    record_uuid := (to_jsonb(old)->>'id')::uuid;

    insert into public.audit_logs (
      actor_user_id,
      actor_staff_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    )
    values (
      auth.uid(),
      actor_staff,
      'DELETE',
      tg_table_name,
      record_uuid,
      to_jsonb(old),
      null
    );

    return old;

  end if;

  return null;
end;
$$;

-- ============================================================
-- 35. AUDIT TRIGGERS
-- ============================================================

create trigger audit_students
after insert or update or delete on public.students
for each row execute function public.write_audit_log();

create trigger audit_guardians
after insert or update or delete on public.guardians
for each row execute function public.write_audit_log();

create trigger audit_student_guardians
after insert or update or delete on public.student_guardians
for each row execute function public.write_audit_log();

create trigger audit_staff
after insert or update or delete on public.staff_profiles
for each row execute function public.write_audit_log();

create trigger audit_enrollments
after insert or update or delete on public.enrollments
for each row execute function public.write_audit_log();

create trigger audit_attendance
after insert or update or delete on public.attendance_records
for each row execute function public.write_audit_log();

create trigger audit_fee_charges
after insert or update or delete on public.fee_charges
for each row execute function public.write_audit_log();

create trigger audit_fee_payments
after insert or update or delete on public.fee_payments
for each row execute function public.write_audit_log();

create trigger audit_staff_roles
after insert or update or delete on public.staff_roles
for each row execute function public.write_audit_log();

-- ============================================================
-- 36. ENABLE RLS — ERP TABLES
-- ============================================================

alter table public.school_config enable row level security;
alter table public.school_modules enable row level security;
alter table public.academic_years enable row level security;
alter table public.classes enable row level security;
alter table public.class_years enable row level security;
alter table public.sections enable row level security;
alter table public.students enable row level security;
alter table public.guardians enable row level security;
alter table public.student_guardians enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.staff_roles enable row level security;
alter table public.staff_scopes enable row level security;
alter table public.enrollments enable row level security;
alter table public.calendar_events enable row level security;
alter table public.attendance_records enable row level security;
alter table public.fee_structures enable row level security;
alter table public.fee_charges enable row level security;
alter table public.fee_payments enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;
alter table public.audit_logs enable row level security;

-- ============================================================
-- 37. ERP RLS POLICIES
-- ============================================================

create policy school_config_read
on public.school_config
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or public.is_principal()
);

create policy school_config_manage
on public.school_config
for all
to authenticated
using (public.is_principal())
with check (public.is_principal());

create policy school_modules_read
on public.school_modules
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or public.is_principal()
);

create policy school_modules_manage
on public.school_modules
for all
to authenticated
using (public.is_principal())
with check (public.is_principal());

create policy academic_years_read
on public.academic_years
for select
to authenticated
using (
  public.user_has_permission('academic.view')
);

create policy academic_years_manage
on public.academic_years
for all
to authenticated
using (public.user_has_permission('academic.manage'))
with check (public.user_has_permission('academic.manage'));

create policy classes_read
on public.classes
for select
to authenticated
using (
  public.user_has_permission('academic.view')
);

create policy classes_manage
on public.classes
for all
to authenticated
using (public.user_has_permission('academic.manage'))
with check (public.user_has_permission('academic.manage'));

create policy class_years_read
on public.class_years
for select
to authenticated
using (
  public.user_has_permission('academic.view')
);

create policy class_years_manage
on public.class_years
for all
to authenticated
using (public.user_has_permission('academic.manage'))
with check (public.user_has_permission('academic.manage'));

create policy sections_read
on public.sections
for select
to authenticated
using (
  public.user_has_permission('academic.view')
);

create policy sections_manage
on public.sections
for all
to authenticated
using (public.user_has_permission('academic.manage'))
with check (public.user_has_permission('academic.manage'));

create policy students_read
on public.students
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or exists (
    select 1
    from public.student_guardians sg
    join public.guardians g
      on g.id = sg.guardian_id
    where sg.student_id = students.id
      and g.auth_user_id = auth.uid()
      and g.active = true
  )
);

create policy students_insert
on public.students
for insert
to authenticated
with check (
  public.user_has_permission('students.create')
);

create policy students_update
on public.students
for update
to authenticated
using (
  public.user_has_permission('students.update')
)
with check (
  public.user_has_permission('students.update')
);

create policy guardians_read
on public.guardians
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or auth_user_id = auth.uid()
);

create policy guardians_manage
on public.guardians
for all
to authenticated
using (
  public.user_has_permission('students.update')
)
with check (
  public.user_has_permission('students.update')
);

create policy student_guardians_read
on public.student_guardians
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or exists (
    select 1
    from public.guardians g
    where g.id = student_guardians.guardian_id
      and g.auth_user_id = auth.uid()
  )
);

create policy student_guardians_manage
on public.student_guardians
for all
to authenticated
using (
  public.user_has_permission('students.update')
)
with check (
  public.user_has_permission('students.update')
);

create policy staff_profiles_read
on public.staff_profiles
for select
to authenticated
using (
  public.user_has_permission('staff.view')
  or auth_user_id = auth.uid()
);

create policy staff_profiles_manage
on public.staff_profiles
for all
to authenticated
using (
  public.user_has_permission('staff.manage')
)
with check (
  public.user_has_permission('staff.manage')
);

create policy roles_read
on public.roles
for select
to authenticated
using (
  public.user_has_permission('roles.view')
);

create policy roles_manage
on public.roles
for all
to authenticated
using (
  public.user_has_permission('roles.manage')
)
with check (
  public.user_has_permission('roles.manage')
);

create policy permissions_read
on public.permissions
for select
to authenticated
using (
  public.user_has_permission('roles.view')
);

create policy role_permissions_read
on public.role_permissions
for select
to authenticated
using (
  public.user_has_permission('roles.view')
);

create policy role_permissions_manage
on public.role_permissions
for all
to authenticated
using (
  public.user_has_permission('roles.manage')
)
with check (
  public.user_has_permission('roles.manage')
);

create policy staff_roles_read
on public.staff_roles
for select
to authenticated
using (
  public.user_has_permission('roles.view')
  or exists (
    select 1
    from public.staff_profiles sp
    where sp.id = staff_roles.staff_id
      and sp.auth_user_id = auth.uid()
  )
);

create policy staff_roles_manage
on public.staff_roles
for all
to authenticated
using (
  public.user_has_permission('roles.manage')
)
with check (
  public.user_has_permission('roles.manage')
);

create policy staff_scopes_read
on public.staff_scopes
for select
to authenticated
using (
  public.user_has_permission('roles.view')
);

create policy staff_scopes_manage
on public.staff_scopes
for all
to authenticated
using (
  public.user_has_permission('roles.manage')
)
with check (
  public.user_has_permission('roles.manage')
);

create policy enrollments_read
on public.enrollments
for select
to authenticated
using (
  public.user_has_permission('enrollment.view')
  or exists (
    select 1
    from public.student_guardians sg
    join public.guardians g
      on g.id = sg.guardian_id
    where sg.student_id = enrollments.student_id
      and g.auth_user_id = auth.uid()
      and g.active = true
  )
);

create policy enrollments_manage
on public.enrollments
for all
to authenticated
using (
  public.user_has_permission('enrollment.manage')
)
with check (
  public.user_has_permission('enrollment.manage')
);

create policy calendar_read
on public.calendar_events
for select
to authenticated
using (
  public.user_has_permission('calendar.view')
);

create policy calendar_manage
on public.calendar_events
for all
to authenticated
using (
  public.user_has_permission('calendar.manage')
)
with check (
  public.user_has_permission('calendar.manage')
);

create policy attendance_read
on public.attendance_records
for select
to authenticated
using (
  public.user_has_permission('attendance.view')
  or exists (
    select 1
    from public.enrollments e
    join public.student_guardians sg
      on sg.student_id = e.student_id
    join public.guardians g
      on g.id = sg.guardian_id
    where e.id = attendance_records.enrollment_id
      and g.auth_user_id = auth.uid()
      and g.active = true
      and sg.can_view_attendance = true
  )
);

create policy attendance_insert
on public.attendance_records
for insert
to authenticated
with check (
  public.user_has_permission('attendance.mark')
  or public.user_has_permission('attendance.manage')
);

create policy attendance_update
on public.attendance_records
for update
to authenticated
using (
  public.user_has_permission('attendance.correct')
  or public.user_has_permission('attendance.manage')
)
with check (
  public.user_has_permission('attendance.correct')
  or public.user_has_permission('attendance.manage')
);

create policy fee_structures_read
on public.fee_structures
for select
to authenticated
using (
  public.user_has_permission('fees.view')
);

create policy fee_structures_manage
on public.fee_structures
for all
to authenticated
using (
  public.user_has_permission('fees.manage')
)
with check (
  public.user_has_permission('fees.manage')
);

create policy fee_charges_read
on public.fee_charges
for select
to authenticated
using (
  public.user_has_permission('fees.view')
  or exists (
    select 1
    from public.student_guardians sg
    join public.guardians g
      on g.id = sg.guardian_id
    where sg.student_id = fee_charges.student_id
      and g.auth_user_id = auth.uid()
      and g.active = true
      and sg.can_view_fees = true
  )
);

create policy fee_charges_manage
on public.fee_charges
for all
to authenticated
using (
  public.user_has_permission('fees.manage')
)
with check (
  public.user_has_permission('fees.manage')
);

create policy fee_payments_read
on public.fee_payments
for select
to authenticated
using (
  public.user_has_permission('fees.view')
  or exists (
    select 1
    from public.student_guardians sg
    join public.guardians g
      on g.id = sg.guardian_id
    where sg.student_id = fee_payments.student_id
      and g.auth_user_id = auth.uid()
      and g.active = true
      and sg.can_view_fees = true
  )
);

create policy fee_payments_insert
on public.fee_payments
for insert
to authenticated
with check (
  public.user_has_permission('fees.record_payment')
);

create policy fee_payments_update
on public.fee_payments
for update
to authenticated
using (
  public.user_has_permission('fees.correct')
)
with check (
  public.user_has_permission('fees.correct')
);

create policy import_jobs_read
on public.import_jobs
for select
to authenticated
using (
  public.user_has_permission('migration.view')
);

create policy import_jobs_manage
on public.import_jobs
for all
to authenticated
using (
  public.user_has_permission('migration.manage')
)
with check (
  public.user_has_permission('migration.manage')
);

create policy import_rows_read
on public.import_rows
for select
to authenticated
using (
  public.user_has_permission('migration.view')
);

create policy import_rows_manage
on public.import_rows
for all
to authenticated
using (
  public.user_has_permission('migration.manage')
)
with check (
  public.user_has_permission('migration.manage')
);

create policy audit_read
on public.audit_logs
for select
to authenticated
using (
  public.user_has_permission('audit.view')
);

-- ============================================================
-- 39. INDEXES
-- ============================================================

create index enrollments_student_idx
on public.enrollments(student_id);

create index enrollments_class_year_idx
on public.enrollments(class_year_id);

create index enrollments_section_idx
on public.enrollments(section_id);

create index sections_class_year_idx
on public.sections(class_year_id);

create index staff_roles_staff_idx
on public.staff_roles(staff_id);

create index staff_scopes_role_idx
on public.staff_scopes(staff_role_id);

create index student_guardians_student_idx
on public.student_guardians(student_id);

create index student_guardians_guardian_idx
on public.student_guardians(guardian_id);

create index class_materials_class_idx
on public.class_materials(class_number);

create index class_materials_uploaded_by_idx
on public.class_materials(uploaded_by);

create index faculty_members_display_order_idx
on public.faculty_members(display_order);

create index gallery_images_display_order_idx
on public.gallery_images(display_order);

create index admission_enquiries_status_idx
on public.admission_enquiries(status);

create index admission_enquiries_created_at_idx
on public.admission_enquiries(created_at);

-- ============================================================
-- 40. INITIAL MODULES
-- ============================================================

insert into public.school_modules
(module_key, module_name, enabled)
values
('students', 'Student Management', true),
('admissions', 'Admissions', true),
('academics', 'Academic Management', true),
('attendance', 'Attendance', true),
('fees', 'Fee Management', true),
('parents', 'Parent Portal', true),
('staff', 'Staff Management', true),
('calendar', 'School Calendar', true),
('reports', 'Reports', true),
('audit', 'Audit System', true),
('migration', 'Data Migration', true),
('notifications', 'Notifications', false),
('website', 'Public Website', true),
('faculty_portal', 'Faculty Portal', true),
('gallery', 'Gallery', true),
('class_materials', 'Class Materials', true);

-- ============================================================
-- 41. DEFAULT SCHOOL CONFIG
-- ============================================================

insert into public.school_config (
  school_code,
  school_name,
  timezone
)
values (
  'HYDERABAD_SCHOOL',
  'Hyderabad School',
  'Asia/Kolkata'
);

-- ============================================================
-- 42. DEFAULT CLASS MASTER
-- ============================================================

insert into public.classes
(class_code, class_name, display_order)
values
('CLASS_01', 'Class 1', 1),
('CLASS_02', 'Class 2', 2),
('CLASS_03', 'Class 3', 3),
('CLASS_04', 'Class 4', 4),
('CLASS_05', 'Class 5', 5),
('CLASS_06', 'Class 6', 6),
('CLASS_07', 'Class 7', 7),
('CLASS_08', 'Class 8', 8),
('CLASS_09', 'Class 9', 9),
('CLASS_10', 'Class 10', 10);

-- ============================================================

commit;

-- ═══════════════════════════════════════
-- Source: 20260820000000_fix_users_rls_recursion.sql
-- ═══════════════════════════════════════
-- Fix infinite recursion in public.users RLS policies.
--
-- Problem: policies like users_admin_manage query public.users inside
-- a policy ON public.users, which re-triggers RLS and loops forever.
--
-- Fix: use SECURITY DEFINER helpers (is_admin / is_faculty) that bypass
-- RLS when checking the caller's role.

-- ---------------------------------------------------------------------------
-- Role helpers (legacy website auth model)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'faculty'
  );
$$;

-- ---------------------------------------------------------------------------
-- public.users
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS users_self_read ON public.users;
DROP POLICY IF EXISTS users_admin_manage ON public.users;

CREATE POLICY users_self_read
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY users_admin_manage
  ON public.users
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- faculty_members
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS faculty_members_public_read ON public.faculty_members;
DROP POLICY IF EXISTS faculty_members_admin_manage ON public.faculty_members;

CREATE POLICY faculty_members_public_read
  ON public.faculty_members
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY faculty_members_admin_manage
  ON public.faculty_members
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- faculty_profiles
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS faculty_profiles_self_read ON public.faculty_profiles;
DROP POLICY IF EXISTS faculty_profiles_self_update ON public.faculty_profiles;
DROP POLICY IF EXISTS faculty_profiles_admin_insert ON public.faculty_profiles;
DROP POLICY IF EXISTS faculty_profiles_admin_delete ON public.faculty_profiles;

CREATE POLICY faculty_profiles_self_read
  ON public.faculty_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY faculty_profiles_self_update
  ON public.faculty_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY faculty_profiles_admin_insert
  ON public.faculty_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY faculty_profiles_admin_delete
  ON public.faculty_profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- class_materials
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS class_materials_public_read ON public.class_materials;
DROP POLICY IF EXISTS class_materials_faculty_manage ON public.class_materials;
DROP POLICY IF EXISTS class_materials_faculty_update ON public.class_materials;
DROP POLICY IF EXISTS class_materials_faculty_delete ON public.class_materials;

CREATE POLICY class_materials_public_read
  ON public.class_materials
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY class_materials_faculty_manage
  ON public.class_materials
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.is_faculty());

CREATE POLICY class_materials_faculty_update
  ON public.class_materials
  FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_admin())
  WITH CHECK (uploaded_by = auth.uid() OR public.is_admin());

CREATE POLICY class_materials_faculty_delete
  ON public.class_materials
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- gallery_images
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS gallery_public_read ON public.gallery_images;
DROP POLICY IF EXISTS gallery_admin_manage ON public.gallery_images;

CREATE POLICY gallery_public_read
  ON public.gallery_images
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY gallery_admin_manage
  ON public.gallery_images
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- admission_enquiries
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS admission_enquiries_public_insert ON public.admission_enquiries;
DROP POLICY IF EXISTS admission_enquiries_admin_read ON public.admission_enquiries;
DROP POLICY IF EXISTS admission_enquiries_admin_update ON public.admission_enquiries;
DROP POLICY IF EXISTS admission_enquiries_admin_delete ON public.admission_enquiries;

CREATE POLICY admission_enquiries_public_insert
  ON public.admission_enquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY admission_enquiries_admin_read
  ON public.admission_enquiries
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY admission_enquiries_admin_update
  ON public.admission_enquiries
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY admission_enquiries_admin_delete
  ON public.admission_enquiries
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ═══════════════════════════════════════
-- Source: 20260820100000_consolidate_staff_schema.sql
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- Source: 20260820200000_contact_enquiries.sql
-- ═══════════════════════════════════════
-- Sprint D: Contact form enquiries (CMS table, mirrors admission_enquiries pattern)

CREATE TABLE IF NOT EXISTS public.contact_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Contacted', 'Resolved')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_enquiries_public_insert ON public.contact_enquiries;
DROP POLICY IF EXISTS contact_enquiries_admin_read ON public.contact_enquiries;
DROP POLICY IF EXISTS contact_enquiries_admin_update ON public.contact_enquiries;
DROP POLICY IF EXISTS contact_enquiries_admin_delete ON public.contact_enquiries;

CREATE POLICY contact_enquiries_public_insert
  ON public.contact_enquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY contact_enquiries_admin_read
  ON public.contact_enquiries
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY contact_enquiries_admin_update
  ON public.contact_enquiries
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY contact_enquiries_admin_delete
  ON public.contact_enquiries
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ═══════════════════════════════════════
-- Source: 20260820300000_contact_enquiries_and_erp_admin_bridge.sql
-- ═══════════════════════════════════════
-- Sprint D contact table + ERP admin access bridge
--
-- Run this in Supabase SQL Editor if you see:
--   "Could not find the table public.contact_enquiries"
-- or attendance/calendar/fees pages fail with permission / missing table errors.
--
-- Safe to re-run (idempotent where possible).

begin;

-- ---------------------------------------------------------------------------
-- 1. contact_enquiries (Sprint D — NOT in consolidated ERP SQL)
-- ---------------------------------------------------------------------------

create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Resolved')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.contact_enquiries enable row level security;

drop policy if exists contact_enquiries_public_insert on public.contact_enquiries;
drop policy if exists contact_enquiries_admin_read on public.contact_enquiries;
drop policy if exists contact_enquiries_admin_update on public.contact_enquiries;
drop policy if exists contact_enquiries_admin_delete on public.contact_enquiries;

create policy contact_enquiries_public_insert
  on public.contact_enquiries
  for insert
  to anon, authenticated
  with check (true);

create policy contact_enquiries_admin_read
  on public.contact_enquiries
  for select
  to authenticated
  using (public.is_admin());

create policy contact_enquiries_admin_update
  on public.contact_enquiries
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy contact_enquiries_admin_delete
  on public.contact_enquiries
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Ensure login staff without roles get PRINCIPAL (common after manual setup)
-- ---------------------------------------------------------------------------

insert into public.staff_roles (staff_id, role_id)
select sp.id, r.id
from public.staff_profiles sp
cross join public.roles r
where r.role_key = 'PRINCIPAL'
  and sp.auth_user_id is not null
  and sp.status = 'ACTIVE'
  and not exists (
    select 1
    from public.staff_roles sr
    where sr.staff_id = sp.id
      and sr.active = true
  );

-- ---------------------------------------------------------------------------
-- 3. Bridge ERP RLS: is_admin() OR existing permission policies
--    (admin UI uses staff PRINCIPAL; policies also accept is_admin())
-- ---------------------------------------------------------------------------

-- Calendar
drop policy if exists calendar_admin_bridge on public.calendar_events;
create policy calendar_admin_bridge
  on public.calendar_events
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Attendance
drop policy if exists attendance_admin_select on public.attendance_records;
create policy attendance_admin_select
  on public.attendance_records
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists attendance_admin_insert on public.attendance_records;
create policy attendance_admin_insert
  on public.attendance_records
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists attendance_admin_update on public.attendance_records;
create policy attendance_admin_update
  on public.attendance_records
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Fees
drop policy if exists fee_structures_admin_bridge on public.fee_structures;
create policy fee_structures_admin_bridge
  on public.fee_structures
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists fee_charges_admin_bridge on public.fee_charges;
create policy fee_charges_admin_bridge
  on public.fee_charges
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists fee_payments_admin_bridge on public.fee_payments;
create policy fee_payments_admin_bridge
  on public.fee_payments
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Audit
drop policy if exists audit_admin_bridge on public.audit_logs;
create policy audit_admin_bridge
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin());

commit;

-- ---------------------------------------------------------------------------
-- 4. After running, reload PostgREST schema cache (Supabase usually auto-reloads)
-- Dashboard → Settings → API → Reload schema cache (if available)
-- Or wait ~1 minute and hard-refresh the app.
-- ---------------------------------------------------------------------------

-- ═══════════════════════════════════════
-- Source: 20260820400000_expand_app_roles_for_staff.sql
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- Source: 20260820500000_guardians_admin_bridge.sql
-- ═══════════════════════════════════════
-- Sprint I: ensure admin portal can manage guardians / links
-- Additive only — does not redesign tables.

begin;

drop policy if exists guardians_admin_bridge on public.guardians;
create policy guardians_admin_bridge
  on public.guardians
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists student_guardians_admin_bridge on public.student_guardians;
create policy student_guardians_admin_bridge
  on public.student_guardians
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

commit;

-- ═══════════════════════════════════════
-- Source: 20260820600000_role_portal_allotments.sql
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- Source: 20260820700000_fix_staff_profiles_directory_rls.sql
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- Source: 20260820800000_parent_portal_and_import.sql
-- ═══════════════════════════════════════
-- Sprint J + K: Parent read RLS + Import Centre tables

begin;

-- ---------------------------------------------------------------------------
-- Parent helpers (security definer — no RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function public.current_guardian_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select g.id
  from public.guardians g
  where g.auth_user_id = auth.uid()
    and g.active = true
  limit 1;
$$;

grant execute on function public.current_guardian_id() to authenticated;

create or replace function public.guardian_can_view_student(
  p_student_id uuid,
  p_permission text default 'any'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_guardians sg
    where sg.guardian_id = public.current_guardian_id()
      and sg.student_id = p_student_id
      and (
        p_permission = 'any'
        or (p_permission = 'attendance' and sg.can_view_attendance)
        or (p_permission = 'fees' and sg.can_view_fees)
        or (p_permission = 'academic' and sg.can_view_academic_data)
      )
  );
$$;

grant execute on function public.guardian_can_view_student(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Parent read policies
-- ---------------------------------------------------------------------------

drop policy if exists guardians_self_read on public.guardians;
create policy guardians_self_read
  on public.guardians
  for select
  to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists student_guardians_parent_read on public.student_guardians;
create policy student_guardians_parent_read
  on public.student_guardians
  for select
  to authenticated
  using (guardian_id = public.current_guardian_id());

drop policy if exists students_parent_read on public.students;
create policy students_parent_read
  on public.students
  for select
  to authenticated
  using (public.guardian_can_view_student(id, 'any'));

drop policy if exists enrollments_parent_read on public.enrollments;
create policy enrollments_parent_read
  on public.enrollments
  for select
  to authenticated
  using (public.guardian_can_view_student(student_id, 'academic'));

drop policy if exists attendance_parent_read on public.attendance_records;
create policy attendance_parent_read
  on public.attendance_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = attendance_records.enrollment_id
        and public.guardian_can_view_student(e.student_id, 'attendance')
    )
  );

drop policy if exists fee_charges_parent_read on public.fee_charges;
create policy fee_charges_parent_read
  on public.fee_charges
  for select
  to authenticated
  using (public.guardian_can_view_student(student_id, 'fees'));

drop policy if exists fee_payments_parent_read on public.fee_payments;
create policy fee_payments_parent_read
  on public.fee_payments
  for select
  to authenticated
  using (public.guardian_can_view_student(student_id, 'fees'));

-- ---------------------------------------------------------------------------
-- Import Centre (Sprint K)
-- ---------------------------------------------------------------------------
-- Consolidated ERP schema may already define import_jobs/import_rows with a
-- different column layout (e.g. import_job_id). Drop and recreate so the app
-- schema matches. Safe while Import Centre has no production data yet.

drop table if exists public.import_rows cascade;
drop table if exists public.import_jobs cascade;

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in ('ADMISSIONS', 'GUARDIAN_LINK')),
  file_name text not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'VALIDATED', 'COMMITTED', 'FAILED')),
  row_count int not null default 0,
  valid_count int not null default 0,
  error_count int not null default 0,
  created_by_staff_id uuid references public.staff_profiles (id) on delete set null,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.import_jobs (id) on delete cascade,
  row_number int not null,
  raw_data jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'VALID', 'ERROR', 'COMMITTED', 'SKIPPED')),
  error_message text,
  target_student_id uuid references public.students (id) on delete set null,
  target_guardian_id uuid references public.guardians (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists import_rows_job_idx on public.import_rows (job_id);

alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;

drop policy if exists import_jobs_admin on public.import_jobs;
create policy import_jobs_admin
  on public.import_jobs
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists import_rows_admin on public.import_rows;
create policy import_rows_admin
  on public.import_rows
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

commit;

-- ═══════════════════════════════════════
-- Source: 20260820900000_teacher_attendance_rls.sql
-- ═══════════════════════════════════════
-- Sprint P: Teacher + secondary-cover attendance write scope (RLS)

begin;

create or replace function public.current_staff_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select sp.id
  from public.staff_profiles sp
  where sp.auth_user_id = auth.uid()
    and sp.status = 'ACTIVE'
  limit 1;
$$;

grant execute on function public.current_staff_profile_id() to authenticated;

create or replace function public.staff_can_mark_attendance(
  p_enrollment_id uuid,
  p_attendance_date date
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.enrollments e
      join public.attendance_teacher_allotments ata
        on ata.section_id = e.section_id
       and ata.academic_year_id = e.academic_year_id
       and ata.active = true
       and ata.teacher_staff_id = public.current_staff_profile_id()
      where e.id = p_enrollment_id
    )
    or exists (
      select 1
      from public.enrollments e
      join public.attendance_teacher_allotments ata
        on ata.section_id = e.section_id
       and ata.academic_year_id = e.academic_year_id
       and ata.active = true
      join public.secondary_teacher_allotments sec
        on sec.primary_staff_id = ata.teacher_staff_id
       and sec.secondary_staff_id = public.current_staff_profile_id()
       and sec.active = true
       and sec.starts_on <= p_attendance_date
       and sec.ends_on >= p_attendance_date
      where e.id = p_enrollment_id
    );
$$;

grant execute on function public.staff_can_mark_attendance(uuid, date) to authenticated;

drop policy if exists attendance_teacher_select on public.attendance_records;
create policy attendance_teacher_select
  on public.attendance_records
  for select
  to authenticated
  using (public.staff_can_mark_attendance(enrollment_id, attendance_date));

drop policy if exists attendance_teacher_insert on public.attendance_records;
create policy attendance_teacher_insert
  on public.attendance_records
  for insert
  to authenticated
  with check (public.staff_can_mark_attendance(enrollment_id, attendance_date));

drop policy if exists attendance_teacher_update on public.attendance_records;
create policy attendance_teacher_update
  on public.attendance_records
  for update
  to authenticated
  using (public.staff_can_mark_attendance(enrollment_id, attendance_date))
  with check (public.staff_can_mark_attendance(enrollment_id, attendance_date));

commit;

-- ═══════════════════════════════════════
-- Source: 20260821000000_parent_guardian_self_update.sql
-- ═══════════════════════════════════════
-- Sprint R: Parent self-service profile update

begin;

drop policy if exists guardians_self_update on public.guardians;
create policy guardians_self_update
  on public.guardians
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

commit;

-- ═══════════════════════════════════════
-- Source: 20260821100000_fix_staff_login_role_resolution.sql
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- Source: 20260821120000_ensure_principal_login_role.sql
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- Source: consolidated-erp-extract.sql
-- ═══════════════════════════════════════
-- ============================================================
-- HYDERABAD SCHOOL
-- CONSOLIDATED SCHOOL MANAGEMENT PLATFORM
-- SUPABASE / POSTGRESQL
--
-- Fresh database schema
--
-- Includes:
--   1. New School ERP foundation
--   2. Existing Hyderabad School website/CMS schema
--   3. Existing faculty portal compatibility
--   4. Admissions enquiries
--   5. Gallery
--   6. Class materials
--   7. RBAC / permissions / scopes
--   8. Attendance
--   9. Fees
--  10. Migration staging
--  11. Audit trail
--
-- IMPORTANT:
-- Run on a FRESH Supabase database.
-- ============================================================

begin;

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

create type public.academic_year_status as enum (
  'PLANNING',
  'ACTIVE',
  'CLOSED',
  'ARCHIVED'
);

create type public.student_status as enum (
  'ACTIVE',
  'WITHDRAWN',
  'TRANSFERRED',
  'GRADUATED',
  'ARCHIVED'
);

create type public.enrollment_status as enum (
  'ACTIVE',
  'PROMOTED',
  'REPEATED',
  'TRANSFERRED',
  'WITHDRAWN',
  'COMPLETED'
);

create type public.calendar_event_type as enum (
  'WORKING_DAY',
  'HOLIDAY',
  'SPECIAL_WORKING_DAY',
  'EXAM',
  'EVENT',
  'SCHOOL_CLOSURE'
);

create type public.attendance_status as enum (
  'PRESENT',
  'ABSENT',
  'LATE',
  'LEAVE',
  'HALF_DAY',
  'EXCUSED'
);

create type public.fee_charge_type as enum (
  'REGULAR',
  'ONE_TIME',
  'ADJUSTMENT',
  'CONCESSION'
);

create type public.payment_method as enum (
  'CASH',
  'UPI',
  'BANK_TRANSFER',
  'CHEQUE',
  'OTHER'
);

create type public.staff_status as enum (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'LEFT'
);

create type public.scope_type as enum (
  'SCHOOL',
  'CLASS',
  'SECTION'
);

create type public.import_status as enum (
  'UPLOADED',
  'VALIDATING',
  'VALIDATED',
  'FAILED',
  'APPROVED',
  'IMPORTED',
  'CANCELLED'
);

create type public.audit_action as enum (
  'INSERT',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'IMPORT',
  'EXPORT',
  'APPROVE',
  'REJECT',
  'ASSIGN',
  'UNASSIGN',
  'OTHER'
);

-- ============================================================
-- 2. SCHOOL CONFIGURATION
-- ============================================================

create table public.school_config (
  id uuid primary key default gen_random_uuid(),

  school_code text not null unique,
  school_name text not null,

  logo_url text,
  favicon_url text,

  address text,
  city text,
  state text,
  postal_code text,

  phone text,
  email text,
  website text,

  timezone text not null default 'Asia/Kolkata',

  academic_year_start_month smallint
    check (academic_year_start_month between 1 and 12),

  academic_year_end_month smallint
    check (academic_year_end_month between 1 and 12),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. MODULE CONFIGURATION
-- ============================================================

create table public.school_modules (
  id uuid primary key default gen_random_uuid(),

  module_key text not null unique,
  module_name text not null,

  enabled boolean not null default true,

  settings jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. ACADEMIC YEARS
-- ============================================================

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  start_date date not null,
  end_date date not null,

  status public.academic_year_status not null default 'PLANNING',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint academic_year_dates_valid
    check (end_date > start_date),

  constraint academic_year_name_unique
    unique (name)
);

-- ============================================================
-- 5. MASTER CLASS LIST
-- ============================================================

create table public.classes (
  id uuid primary key default gen_random_uuid(),

  class_code text not null unique,
  class_name text not null,

  display_order integer not null,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint class_display_order_positive
    check (display_order > 0)
);

-- ============================================================
-- 6. CLASS FOR A PARTICULAR ACADEMIC YEAR
-- ============================================================

create table public.class_years (
  id uuid primary key default gen_random_uuid(),

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  class_id uuid not null
    references public.classes(id)
    on delete restrict,

  expected_student_count integer not null default 0
    check (expected_student_count >= 0),

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (academic_year_id, class_id)
);

-- ============================================================
-- 7. SECTIONS
-- ============================================================

create table public.sections (
  id uuid primary key default gen_random_uuid(),

  class_year_id uuid not null
    references public.class_years(id)
    on delete restrict,

  section_name text not null,

  capacity integer
    check (capacity is null or capacity > 0),

  display_order integer not null default 1,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (class_year_id, section_name),

  unique (id, class_year_id)
);

-- ============================================================
-- 8. STUDENTS
-- ============================================================

create table public.students (
  id uuid primary key default gen_random_uuid(),

  student_number text not null unique,

  first_name text not null,
  middle_name text,
  last_name text,

  date_of_birth date,

  gender text,

  phone text,
  email text,

  address text,

  admission_date date,

  status public.student_status not null default 'ACTIVE',

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 9. PARENTS / GUARDIANS
-- ============================================================

create table public.guardians (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid unique
    references auth.users(id)
    on delete set null,

  first_name text not null,
  last_name text,

  relationship text,

  phone text,
  email text,

  address text,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_guardians (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  guardian_id uuid not null
    references public.guardians(id)
    on delete restrict,

  is_primary boolean not null default false,

  can_view_attendance boolean not null default true,
  can_view_fees boolean not null default true,
  can_view_academic_data boolean not null default true,

  created_at timestamptz not null default now(),

  unique (student_id, guardian_id)
);

-- ============================================================
-- 10. NEW ERP STAFF PROFILES
-- ============================================================

create table public.staff_profiles (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid not null unique
    references auth.users(id)
    on delete restrict,

  employee_number text unique,

  first_name text not null,
  last_name text,

  phone text,
  email text,

  designation text,

  status public.staff_status not null default 'ACTIVE',

  joined_date date,
  leaving_date date,

  -- Existing website-compatible fields
  bio text,
  photo_url text,
  initials text,
  accent text,
  display_order integer not null default 0,
  is_public boolean not null default false,

  -- Existing faculty portal compatibility
  assigned_class integer
    check (assigned_class is null or assigned_class between 1 and 10),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 11. ROLES
-- ============================================================

create table public.roles (
  id uuid primary key default gen_random_uuid(),

  role_key text not null unique,
  role_name text not null,

  description text,

  system_role boolean not null default false,

  created_at timestamptz not null default now()
);

insert into public.roles
(role_key, role_name, description, system_role)
values
(
  'PRINCIPAL',
  'Principal / Owner',
  'Full school-level administrative authority',
  true
),
(
  'VICE_PRINCIPAL',
  'Vice Principal',
  'Administrative authority assigned by principal',
  true
),
(
  'ACADEMIC_INCHARGE',
  'Academic Incharge',
  'Manages academic structure and enrollment operations',
  true
),
(
  'ATTENDANCE_INCHARGE',
  'Attendance Incharge',
  'Manages attendance operations',
  true
),
(
  'FEES_INCHARGE',
  'Fees Incharge',
  'Manages fee records and collections',
  true
),
(
  'OPERATIONS_INCHARGE',
  'Operations Incharge',
  'Manages assigned operational workflows',
  true
),
(
  'TEACHER',
  'Teacher',
  'Takes attendance and performs assigned teaching operations',
  true
),
(
  'STAFF',
  'Staff',
  'General staff account',
  true
);

-- ============================================================
-- 12. PERMISSIONS
-- ============================================================

create table public.permissions (
  id uuid primary key default gen_random_uuid(),

  permission_key text not null unique,
  permission_name text not null,

  description text,

  created_at timestamptz not null default now()
);

insert into public.permissions
(permission_key, permission_name, description)
values
('students.view', 'View Students', 'View student records'),
('students.create', 'Create Students', 'Create student records'),
('students.update', 'Update Students', 'Modify student records'),
('students.archive', 'Archive Students', 'Archive student records'),

('academic.view', 'View Academic Structure', 'View classes and sections'),
('academic.manage', 'Manage Academic Structure', 'Create/change classes, sections and capacities'),

('enrollment.view', 'View Enrollment', 'View enrollment records'),
('enrollment.manage', 'Manage Enrollment', 'Create and modify enrollment records'),
('enrollment.promote', 'Promote Students', 'Perform academic year promotion'),

('attendance.view', 'View Attendance', 'View attendance'),
('attendance.mark', 'Mark Attendance', 'Mark student attendance'),
('attendance.correct', 'Correct Attendance', 'Correct existing attendance'),
('attendance.manage', 'Manage Attendance', 'Manage attendance operations'),

('fees.view', 'View Fees', 'View fee information'),
('fees.manage', 'Manage Fees', 'Manage fee charges'),
('fees.record_payment', 'Record Fee Payment', 'Record manual fee payment'),
('fees.correct', 'Correct Fee Records', 'Correct fee records'),

('staff.view', 'View Staff', 'View staff'),
('staff.manage', 'Manage Staff', 'Manage staff accounts'),

('roles.view', 'View Roles', 'View roles'),
('roles.manage', 'Manage Roles', 'Manage roles and assignments'),

('calendar.view', 'View Calendar', 'View school calendar'),
('calendar.manage', 'Manage Calendar', 'Manage calendar'),

('reports.view', 'View Reports', 'View reports'),

('audit.view', 'View Audit Logs', 'View audit history'),

('migration.view', 'View Imports', 'View import jobs'),
('migration.manage', 'Manage Imports', 'Manage data migration/imports'),

('admissions.view', 'View Admissions', 'View admission enquiries'),
('admissions.manage', 'Manage Admissions', 'Manage admission enquiries and workflow'),

('website.manage', 'Manage Website Content', 'Manage public website content'),

('faculty.manage', 'Manage Faculty Content', 'Manage faculty-facing website content'),

('materials.manage', 'Manage Class Materials', 'Manage class materials')
;

-- ============================================================
-- 13. ROLE → PERMISSION
-- ============================================================

create table public.role_permissions (
  role_id uuid not null
    references public.roles(id)
    on delete cascade,

  permission_id uuid not null
    references public.permissions(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  primary key (role_id, permission_id)
);

-- Principal
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.role_key = 'PRINCIPAL';

-- Vice Principal
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'students.create',
    'students.update',
    'academic.view',
    'academic.manage',
    'enrollment.view',
    'enrollment.manage',
    'enrollment.promote',
    'attendance.view',
    'attendance.manage',
    'fees.view',
    'staff.view',
    'calendar.view',
    'calendar.manage',
    'reports.view',
    'audit.view',
    'admissions.view',
    'admissions.manage'
  )
where r.role_key = 'VICE_PRINCIPAL';

-- Academic Incharge
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'students.create',
    'students.update',
    'academic.view',
    'academic.manage',
    'enrollment.view',
    'enrollment.manage',
    'enrollment.promote',
    'calendar.view',
    'reports.view',
    'admissions.view',
    'admissions.manage'
  )
where r.role_key = 'ACADEMIC_INCHARGE';

-- Attendance Incharge
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'enrollment.view',
    'attendance.view',
    'attendance.mark',
    'attendance.correct',
    'attendance.manage',
    'calendar.view',
    'reports.view'
  )
where r.role_key = 'ATTENDANCE_INCHARGE';

-- Fees Incharge
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'enrollment.view',
    'fees.view',
    'fees.manage',
    'fees.record_payment',
    'fees.correct',
    'reports.view'
  )
where r.role_key = 'FEES_INCHARGE';

-- Operations Incharge
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'enrollment.view',
    'calendar.view',
    'calendar.manage',
    'reports.view',
    'admissions.view',
    'admissions.manage'
  )
where r.role_key = 'OPERATIONS_INCHARGE';

-- Teacher
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'enrollment.view',
    'attendance.view',
    'attendance.mark',
    'calendar.view',
    'materials.manage'
  )
where r.role_key = 'TEACHER';

-- General staff
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.permission_key in (
    'students.view',
    'academic.view',
    'calendar.view'
  )
where r.role_key = 'STAFF';

-- ============================================================
-- 14. STAFF ROLE ASSIGNMENTS
-- ============================================================

create table public.staff_roles (
  id uuid primary key default gen_random_uuid(),

  staff_id uuid not null
    references public.staff_profiles(id)
    on delete cascade,

  role_id uuid not null
    references public.roles(id)
    on delete restrict,

  starts_at timestamptz not null default now(),
  ends_at timestamptz,

  active boolean not null default true,

  created_at timestamptz not null default now(),

  constraint staff_role_dates_valid
    check (ends_at is null or ends_at > starts_at)
);

-- ============================================================
-- 15. STAFF SCOPES
-- ============================================================

create table public.staff_scopes (
  id uuid primary key default gen_random_uuid(),

  staff_role_id uuid not null
    references public.staff_roles(id)
    on delete cascade,

  scope_type public.scope_type not null,

  class_id uuid
    references public.classes(id)
    on delete restrict,

  section_id uuid
    references public.sections(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  constraint valid_scope_definition check (
    (scope_type = 'SCHOOL'
      and class_id is null
      and section_id is null)

    or

    (scope_type = 'CLASS'
      and class_id is not null
      and section_id is null)

    or

    (scope_type = 'SECTION'
      and section_id is not null)
  )
);

-- ============================================================
-- 16. ENROLLMENTS
-- ============================================================

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  class_year_id uuid not null
    references public.class_years(id)
    on delete restrict,

  section_id uuid not null,

  roll_number integer,

  status public.enrollment_status not null default 'ACTIVE',

  enrollment_date date not null default current_date,

  leaving_date date,

  previous_enrollment_id uuid
    references public.enrollments(id)
    on delete restrict,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint enrollment_section_matches_class_year
    foreign key (section_id, class_year_id)
    references public.sections(id, class_year_id)
    on delete restrict,

  constraint roll_number_positive
    check (roll_number is null or roll_number > 0)
);

create unique index one_active_enrollment_per_student_year
on public.enrollments(student_id, academic_year_id)
where status = 'ACTIVE';

create unique index unique_active_roll_number
on public.enrollments(academic_year_id, section_id, roll_number)
where status = 'ACTIVE'
  and roll_number is not null;

-- ============================================================
-- 17. CALENDAR
-- ============================================================

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  event_date date not null,

  event_type public.calendar_event_type not null,

  title text not null,

  description text,

  applies_to_all boolean not null default true,

  class_id uuid
    references public.classes(id)
    on delete restrict,

  section_id uuid
    references public.sections(id)
    on delete restrict,

  is_attendance_day boolean not null default false,

  created_by uuid
    references public.staff_profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint calendar_scope_valid check (
    applies_to_all = true
    or class_id is not null
    or section_id is not null
  )
);

create index calendar_events_date_idx
on public.calendar_events(event_date);

create index calendar_events_year_idx
on public.calendar_events(academic_year_id);

-- ============================================================
-- 18. ATTENDANCE
-- ============================================================

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),

  enrollment_id uuid not null
    references public.enrollments(id)
    on delete restrict,

  attendance_date date not null,

  status public.attendance_status not null,

  remarks text,

  marked_by uuid
    references public.staff_profiles(id)
    on delete set null,

  marked_at timestamptz not null default now(),

  corrected_at timestamptz,

  corrected_by uuid
    references public.staff_profiles(id)
    on delete set null,

  correction_reason text,

  sync_client_id text,
  sync_version bigint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (enrollment_id, attendance_date)
);

create index attendance_date_idx
on public.attendance_records(attendance_date);

create index attendance_enrollment_idx
on public.attendance_records(enrollment_id);

-- ============================================================
-- 19. FEE STRUCTURES
-- ============================================================

create table public.fee_structures (
  id uuid primary key default gen_random_uuid(),

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  class_year_id uuid
    references public.class_years(id)
    on delete restrict,

  fee_name text not null,

  amount numeric(12,2) not null
    check (amount >= 0),

  due_date date,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 20. STUDENT FEE CHARGES
-- ============================================================

create table public.fee_charges (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  fee_structure_id uuid
    references public.fee_structures(id)
    on delete restrict,

  charge_type public.fee_charge_type not null default 'REGULAR',

  description text not null,

  amount numeric(12,2) not null
    check (amount >= 0),

  concession_amount numeric(12,2) not null default 0
    check (concession_amount >= 0),

  due_date date,

  created_by uuid
    references public.staff_profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint concession_not_greater_than_amount
    check (concession_amount <= amount)
);

-- ============================================================
-- 21. FEE PAYMENTS
-- ============================================================

create table public.fee_payments (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete restrict,

  amount numeric(12,2) not null
    check (amount > 0),

  payment_date date not null default current_date,

  payment_method public.payment_method not null,

  reference_number text,

  receipt_number text unique,

  notes text,

  recorded_by uuid
    references public.staff_profiles(id)
    on delete set null,

  cancelled boolean not null default false,

  cancelled_at timestamptz,

  cancelled_by uuid
    references public.staff_profiles(id)
    on delete set null,

  cancellation_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fee_payments_student_idx
on public.fee_payments(student_id);

create index fee_payments_year_idx
on public.fee_payments(academic_year_id);

-- ============================================================
-- 22. DATA MIGRATION / IMPORT JOBS
-- ============================================================

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),

  import_type text not null,

  file_name text,

  status public.import_status not null default 'UPLOADED',

  uploaded_by uuid
    references public.staff_profiles(id)
    on delete set null,

  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  imported_rows integer not null default 0,

  error_summary jsonb not null default '[]'::jsonb,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),

  import_job_id uuid not null
    references public.import_jobs(id)
    on delete cascade,

  row_number integer not null,

  raw_data jsonb not null,

  validation_status text not null default 'PENDING',

  validation_errors jsonb not null default '[]'::jsonb,

  matched_student_id uuid
    references public.students(id)
    on delete set null,

  processed boolean not null default false,

  created_at timestamptz not null default now()
);

-- ============================================================
-- 23. AUDIT LOG
-- ============================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  actor_user_id uuid
    references auth.users(id)
    on delete set null,

  actor_staff_id uuid
    references public.staff_profiles(id)
    on delete set null,

  action public.audit_action not null,

  table_name text,

  record_id uuid,

  old_data jsonb,
  new_data jsonb,

  metadata jsonb not null default '{}'::jsonb,

  ip_address inet,

  user_agent text,

  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx
on public.audit_logs(actor_user_id);

create index audit_logs_table_record_idx
on public.audit_logs(table_name, record_id);

create index audit_logs_created_idx
on public.audit_logs(created_at);

-- ============================================================
-- 24. EXISTING WEBSITE AUTH USERS COMPATIBILITY
-- ============================================================
--
-- This table is retained because the existing website/faculty
-- portal already uses it.
--
-- The new ERP authorization model uses:
--
-- auth.users
--      ↓
-- staff_profiles
--      ↓
-- staff_roles
--      ↓
-- permissions
--
-- The old users table remains as a compatibility layer for the
-- existing application until the frontend is migrated.
-- ============================================================

-- create table public.users (
--   id uuid primary key
--     references auth.users(id)
--     on delete cascade,

--   email text not null unique,

--   role text not null
--     check (role = any (
--       array[
--         'admin'::text,
--         'faculty'::text
--       ]
--     )),

--   created_at timestamptz not null default now()
-- );

-- ============================================================
-- 25. EXISTING WEBSITE FACULTY DIRECTORY
-- ============================================================

-- create table public.faculty_members (
--   id uuid primary key default gen_random_uuid(),

--   name text not null,
--   role text not null,

--   bio text,

--   photo_url text,

--   initials text,

--   accent text,

--   display_order integer not null default 0,

--   is_active boolean not null default true,

--   created_at timestamptz not null default now()
-- );

-- ============================================================
-- 26. EXISTING FACULTY PORTAL PROFILE
-- ============================================================

-- create table public.faculty_profiles (
--   id uuid primary key default gen_random_uuid(),

--   user_id uuid not null unique
--     references public.users(id)
--     on delete cascade,

--   name text not null,

--   role text not null,

--   bio text,

--   photo_url text,

--   assigned_class integer not null
--     check (assigned_class between 1 and 10),

--   created_at timestamptz not null default now(),

--   updated_at timestamptz not null default now(),

--   is_active boolean not null default true
-- );

-- ============================================================
-- 27. EXISTING CLASS MATERIALS
-- ============================================================

-- create table public.class_materials (
--   id uuid primary key default gen_random_uuid(),

--   class_number integer not null
--     check (class_number >= 1 and class_number <= 10),

--   title text not null,

--   subject text not null,

--   description text not null default '',

--   file_url text not null,

--   file_name text not null,

--   created_at timestamptz not null default now(),

--   updated_at timestamptz not null default now(),

--   uploaded_by uuid
--     references public.users(id)
--     on delete set null
-- );

-- ============================================================
-- 28. EXISTING GALLERY
-- ============================================================

-- create table public.gallery_images (
--   id uuid primary key default gen_random_uuid(),

--   image_url text not null,

--   caption text not null,

--   span_class text,

--   display_order integer not null default 0,

--   is_active boolean not null default true,

--   created_at timestamptz not null default now()
-- );

-- ============================================================
-- 29. EXISTING ADMISSION ENQUIRIES
-- ============================================================

-- create table public.admission_enquiries (
--   id uuid primary key default gen_random_uuid(),

--   parent_name text not null,

--   email text not null,

--   phone text not null,

--   student_name text not null,

--   grade text not null,

--   message text,

--   created_at timestamptz not null default now(),

--   status text not null default 'New'
--     check (
--       status = any (
--         array[
--           'New'::text,
--           'Contacted'::text,
--           'Visit Scheduled'::text,
--           'Enrolled'::text,
--           'Rejected'::text
--         ]
--       )
--     ),

--   notes text
-- );

-- ============================================================
-- 30. GENERIC UPDATED-AT FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 31. UPDATED-AT TRIGGERS
-- ============================================================

create trigger set_updated_at_school_config
before update on public.school_config
for each row execute function public.set_updated_at();

create trigger set_updated_at_school_modules
before update on public.school_modules
for each row execute function public.set_updated_at();

create trigger set_updated_at_academic_years
before update on public.academic_years
for each row execute function public.set_updated_at();

create trigger set_updated_at_classes
before update on public.classes
for each row execute function public.set_updated_at();

create trigger set_updated_at_class_years
before update on public.class_years
for each row execute function public.set_updated_at();

create trigger set_updated_at_sections
before update on public.sections
for each row execute function public.set_updated_at();

create trigger set_updated_at_students
before update on public.students
for each row execute function public.set_updated_at();

create trigger set_updated_at_guardians
before update on public.guardians
for each row execute function public.set_updated_at();

create trigger set_updated_at_staff_profiles
before update on public.staff_profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at_enrollments
before update on public.enrollments
for each row execute function public.set_updated_at();

create trigger set_updated_at_calendar
before update on public.calendar_events
for each row execute function public.set_updated_at();

create trigger set_updated_at_attendance
before update on public.attendance_records
for each row execute function public.set_updated_at();

create trigger set_updated_at_fee_structures
before update on public.fee_structures
for each row execute function public.set_updated_at();

create trigger set_updated_at_fee_charges
before update on public.fee_charges
for each row execute function public.set_updated_at();

create trigger set_updated_at_fee_payments
before update on public.fee_payments
for each row execute function public.set_updated_at();

create trigger set_updated_at_import_jobs
before update on public.import_jobs
for each row execute function public.set_updated_at();

create trigger set_updated_at_faculty_profiles
before update on public.faculty_profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at_class_materials
before update on public.class_materials
for each row execute function public.set_updated_at();

-- ============================================================
-- 32. PERMISSION HELPER
-- ============================================================

create or replace function public.user_has_permission(
  requested_permission text
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    join public.staff_roles sr
      on sr.staff_id = sp.id
    join public.role_permissions rp
      on rp.role_id = sr.role_id
    join public.permissions p
      on p.id = rp.permission_id
    where sp.auth_user_id = auth.uid()
      and sp.status = 'ACTIVE'
      and sr.active = true
      and sr.starts_at <= now()
      and (
        sr.ends_at is null
        or sr.ends_at > now()
      )
      and p.permission_key = requested_permission
  );
$$;

-- ============================================================
-- 33. PRINCIPAL CHECK
-- ============================================================

create or replace function public.is_principal()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    join public.staff_roles sr
      on sr.staff_id = sp.id
    join public.roles r
      on r.id = sr.role_id
    where sp.auth_user_id = auth.uid()
      and sp.status = 'ACTIVE'
      and sr.active = true
      and r.role_key = 'PRINCIPAL'
      and sr.starts_at <= now()
      and (
        sr.ends_at is null
        or sr.ends_at > now()
      )
  );
$$;

-- ============================================================
-- 34. AUDIT FUNCTION
-- ============================================================

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_staff uuid;
  record_uuid uuid;
begin

  select id
  into actor_staff
  from public.staff_profiles
  where auth_user_id = auth.uid()
  limit 1;

  if tg_op = 'INSERT' then

    record_uuid := (to_jsonb(new)->>'id')::uuid;

    insert into public.audit_logs (
      actor_user_id,
      actor_staff_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    )
    values (
      auth.uid(),
      actor_staff,
      'INSERT',
      tg_table_name,
      record_uuid,
      null,
      to_jsonb(new)
    );

    return new;

  elsif tg_op = 'UPDATE' then

    record_uuid := (to_jsonb(new)->>'id')::uuid;

    insert into public.audit_logs (
      actor_user_id,
      actor_staff_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    )
    values (
      auth.uid(),
      actor_staff,
      'UPDATE',
      tg_table_name,
      record_uuid,
      to_jsonb(old),
      to_jsonb(new)
    );

    return new;

  elsif tg_op = 'DELETE' then

    record_uuid := (to_jsonb(old)->>'id')::uuid;

    insert into public.audit_logs (
      actor_user_id,
      actor_staff_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    )
    values (
      auth.uid(),
      actor_staff,
      'DELETE',
      tg_table_name,
      record_uuid,
      to_jsonb(old),
      null
    );

    return old;

  end if;

  return null;
end;
$$;

-- ============================================================
-- 35. AUDIT TRIGGERS
-- ============================================================

create trigger audit_students
after insert or update or delete on public.students
for each row execute function public.write_audit_log();

create trigger audit_guardians
after insert or update or delete on public.guardians
for each row execute function public.write_audit_log();

create trigger audit_student_guardians
after insert or update or delete on public.student_guardians
for each row execute function public.write_audit_log();

create trigger audit_staff
after insert or update or delete on public.staff_profiles
for each row execute function public.write_audit_log();

create trigger audit_enrollments
after insert or update or delete on public.enrollments
for each row execute function public.write_audit_log();

create trigger audit_attendance
after insert or update or delete on public.attendance_records
for each row execute function public.write_audit_log();

create trigger audit_fee_charges
after insert or update or delete on public.fee_charges
for each row execute function public.write_audit_log();

create trigger audit_fee_payments
after insert or update or delete on public.fee_payments
for each row execute function public.write_audit_log();

create trigger audit_staff_roles
after insert or update or delete on public.staff_roles
for each row execute function public.write_audit_log();

-- ============================================================
-- 36. ENABLE RLS — ERP TABLES
-- ============================================================

alter table public.school_config enable row level security;
alter table public.school_modules enable row level security;
alter table public.academic_years enable row level security;
alter table public.classes enable row level security;
alter table public.class_years enable row level security;
alter table public.sections enable row level security;
alter table public.students enable row level security;
alter table public.guardians enable row level security;
alter table public.student_guardians enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.staff_roles enable row level security;
alter table public.staff_scopes enable row level security;
alter table public.enrollments enable row level security;
alter table public.calendar_events enable row level security;
alter table public.attendance_records enable row level security;
alter table public.fee_structures enable row level security;
alter table public.fee_charges enable row level security;
alter table public.fee_payments enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;
alter table public.audit_logs enable row level security;

-- ============================================================
-- 37. ERP RLS POLICIES
-- ============================================================

create policy school_config_read
on public.school_config
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or public.is_principal()
);

create policy school_config_manage
on public.school_config
for all
to authenticated
using (public.is_principal())
with check (public.is_principal());

create policy school_modules_read
on public.school_modules
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or public.is_principal()
);

create policy school_modules_manage
on public.school_modules
for all
to authenticated
using (public.is_principal())
with check (public.is_principal());

create policy academic_years_read
on public.academic_years
for select
to authenticated
using (
  public.user_has_permission('academic.view')
);

create policy academic_years_manage
on public.academic_years
for all
to authenticated
using (public.user_has_permission('academic.manage'))
with check (public.user_has_permission('academic.manage'));

create policy classes_read
on public.classes
for select
to authenticated
using (
  public.user_has_permission('academic.view')
);

create policy classes_manage
on public.classes
for all
to authenticated
using (public.user_has_permission('academic.manage'))
with check (public.user_has_permission('academic.manage'));

create policy class_years_read
on public.class_years
for select
to authenticated
using (
  public.user_has_permission('academic.view')
);

create policy class_years_manage
on public.class_years
for all
to authenticated
using (public.user_has_permission('academic.manage'))
with check (public.user_has_permission('academic.manage'));

create policy sections_read
on public.sections
for select
to authenticated
using (
  public.user_has_permission('academic.view')
);

create policy sections_manage
on public.sections
for all
to authenticated
using (public.user_has_permission('academic.manage'))
with check (public.user_has_permission('academic.manage'));

create policy students_read
on public.students
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or exists (
    select 1
    from public.student_guardians sg
    join public.guardians g
      on g.id = sg.guardian_id
    where sg.student_id = students.id
      and g.auth_user_id = auth.uid()
      and g.active = true
  )
);

create policy students_insert
on public.students
for insert
to authenticated
with check (
  public.user_has_permission('students.create')
);

create policy students_update
on public.students
for update
to authenticated
using (
  public.user_has_permission('students.update')
)
with check (
  public.user_has_permission('students.update')
);

create policy guardians_read
on public.guardians
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or auth_user_id = auth.uid()
);

create policy guardians_manage
on public.guardians
for all
to authenticated
using (
  public.user_has_permission('students.update')
)
with check (
  public.user_has_permission('students.update')
);

create policy student_guardians_read
on public.student_guardians
for select
to authenticated
using (
  public.user_has_permission('students.view')
  or exists (
    select 1
    from public.guardians g
    where g.id = student_guardians.guardian_id
      and g.auth_user_id = auth.uid()
  )
);

create policy student_guardians_manage
on public.student_guardians
for all
to authenticated
using (
  public.user_has_permission('students.update')
)
with check (
  public.user_has_permission('students.update')
);

create policy staff_profiles_read
on public.staff_profiles
for select
to authenticated
using (
  public.user_has_permission('staff.view')
  or auth_user_id = auth.uid()
);

create policy staff_profiles_manage
on public.staff_profiles
for all
to authenticated
using (
  public.user_has_permission('staff.manage')
)
with check (
  public.user_has_permission('staff.manage')
);

create policy roles_read
on public.roles
for select
to authenticated
using (
  public.user_has_permission('roles.view')
);

create policy roles_manage
on public.roles
for all
to authenticated
using (
  public.user_has_permission('roles.manage')
)
with check (
  public.user_has_permission('roles.manage')
);

create policy permissions_read
on public.permissions
for select
to authenticated
using (
  public.user_has_permission('roles.view')
);

create policy role_permissions_read
on public.role_permissions
for select
to authenticated
using (
  public.user_has_permission('roles.view')
);

create policy role_permissions_manage
on public.role_permissions
for all
to authenticated
using (
  public.user_has_permission('roles.manage')
)
with check (
  public.user_has_permission('roles.manage')
);

create policy staff_roles_read
on public.staff_roles
for select
to authenticated
using (
  public.user_has_permission('roles.view')
  or exists (
    select 1
    from public.staff_profiles sp
    where sp.id = staff_roles.staff_id
      and sp.auth_user_id = auth.uid()
  )
);

create policy staff_roles_manage
on public.staff_roles
for all
to authenticated
using (
  public.user_has_permission('roles.manage')
)
with check (
  public.user_has_permission('roles.manage')
);

create policy staff_scopes_read
on public.staff_scopes
for select
to authenticated
using (
  public.user_has_permission('roles.view')
);

create policy staff_scopes_manage
on public.staff_scopes
for all
to authenticated
using (
  public.user_has_permission('roles.manage')
)
with check (
  public.user_has_permission('roles.manage')
);

create policy enrollments_read
on public.enrollments
for select
to authenticated
using (
  public.user_has_permission('enrollment.view')
  or exists (
    select 1
    from public.student_guardians sg
    join public.guardians g
      on g.id = sg.guardian_id
    where sg.student_id = enrollments.student_id
      and g.auth_user_id = auth.uid()
      and g.active = true
  )
);

create policy enrollments_manage
on public.enrollments
for all
to authenticated
using (
  public.user_has_permission('enrollment.manage')
)
with check (
  public.user_has_permission('enrollment.manage')
);

create policy calendar_read
on public.calendar_events
for select
to authenticated
using (
  public.user_has_permission('calendar.view')
);

create policy calendar_manage
on public.calendar_events
for all
to authenticated
using (
  public.user_has_permission('calendar.manage')
)
with check (
  public.user_has_permission('calendar.manage')
);

create policy attendance_read
on public.attendance_records
for select
to authenticated
using (
  public.user_has_permission('attendance.view')
  or exists (
    select 1
    from public.enrollments e
    join public.student_guardians sg
      on sg.student_id = e.student_id
    join public.guardians g
      on g.id = sg.guardian_id
    where e.id = attendance_records.enrollment_id
      and g.auth_user_id = auth.uid()
      and g.active = true
      and sg.can_view_attendance = true
  )
);

create policy attendance_insert
on public.attendance_records
for insert
to authenticated
with check (
  public.user_has_permission('attendance.mark')
  or public.user_has_permission('attendance.manage')
);

create policy attendance_update
on public.attendance_records
for update
to authenticated
using (
  public.user_has_permission('attendance.correct')
  or public.user_has_permission('attendance.manage')
)
with check (
  public.user_has_permission('attendance.correct')
  or public.user_has_permission('attendance.manage')
);

create policy fee_structures_read
on public.fee_structures
for select
to authenticated
using (
  public.user_has_permission('fees.view')
);

create policy fee_structures_manage
on public.fee_structures
for all
to authenticated
using (
  public.user_has_permission('fees.manage')
)
with check (
  public.user_has_permission('fees.manage')
);

create policy fee_charges_read
on public.fee_charges
for select
to authenticated
using (
  public.user_has_permission('fees.view')
  or exists (
    select 1
    from public.student_guardians sg
    join public.guardians g
      on g.id = sg.guardian_id
    where sg.student_id = fee_charges.student_id
      and g.auth_user_id = auth.uid()
      and g.active = true
      and sg.can_view_fees = true
  )
);

create policy fee_charges_manage
on public.fee_charges
for all
to authenticated
using (
  public.user_has_permission('fees.manage')
)
with check (
  public.user_has_permission('fees.manage')
);

create policy fee_payments_read
on public.fee_payments
for select
to authenticated
using (
  public.user_has_permission('fees.view')
  or exists (
    select 1
    from public.student_guardians sg
    join public.guardians g
      on g.id = sg.guardian_id
    where sg.student_id = fee_payments.student_id
      and g.auth_user_id = auth.uid()
      and g.active = true
      and sg.can_view_fees = true
  )
);

create policy fee_payments_insert
on public.fee_payments
for insert
to authenticated
with check (
  public.user_has_permission('fees.record_payment')
);

create policy fee_payments_update
on public.fee_payments
for update
to authenticated
using (
  public.user_has_permission('fees.correct')
)
with check (
  public.user_has_permission('fees.correct')
);

create policy import_jobs_read
on public.import_jobs
for select
to authenticated
using (
  public.user_has_permission('migration.view')
);

create policy import_jobs_manage
on public.import_jobs
for all
to authenticated
using (
  public.user_has_permission('migration.manage')
)
with check (
  public.user_has_permission('migration.manage')
);

create policy import_rows_read
on public.import_rows
for select
to authenticated
using (
  public.user_has_permission('migration.view')
);

create policy import_rows_manage
on public.import_rows
for all
to authenticated
using (
  public.user_has_permission('migration.manage')
)
with check (
  public.user_has_permission('migration.manage')
);

create policy audit_read
on public.audit_logs
for select
to authenticated
using (
  public.user_has_permission('audit.view')
);

-- ============================================================
-- 38. WEBSITE / LEGACY RLS
-- ============================================================
--
-- These policies preserve the existing website behavior.
-- Public website content is readable by anon/authenticated.
-- Management is restricted to the old admin account model.
-- ============================================================

alter table public.users enable row level security;
alter table public.faculty_members enable row level security;
alter table public.faculty_profiles enable row level security;
alter table public.class_materials enable row level security;
alter table public.gallery_images enable row level security;
alter table public.admission_enquiries enable row level security;

-- USERS

create policy users_self_read
on public.users
for select
to authenticated
using (
  id = auth.uid()
);

create policy users_admin_manage
on public.users
for all
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

-- FACULTY DIRECTORY

create policy faculty_members_public_read
on public.faculty_members
for select
to anon, authenticated
using (
  is_active = true
);

create policy faculty_members_admin_manage
on public.faculty_members
for all
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

-- FACULTY PROFILES

create policy faculty_profiles_self_read
on public.faculty_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

create policy faculty_profiles_self_update
on public.faculty_profiles
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

create policy faculty_profiles_admin_insert
on public.faculty_profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

create policy faculty_profiles_admin_delete
on public.faculty_profiles
for delete
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

-- CLASS MATERIALS

create policy class_materials_public_read
on public.class_materials
for select
to anon, authenticated
using (true);

create policy class_materials_faculty_manage
on public.class_materials
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'faculty')
  )
);

create policy class_materials_faculty_update
on public.class_materials
for update
to authenticated
using (
  uploaded_by = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
)
with check (
  uploaded_by = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

create policy class_materials_faculty_delete
on public.class_materials
for delete
to authenticated
using (
  uploaded_by = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

-- GALLERY

create policy gallery_public_read
on public.gallery_images
for select
to anon, authenticated
using (
  is_active = true
);

create policy gallery_admin_manage
on public.gallery_images
for all
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

-- ADMISSION ENQUIRIES

create policy admission_enquiries_public_insert
on public.admission_enquiries
for insert
to anon, authenticated
with check (true);

create policy admission_enquiries_admin_read
on public.admission_enquiries
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

create policy admission_enquiries_admin_update
on public.admission_enquiries
for update
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

create policy admission_enquiries_admin_delete
on public.admission_enquiries
for delete
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

-- ============================================================
-- 39. INDEXES
-- ============================================================

create index enrollments_student_idx
on public.enrollments(student_id);

create index enrollments_class_year_idx
on public.enrollments(class_year_id);

create index enrollments_section_idx
on public.enrollments(section_id);

create index sections_class_year_idx
on public.sections(class_year_id);

create index staff_roles_staff_idx
on public.staff_roles(staff_id);

create index staff_scopes_role_idx
on public.staff_scopes(staff_role_id);

create index student_guardians_student_idx
on public.student_guardians(student_id);

create index student_guardians_guardian_idx
on public.student_guardians(guardian_id);

create index class_materials_class_idx
on public.class_materials(class_number);

create index class_materials_uploaded_by_idx
on public.class_materials(uploaded_by);

create index faculty_members_display_order_idx
on public.faculty_members(display_order);

create index gallery_images_display_order_idx
on public.gallery_images(display_order);

create index admission_enquiries_status_idx
on public.admission_enquiries(status);

create index admission_enquiries_created_at_idx
on public.admission_enquiries(created_at);

-- ============================================================
-- 40. INITIAL MODULES
-- ============================================================

insert into public.school_modules
(module_key, module_name, enabled)
values
('students', 'Student Management', true),
('admissions', 'Admissions', true),
('academics', 'Academic Management', true),
('attendance', 'Attendance', true),
('fees', 'Fee Management', true),
('parents', 'Parent Portal', true),
('staff', 'Staff Management', true),
('calendar', 'School Calendar', true),
('reports', 'Reports', true),
('audit', 'Audit System', true),
('migration', 'Data Migration', true),
('notifications', 'Notifications', false),
('website', 'Public Website', true),
('faculty_portal', 'Faculty Portal', true),
('gallery', 'Gallery', true),
('class_materials', 'Class Materials', true);

-- ============================================================
-- 41. DEFAULT SCHOOL CONFIG
-- ============================================================

insert into public.school_config (
  school_code,
  school_name,
  timezone
)
values (
  'HYDERABAD_SCHOOL',
  'Hyderabad School',
  'Asia/Kolkata'
);

-- ============================================================
-- 42. DEFAULT CLASS MASTER
-- ============================================================

insert into public.classes
(class_code, class_name, display_order)
values
('CLASS_01', 'Class 1', 1),
('CLASS_02', 'Class 2', 2),
('CLASS_03', 'Class 3', 3),
('CLASS_04', 'Class 4', 4),
('CLASS_05', 'Class 5', 5),
('CLASS_06', 'Class 6', 6),
('CLASS_07', 'Class 7', 7),
('CLASS_08', 'Class 8', 8),
('CLASS_09', 'Class 9', 9),
('CLASS_10', 'Class 10', 10);

-- ============================================================
-- 43. FINAL
-- ============================================================

commit;" but ima unable to login as admin why ?
</user_query>
