begin;

-- The class-year and section IDs, rather than their display labels, define a
-- transition. Different actions may deliberately use different destinations.
create table public.enrollment_progression_maps (
  id uuid primary key default gen_random_uuid(),
  from_year_id uuid not null references public.academic_years(id) on delete restrict,
  to_year_id uuid not null references public.academic_years(id) on delete restrict,
  action text not null check (action in ('PROMOTED', 'REPEATED')),
  source_class_year_id uuid not null references public.class_years(id) on delete restrict,
  source_section_id uuid not null,
  target_class_year_id uuid not null references public.class_years(id) on delete restrict,
  target_section_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint progression_source_section_fk foreign key (source_section_id, source_class_year_id)
    references public.sections(id, class_year_id) on delete restrict,
  constraint progression_target_section_fk foreign key (target_section_id, target_class_year_id)
    references public.sections(id, class_year_id) on delete restrict,
  constraint progression_distinct_years check (from_year_id <> to_year_id),
  constraint progression_unique_source unique (from_year_id, to_year_id, action, source_section_id)
);

create index enrollment_progression_maps_target_idx
  on public.enrollment_progression_maps(to_year_id, target_section_id);

create function public.validate_enrollment_progression_map()
returns trigger language plpgsql set search_path = public as $$
declare
  source_class uuid;
  target_class uuid;
  source_order integer;
  target_order integer;
  source_start date;
  target_start date;
begin
  select cy.class_id into source_class from public.class_years cy
  where cy.id = new.source_class_year_id and cy.academic_year_id = new.from_year_id and cy.active;
  select cy.class_id into target_class from public.class_years cy
  where cy.id = new.target_class_year_id and cy.academic_year_id = new.to_year_id and cy.active;
  select start_date into source_start from public.academic_years where id = new.from_year_id;
  select start_date into target_start from public.academic_years where id = new.to_year_id;
  select c.display_order into source_order from public.classes c where c.id = source_class;
  select c.display_order into target_order from public.classes c where c.id = target_class;
  if source_class is null or target_class is null or target_start <= source_start then
    raise exception 'Choose active source and destination classes in the selected academic years';
  end if;
  if not exists (select 1 from public.sections where id = new.source_section_id and active)
    or not exists (select 1 from public.sections where id = new.target_section_id and active) then
    raise exception 'Both mapped sections must be active';
  end if;
  if new.action = 'REPEATED' and source_class <> target_class then
    raise exception 'Repeat mappings must keep the same class';
  end if;
  if new.action = 'PROMOTED' and target_order <= source_order then
    raise exception 'Promotion mappings must advance to a higher class';
  end if;
  return new;
end;
$$;

create trigger validate_enrollment_progression_map_before_write
before insert or update on public.enrollment_progression_maps
for each row execute function public.validate_enrollment_progression_map();

create trigger audit_enrollment_progression_maps
after insert or update or delete on public.enrollment_progression_maps
for each row execute function public.write_audit_log();

alter table public.enrollment_progression_maps enable row level security;
grant select, insert, update, delete on public.enrollment_progression_maps to authenticated;
create policy enrollment_progression_maps_read on public.enrollment_progression_maps
for select to authenticated using (public.user_has_permission('enrollment.promote'));
create policy enrollment_progression_maps_manage on public.enrollment_progression_maps
for all to authenticated using (public.user_has_permission('enrollment.promote'))
with check (public.user_has_permission('enrollment.promote'));

