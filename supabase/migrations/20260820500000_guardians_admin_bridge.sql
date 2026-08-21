-- Sprint I: ensure admin portal can manage guardians / links
-- Additive only — does not redesign tables.

begin;

drop policy if exists guardians_admin_bridge on public.guardians;
create policy guardians_admin_bridge
  on public.guardians
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists student_guardians_admin_bridge on public.student_guardians;
create policy student_guardians_admin_bridge
  on public.student_guardians
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

commit;
