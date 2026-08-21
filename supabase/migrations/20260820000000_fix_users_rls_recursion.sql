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