-- A preview and a commit use exactly the same authoritative validation. A
-- failed validation returns row reasons without changing data. Any SQL error
-- during commit rolls back the entire RPC call, including audit records.
create function public.run_year_end_transition(
  p_from_year_id uuid,
  p_to_year_id uuid,
  p_action text,
  p_enrollment_ids uuid[],
  p_overrides jsonb default '{}'::jsonb,
  p_close_source boolean default false,
  p_commit boolean default false
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  source_start date;
  target_start date;
  source_row public.enrollments%rowtype;
  map_row public.enrollment_progression_maps%rowtype;
  target_section record;
  target_id uuid;
  selected_id uuid;
  row_error text;
  rows_result jsonb := '[]'::jsonb;
  result_row jsonb;
  selected_count integer;
  error_count integer := 0;
  destination_count integer;
  planned_count integer;
  next_roll integer;
  actor_staff_id uuid;
begin
  if not public.user_has_permission('enrollment.promote') then
    raise exception 'You are not authorized to process year-end enrollments' using errcode = '42501';
  end if;
  if p_action not in ('PROMOTED', 'REPEATED', 'COMPLETED') then
    raise exception 'Invalid year-end action';
  end if;
  selected_count := coalesce(array_length(p_enrollment_ids, 1), 0);
  if selected_count = 0 then raise exception 'Select at least one enrollment'; end if;
  if (select count(distinct x) from unnest(p_enrollment_ids) x) <> selected_count then
    raise exception 'Duplicate enrollment IDs are not allowed';
  end if;
  if p_close_source and exists (
    select 1 from public.enrollments e
    where e.academic_year_id = p_from_year_id and e.status = 'ACTIVE'
      and e.id <> all(p_enrollment_ids)
  ) then
    raise exception 'Select every active enrollment before closing the source academic year';
  end if;
  select start_date into source_start from public.academic_years where id = p_from_year_id;
  if source_start is null then raise exception 'Source academic year does not exist'; end if;
  if p_action <> 'COMPLETED' then
    select start_date into target_start from public.academic_years where id = p_to_year_id;
    if target_start is null or target_start <= source_start then
      raise exception 'Choose a destination academic year later than the source year';
    end if;
  end if;

  -- Serialize previews/commits for a year pair. The commit revalidates under
  -- this lock, so another promotion cannot fill a section between checks.
  perform pg_advisory_xact_lock(hashtextextended(p_from_year_id::text || coalesce(p_to_year_id::text, ''), 0));
  foreach selected_id in array p_enrollment_ids loop
    row_error := null;
    target_id := null;
    select * into source_row from public.enrollments
    where id = selected_id and academic_year_id = p_from_year_id and status = 'ACTIVE';
    if not found then row_error := 'Source enrollment is no longer active in the selected year'; end if;

    if row_error is null and p_action <> 'COMPLETED' then
      select * into map_row from public.enrollment_progression_maps
      where from_year_id = p_from_year_id and to_year_id = p_to_year_id
        and action = p_action and source_section_id = source_row.section_id;
      if not found then
        row_error := 'No saved section progression mapping';
      else
        target_id := map_row.target_section_id;
      end if;
      if row_error is null and p_overrides ? selected_id::text then
        target_id := (p_overrides ->> selected_id::text)::uuid;
      end if;
      if row_error is null then
        select s.id, s.class_year_id, s.capacity, cy.class_id, cy.academic_year_id,
               s.active as section_active, cy.active as class_active
          into target_section
        from public.sections s join public.class_years cy on cy.id = s.class_year_id
        where s.id = target_id;
        if not found or target_section.academic_year_id <> p_to_year_id
          or not target_section.section_active or not target_section.class_active then
          row_error := 'Destination class or section is missing or inactive';
        elsif p_action = 'REPEATED' and target_section.class_id <>
          (select class_id from public.class_years where id = source_row.class_year_id) then
          row_error := 'Repeat must remain in the same class';
        elsif p_action = 'PROMOTED' and
          (select display_order from public.classes where id = target_section.class_id) <=
          (select c.display_order from public.class_years cy join public.classes c on c.id = cy.class_id
           where cy.id = source_row.class_year_id) then
          row_error := 'Promotion must move to a higher class';
        elsif exists (select 1 from public.enrollments e
                     where e.student_id = source_row.student_id and e.academic_year_id = p_to_year_id) then
          row_error := 'Student already has an enrollment in the destination year';
        end if;
      end if;
    end if;

    result_row := jsonb_build_object(
      'enrollmentId', selected_id,
      'studentId', case when row_error = 'Source enrollment is no longer active in the selected year'
                       then null else source_row.student_id end,
      'sourceSectionId', case when row_error = 'Source enrollment is no longer active in the selected year'
                              then null else source_row.section_id end,
      'targetSectionId', target_id,
      'status', case when row_error is null then 'ELIGIBLE' else 'ERROR' end,
      'reason', row_error
    );
    rows_result := rows_result || jsonb_build_array(result_row);
    if row_error is not null then error_count := error_count + 1; end if;
  end loop;

  -- Capacity counts existing active destination enrollments plus every
  -- selected student mapped there, including several source sections merging.
  for target_id in select distinct (r->>'targetSectionId')::uuid
    from jsonb_array_elements(rows_result) r
    where r->>'status' = 'ELIGIBLE' and r->>'targetSectionId' is not null
  loop
    select capacity into destination_count from public.sections where id = target_id;
    if destination_count is not null then
      select count(*) into planned_count from public.enrollments
      where academic_year_id = p_to_year_id and section_id = target_id and status = 'ACTIVE';
      select planned_count + count(*) into planned_count from jsonb_array_elements(rows_result) r
      where r->>'targetSectionId' = target_id::text and r->>'status' = 'ELIGIBLE';
      if planned_count > destination_count then
        rows_result := (select jsonb_agg(case when r->>'targetSectionId' = target_id::text
          and r->>'status' = 'ELIGIBLE' then r || jsonb_build_object(
            'status', 'ERROR', 'reason', format('Destination capacity %s would be exceeded by %s enrollments', destination_count, planned_count))
          else r end) from jsonb_array_elements(rows_result) r);
      end if;
    end if;
  end loop;
  select count(*) into error_count from jsonb_array_elements(rows_result) r where r->>'status' = 'ERROR';

  if p_commit and error_count = 0 then
    foreach selected_id in array p_enrollment_ids loop
      select * into source_row from public.enrollments
      where id = selected_id and academic_year_id = p_from_year_id and status = 'ACTIVE'
      for update;
      if not found then
        raise exception 'A selected source enrollment changed during processing. Preview again';
      end if;
      select (r->>'targetSectionId')::uuid into target_id
      from jsonb_array_elements(rows_result) r where r->>'enrollmentId' = selected_id::text;
      if p_action <> 'COMPLETED' then
        select coalesce(max(roll_number), 0) + 1 into next_roll from public.enrollments
        where academic_year_id = p_to_year_id and section_id = target_id and status = 'ACTIVE';
      end if;
      update public.enrollments set status = p_action::public.enrollment_status,
        leaving_date = current_date, updated_at = now() where id = selected_id;
      if p_action <> 'COMPLETED' then
        insert into public.enrollments(student_id, academic_year_id, class_year_id, section_id,
          roll_number, status, enrollment_date, previous_enrollment_id, notes)
        values (source_row.student_id, p_to_year_id,
          (select class_year_id from public.sections where id = target_id), target_id,
          next_roll, 'ACTIVE', current_date, selected_id,
          case when p_action = 'REPEATED' then 'Repeated from previous academic year.'
               else 'Promoted from previous academic year.' end);
      end if;
    end loop;
    if p_close_source then
      update public.academic_years set status = 'CLOSED', updated_at = now() where id = p_from_year_id;
    end if;
    select id into actor_staff_id from public.staff_profiles where auth_user_id = auth.uid() limit 1;
    insert into public.audit_logs(actor_user_id, actor_staff_id, action, table_name, metadata)
    values (auth.uid(), actor_staff_id, 'OTHER', 'enrollments',
      jsonb_build_object('operation', 'YEAR_END', 'fromYearId', p_from_year_id,
        'toYearId', p_to_year_id, 'action', p_action, 'selectedEnrollmentIds', p_enrollment_ids,
        'overrides', p_overrides, 'processed', selected_count));
  end if;
  return jsonb_build_object('selected', selected_count, 'eligible', selected_count - error_count,
    'processed', case when p_commit and error_count = 0 then selected_count else 0 end,
    'skipped', error_count, 'blocked', error_count > 0, 'rows', rows_result);
end;
$$;

revoke all on function public.run_year_end_transition(uuid, uuid, text, uuid[], jsonb, boolean, boolean) from public;
grant execute on function public.run_year_end_transition(uuid, uuid, text, uuid[], jsonb, boolean, boolean) to authenticated;

commit;
