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
