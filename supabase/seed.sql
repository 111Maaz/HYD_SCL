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
