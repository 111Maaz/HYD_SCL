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
