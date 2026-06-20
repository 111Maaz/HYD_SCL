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
