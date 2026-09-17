begin;

-- Parents need the active year to load their child's attendance, fees and placement.
-- Class and section metadata remains limited to academically linked children.
drop policy if exists academic_years_parent_read on public.academic_years;
create policy academic_years_parent_read
on public.academic_years for select to authenticated
using (status = 'ACTIVE' and public.current_guardian_id() is not null);

drop policy if exists classes_parent_read on public.classes;
create policy classes_parent_read
on public.classes for select to authenticated
using (exists (
  select 1
  from public.class_years cy
  join public.enrollments e on e.class_year_id = cy.id
  where cy.class_id = classes.id
    and public.guardian_can_view_student(e.student_id, 'academic')
));

drop policy if exists class_years_parent_read on public.class_years;
create policy class_years_parent_read
on public.class_years for select to authenticated
using (exists (
  select 1
  from public.enrollments e
  where e.class_year_id = class_years.id
    and public.guardian_can_view_student(e.student_id, 'academic')
));

drop policy if exists sections_parent_read on public.sections;
create policy sections_parent_read
on public.sections for select to authenticated
using (exists (
  select 1
  from public.enrollments e
  where e.section_id = sections.id
    and public.guardian_can_view_student(e.student_id, 'academic')
));

commit;
