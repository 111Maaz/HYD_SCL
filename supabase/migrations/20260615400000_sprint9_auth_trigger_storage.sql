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
