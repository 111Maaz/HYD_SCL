-- Sprint P: Teacher + secondary-cover attendance write scope (RLS)

begin;

create or replace function public.current_staff_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select sp.id
  from public.staff_profiles sp
  where sp.auth_user_id = auth.uid()
    and sp.status = 'ACTIVE'
  limit 1;
$$;

grant execute on function public.current_staff_profile_id() to authenticated;

create or replace function public.staff_can_mark_attendance(
  p_enrollment_id uuid,
  p_attendance_date date
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.enrollments e
      join public.attendance_teacher_allotments ata
        on ata.section_id = e.section_id
       and ata.academic_year_id = e.academic_year_id
       and ata.active = true
       and ata.teacher_staff_id = public.current_staff_profile_id()
      where e.id = p_enrollment_id
    )
    or exists (
      select 1
      from public.enrollments e
      join public.attendance_teacher_allotments ata
        on ata.section_id = e.section_id
       and ata.academic_year_id = e.academic_year_id
       and ata.active = true
      join public.secondary_teacher_allotments sec
        on sec.primary_staff_id = ata.teacher_staff_id
       and sec.secondary_staff_id = public.current_staff_profile_id()
       and sec.active = true
       and sec.starts_on <= p_attendance_date
       and sec.ends_on >= p_attendance_date
      where e.id = p_enrollment_id
    );
$$;

grant execute on function public.staff_can_mark_attendance(uuid, date) to authenticated;

drop policy if exists attendance_teacher_select on public.attendance_records;
create policy attendance_teacher_select
  on public.attendance_records
  for select
  to authenticated
  using (public.staff_can_mark_attendance(enrollment_id, attendance_date));

drop policy if exists attendance_teacher_insert on public.attendance_records;
create policy attendance_teacher_insert
  on public.attendance_records
  for insert
  to authenticated
  with check (public.staff_can_mark_attendance(enrollment_id, attendance_date));

drop policy if exists attendance_teacher_update on public.attendance_records;
create policy attendance_teacher_update
  on public.attendance_records
  for update
  to authenticated
  using (public.staff_can_mark_attendance(enrollment_id, attendance_date))
  with check (public.staff_can_mark_attendance(enrollment_id, attendance_date));

commit;
