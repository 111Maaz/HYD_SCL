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
