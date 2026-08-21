-- Sprint R: Parent self-service profile update

begin;

drop policy if exists guardians_self_update on public.guardians;
create policy guardians_self_update
  on public.guardians
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

commit;
