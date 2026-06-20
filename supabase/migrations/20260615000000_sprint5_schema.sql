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
