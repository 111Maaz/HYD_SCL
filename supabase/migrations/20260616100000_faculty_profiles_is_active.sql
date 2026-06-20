-- Allow admins to temporarily disable faculty portal access
ALTER TABLE public.faculty_profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
