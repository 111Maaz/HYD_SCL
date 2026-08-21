-- Sprint D contact table + ERP admin access bridge
--
-- Run this in Supabase SQL Editor if you see:
--   "Could not find the table public.contact_enquiries"
-- or attendance/calendar/fees pages fail with permission / missing table errors.
--
-- Safe to re-run (idempotent where possible).

begin;

-- ---------------------------------------------------------------------------
-- 1. contact_enquiries (Sprint D — NOT in consolidated ERP SQL)
-- ---------------------------------------------------------------------------

create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Resolved')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.contact_enquiries enable row level security;

drop policy if exists contact_enquiries_public_insert on public.contact_enquiries;
drop policy if exists contact_enquiries_admin_read on public.contact_enquiries;
drop policy if exists contact_enquiries_admin_update on public.contact_enquiries;
drop policy if exists contact_enquiries_admin_delete on public.contact_enquiries;

create policy contact_enquiries_public_insert
  on public.contact_enquiries
  for insert
  to anon, authenticated
  with check (true);

create policy contact_enquiries_admin_read
  on public.contact_enquiries
  for select
  to authenticated
  using (public.is_admin());

create policy contact_enquiries_admin_update
  on public.contact_enquiries
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy contact_enquiries_admin_delete
  on public.contact_enquiries
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Ensure login staff without roles get PRINCIPAL (common after manual setup)
-- ---------------------------------------------------------------------------

insert into public.staff_roles (staff_id, role_id)
select sp.id, r.id
from public.staff_profiles sp
cross join public.roles r
where r.role_key = 'PRINCIPAL'
  and sp.auth_user_id is not null
  and sp.status = 'ACTIVE'
  and not exists (
    select 1
    from public.staff_roles sr
    where sr.staff_id = sp.id
      and sr.active = true
  );

-- ---------------------------------------------------------------------------
-- 3. Bridge ERP RLS: is_admin() OR existing permission policies
--    (admin UI uses staff PRINCIPAL; policies also accept is_admin())
-- ---------------------------------------------------------------------------

-- Calendar
drop policy if exists calendar_admin_bridge on public.calendar_events;
create policy calendar_admin_bridge
  on public.calendar_events
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Attendance
drop policy if exists attendance_admin_select on public.attendance_records;
create policy attendance_admin_select
  on public.attendance_records
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists attendance_admin_insert on public.attendance_records;
create policy attendance_admin_insert
  on public.attendance_records
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists attendance_admin_update on public.attendance_records;
create policy attendance_admin_update
  on public.attendance_records
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Fees
drop policy if exists fee_structures_admin_bridge on public.fee_structures;
create policy fee_structures_admin_bridge
  on public.fee_structures
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists fee_charges_admin_bridge on public.fee_charges;
create policy fee_charges_admin_bridge
  on public.fee_charges
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists fee_payments_admin_bridge on public.fee_payments;
create policy fee_payments_admin_bridge
  on public.fee_payments
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Audit
drop policy if exists audit_admin_bridge on public.audit_logs;
create policy audit_admin_bridge
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin());

commit;

-- ---------------------------------------------------------------------------
-- 4. After running, reload PostgREST schema cache (Supabase usually auto-reloads)
-- Dashboard → Settings → API → Reload schema cache (if available)
-- Or wait ~1 minute and hard-refresh the app.
-- ---------------------------------------------------------------------------
