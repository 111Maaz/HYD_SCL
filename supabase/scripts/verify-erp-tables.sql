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
