-- ============================================================================
-- CalSAWS Reimagined — 0003: County-scoped RLS + workflow-function hardening
-- ----------------------------------------------------------------------------
-- Access model after this migration:
--   admin      : sees/acts on ALL counties (role branch — admin's profiles.county
--                = 'Statewide' matches no case, so NEVER scope admin by county string)
--   worker     : scoped to profiles.county (own county only)
--   supervisor : scoped to profiles.county (own county only) + authorization
--   applicant  : UNCHANGED — own case graph only, no tasks, county-agnostic
--
-- Three surfaces bypass RLS and are hardened here / in the companion app release:
--   1. SECURITY DEFINER workflow RPCs  -> internal assert_case_county() gate (here)
--   2. submit_application intake routing -> county-aware worker pick (here)
--   3. service-role server actions (runEdbc/copilot) -> assertSameCounty() guard
--      in src/app/actions/case-actions.ts (ships in the same deploy)
--
-- Also folds in the two high-severity money bugs found in these same functions:
--   - re-accept / re-run double-issuance  -> terminal-status + already-accepted guards
--   - supervisor "return" left the run accepted -> return now un-accepts the run
--
-- Re-runnable: functions use create-or-replace; every changed policy is preceded
-- by drop-if-exists. Depends on 0001 (schema) + 0002 (base RLS + fns) + the
-- county-corrected seed (every case.county has >=1 in-county worker+supervisor).
-- ============================================================================

-- ---------- new helpers (must precede every referrer) ----------
create or replace function my_county() returns text
language sql stable security definer set search_path = public as
$$ select county from profiles where auth_user_id = auth.uid() $$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select my_role() = 'admin' $$;

-- staff-only, county-scoped gate (NO applicant branch). Used by tasks + staff
-- writes: reusing can_see_case() there would expose tasks/writes to an applicant
-- who owns the case (today tasks_staff is is_staff()-only — must not regress).
create or replace function can_staff_see_case(p_case_id uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select is_admin() or (is_staff() and exists (
     select 1 from cases c where c.id = p_case_id and c.county = my_county()
   )) $$;

-- guard used INSIDE SECURITY DEFINER workflow fns (they run RLS-bypassed).
create or replace function assert_case_county(p_case_id uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not can_staff_see_case(p_case_id) then
    raise exception 'cross-county access denied for case %', p_case_id using errcode = '42501';
  end if;
end $$;

-- ---------- applicant-inclusive choke point ----------
-- Body change only: the 10 child SELECT policies + results_select reference this
-- BY NAME, so replacing the body scopes the entire case graph with zero policy edits.
-- is_admin() must be first (short-circuits before the county-equality checks).
create or replace function can_see_case(p_case_id uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select is_admin()
     or exists (select 1 from cases c
                where c.id = p_case_id and c.applicant_profile_id = my_profile_id())
     or (is_staff() and exists (select 1 from cases c
                where c.id = p_case_id and c.county = my_county()))
$$;

-- ============================================================================
-- Policy rewrites (drop-then-create; `create policy` is not idempotent on PG15/16)
-- ============================================================================

-- profiles: self + admin-all + same-county staff roster (scopes Team/reassign lists)
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (auth_user_id = auth.uid() or is_admin() or (is_staff() and county = my_county()));

-- cases: admin-all + same-county staff + own applicant
drop policy if exists cases_select on cases;
create policy cases_select on cases for select
  using (is_admin() or (is_staff() and county = my_county())
         or applicant_profile_id = my_profile_id());

-- update: USING gates the OLD row in-county; WITH CHECK blocks moving a case's
-- county out of the actor's range (and stops silent county reassignment).
drop policy if exists cases_staff_update on cases;
create policy cases_staff_update on cases for update
  using      (is_admin() or (is_staff() and county = my_county()))
  with check (is_admin() or (is_staff() and county = my_county()));

-- tasks: staff-only county gate (join to cases.county via case_id). Makes queue
-- visibility a real RLS guarantee, not the old .filter(t => t.cases) join-null side effect.
drop policy if exists tasks_staff on tasks;
create policy tasks_staff on tasks for select
  using (can_staff_see_case(case_id));

-- update: county gate + WITH CHECK that a new assignee is an in-county profile
-- (blocks cross-county reassignment via reassignTaskAction).
drop policy if exists tasks_staff_update on tasks;
create policy tasks_staff_update on tasks for update
  using (can_staff_see_case(case_id))
  with check (
    can_staff_see_case(case_id)
    and (assigned_to is null or is_admin()
         or exists (select 1 from profiles p where p.id = assigned_to and p.county = my_county()))
  );

-- staff writes on case children — county-scope + keep the row in-county
drop policy if exists matches_staff_update on data_matches;
create policy matches_staff_update on data_matches for update
  using (can_staff_see_case(case_id)) with check (can_staff_see_case(case_id));

drop policy if exists income_staff_update on income_records;
create policy income_staff_update on income_records for update
  using (can_staff_see_case(case_id)) with check (can_staff_see_case(case_id));

drop policy if exists journal_staff_insert on journal_entries;
create policy journal_staff_insert on journal_entries for insert
  with check (can_staff_see_case(case_id));

-- Intentionally unchanged (statewide by design): rules_staff_select, rules_admin_write,
-- app_meta_read, and all 10 child SELECT policies (they inherit the new can_see_case body).

-- ============================================================================
-- SECURITY DEFINER workflow functions — county gates + idempotency guards
-- (full create-or-replace of the 0002 bodies; deltas are marked "0003:")
-- ============================================================================

-- Finalize an accepted run: notices + issuances + status + close tasks + journal.
-- Only reachable via accept_edbc_run / authorize_case (both county-gated), so no
-- own gate needed. Body unchanged from 0002.
create or replace function _finalize_run(p_run_id uuid, p_actor uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_case uuid; v_any_elig boolean := false; r record; v_actor_name text;
begin
  select case_id into v_case from edbc_runs where id = p_run_id;
  select full_name into v_actor_name from profiles where id = p_actor;

  for r in select * from edbc_results where run_id = p_run_id loop
    if r.status = 'Eligible' then v_any_elig := true; end if;
    insert into notices (case_id, program, type, amount, reasons)
    values (v_case, r.program,
            case when r.status = 'Eligible' then 'Approval NOA' else 'Denial NOA' end,
            r.amount, r.reasons);
    if r.status = 'Eligible' and r.amount > 0 then
      insert into issuances (case_id, program, amount) values (v_case, r.program, r.amount);
    end if;
  end loop;

  update cases set status = case when v_any_elig then 'approved'::case_status else 'denied'::case_status end
   where id = v_case;

  update tasks set status = 'done', completed_by = p_actor, completed_at = now()
   where case_id = v_case and status = 'open' and type <> 'Renewal (RE) Due';

  insert into journal_entries (case_id, kind, text, author_name, author_profile_id)
  values (v_case, 'NOA',
          'Notices generated and ' || case when v_any_elig then 'benefits issued to EBT.' else 'denial recorded.' end,
          coalesce(v_actor_name, 'System'), p_actor);
end $$;

-- Worker accepts an EDBC run. CalWORKs-eligible grants route to supervisor.
create or replace function accept_edbc_run(p_run_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_case uuid; v_actor uuid; v_cw boolean; v_actor_name text; v_summary text;
  v_accepted boolean; v_status case_status;                              -- 0003
begin
  if not is_staff() then raise exception 'staff role required'; end if;
  select case_id, accepted into v_case, v_accepted from edbc_runs where id = p_run_id;
  if v_case is null then raise exception 'run not found'; end if;

  perform assert_case_county(v_case);                                    -- 0003: county gate

  -- 0003: idempotency — a run may be accepted once, and only from a live case
  if v_accepted then raise exception 'EDBC run already accepted'; end if;
  select status into v_status from cases where id = v_case;
  if v_status in ('approved','denied','pending_authorization') then
    raise exception 'case already finalized (status %)', v_status;
  end if;

  v_actor := my_profile_id();
  select full_name into v_actor_name from profiles where id = v_actor;
  select exists (select 1 from edbc_results where run_id = p_run_id and program = 'CW' and status = 'Eligible') into v_cw;
  select string_agg(program || ': ' || status || case when amount > 0 then ' $' || amount::int else '' end, '; ')
    into v_summary from edbc_results where run_id = p_run_id;

  update edbc_runs set accepted = true, accepted_by = v_actor, accepted_at = now() where id = p_run_id;
  insert into journal_entries (case_id, kind, text, author_name, author_profile_id)
  values (v_case, 'EDBC', 'EDBC accepted — ' || coalesce(v_summary, '') ||
          case when v_cw then '. CalWORKs grant requires supervisor authorization.' else '' end,
          coalesce(v_actor_name, 'System'), v_actor);

  if v_cw then
    update cases set status = 'pending_authorization' where id = v_case;
    update tasks set status = 'done', completed_by = v_actor, completed_at = now()
     where case_id = v_case and status = 'open' and type <> 'Renewal (RE) Due';
    return 'pending_authorization';
  else
    perform _finalize_run(p_run_id, v_actor);
    return (select status::text from cases where id = v_case);
  end if;
end $$;

-- Supervisor authorizes (or returns) a pending case.
create or replace function authorize_case(p_case_id uuid, p_approve boolean)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid; v_run uuid; v_actor_name text; v_worker uuid;
  v_status case_status; v_authorized timestamptz;                        -- 0003
begin
  if my_role() not in ('supervisor','admin') then raise exception 'supervisor role required'; end if;
  perform assert_case_county(p_case_id);                                 -- 0003: county gate
  v_actor := my_profile_id();
  select full_name into v_actor_name from profiles where id = v_actor;

  -- 0003: only a case actually awaiting authorization can be authorized
  select status into v_status from cases where id = p_case_id;
  if v_status <> 'pending_authorization' then
    raise exception 'case not pending authorization (status %)', v_status;
  end if;

  select id, authorized_at into v_run, v_authorized from edbc_runs
    where case_id = p_case_id and accepted order by created_at desc limit 1;
  if v_run is null then raise exception 'no accepted run for case'; end if;

  if p_approve then
    if v_authorized is not null then raise exception 'run already authorized'; end if;  -- 0003
    update edbc_runs set authorized_by = v_actor, authorized_at = now() where id = v_run;
    perform _finalize_run(v_run, v_actor);
    insert into journal_entries (case_id, kind, text, author_name, author_profile_id)
    values (p_case_id, 'Authorization', 'Supervisor authorized the EDBC result.', v_actor_name, v_actor);
    return (select status::text from cases where id = p_case_id);
  else
    -- 0003: un-accept the run so the case must be re-run + re-accepted before it
    -- can be authorized again (previously the run stayed accepted -> re-authorizable).
    update edbc_runs set accepted = false, accepted_by = null, accepted_at = null where id = v_run;
    update cases set status = 'pending' where id = p_case_id;
    select assigned_to into v_worker from cases where id = p_case_id;
    insert into tasks (case_id, type, priority, due_date, assigned_to)
    values (p_case_id, 'Process Application', 'High', current_date + 5, v_worker);
    insert into journal_entries (case_id, kind, text, author_name, author_profile_id)
    values (p_case_id, 'Authorization', 'Supervisor returned the case to the worker for review.', v_actor_name, v_actor);
    return 'pending';
  end if;
end $$;

-- Worker resolves a data-match discrepancy (Yellow Banner).
create or replace function resolve_data_match(p_match_id uuid, p_use_matched boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid; v_actor_name text; m record;
begin
  if not is_staff() then raise exception 'staff role required'; end if;
  select * into m from data_matches where id = p_match_id;
  if m is null then raise exception 'match not found'; end if;

  perform assert_case_county(m.case_id);                                 -- 0003: county gate

  v_actor := my_profile_id();
  select full_name into v_actor_name from profiles where id = v_actor;

  update data_matches set resolved = true,
    reported = case when p_use_matched then matched else reported end,
    resolution_note = coalesce(p_note, resolution_note)
   where id = p_match_id;

  if p_use_matched then
    update income_records set amount = m.matched
     where case_id = m.case_id and kind = 'earned'
       and id = (select id from income_records where case_id = m.case_id and kind = 'earned' order by amount desc limit 1);
  end if;

  update cases set status = 'pending' where id = m.case_id and status = 'yellow_banner';

  insert into journal_entries (case_id, kind, text, author_name, author_profile_id)
  values (m.case_id, 'Verification',
          'Yellow Banner resolved: ' || m.source || ' ' || m.field || ' — ' ||
          case when p_use_matched then 'case updated to matched amount $' || m.matched::int
               else 'reported amount $' || m.reported::int || ' verified as correct' end ||
          coalesce('. ' || p_note, ''),
          v_actor_name, v_actor);
end $$;

-- Atomic portal application submission (applicant self-service or staff-keyed).
create or replace function submit_application(p jsonb)
returns table (case_id uuid, case_number text, expedited boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_profile uuid; v_case uuid; v_num text; v_exp boolean; v_worker uuid;
  person jsonb; i int := 0; v_income numeric; v_liquid numeric; v_rent numeric; v_util numeric;
  v_es_income numeric; v_es_res numeric; v_staff boolean; v_county text;   -- 0003: v_county
begin
  v_profile := my_profile_id();
  if v_profile is null then raise exception 'authentication required'; end if;
  v_staff := is_staff();

  v_income := coalesce((p->>'monthlyIncome')::numeric, 0);
  v_liquid := coalesce((p->>'resources')::numeric, 0);
  v_rent := coalesce((p->>'rent')::numeric, 0);
  v_util := coalesce((p->>'utilities')::numeric, 0);
  select value into v_es_income from rule_params where path = 'cf.esIncomeMax';
  select value into v_es_res from rule_params where path = 'cf.esResourceMax';
  v_exp := (p->'programs') ? 'CF' and (
    (v_income < coalesce(v_es_income, 150) and v_liquid <= coalesce(v_es_res, 100))
    or (v_rent + v_util > v_income + v_liquid)
  );

  -- 0003: case county. Applicants pick freely; staff-keyed intake is pinned to
  -- the actor's own county (admins may key any county).
  v_county := coalesce(p->>'county', 'Los Angeles');
  if v_staff and not is_admin() then
    v_county := coalesce(my_county(), v_county);
  end if;

  -- 0003: route to an in-county worker; fall back to in-county supervisor, then
  -- any worker, so an intake task is never left unassigned / off every queue.
  select id into v_worker from profiles
    where role = 'worker' and county = v_county order by created_at limit 1;
  if v_worker is null then
    select id into v_worker from profiles
      where role = 'supervisor' and county = v_county order by created_at limit 1;
  end if;
  if v_worker is null then
    select id into v_worker from profiles where role = 'worker' order by created_at limit 1;
  end if;

  insert into cases (county, status, programs, source, intake_mode, expedited,
                     assigned_to, applicant_profile_id, flags, address, phone)
  values (
    v_county, 'pending',                                                 -- 0003: v_county
    array(select jsonb_array_elements_text(p->'programs')),
    case when v_staff then coalesce(p->>'source', 'County office (SAWS 1)') else 'BenefitsCal e-Application' end,
    coalesce(p->>'intakeMode', 'Regular Intake'),
    v_exp,
    v_worker,
    case when v_staff then null else v_profile end,
    coalesce(p->'flags', '{}'::jsonb),
    p->>'address', p->>'phone'
  ) returning id, cases.case_number into v_case, v_num;

  for person in select * from jsonb_array_elements(p->'persons') loop
    i := i + 1;
    insert into persons (case_id, person_key, name, age, role, citizen, employed, ssn)
    values (v_case, 'p' || i, person->>'name', coalesce((person->>'age')::int, 0),
            case when i = 1 then 'primary' else 'member' end, true,
            coalesce((person->>'employed')::boolean, false),
            '999-00-' || lpad((1000 + (random() * 8999))::int::text, 4, '0'));
  end loop;

  if v_income > 0 then
    insert into income_records (case_id, person_key, kind, subtype, amount)
    values (v_case, 'p1', 'earned', 'Wages (self-reported)', v_income);
  end if;
  insert into resource_records (case_id, kind, label, value) values (v_case, 'liquid', 'Self-reported', v_liquid);
  if v_rent > 0 then insert into expense_records (case_id, kind, amount) values (v_case, 'rent', v_rent); end if;
  if v_util > 0 then insert into expense_records (case_id, kind, amount) values (v_case, 'utilities', v_util); end if;
  insert into data_matches (case_id, source, field, reported, matched, resolved)
  values (v_case, 'IEVS (EDD wages)', 'earned income', v_income, v_income, true);

  insert into tasks (case_id, type, priority, due_date, assigned_to)
  values (v_case,
          case when v_exp then 'Expedited Intake' else 'Process Application' end,
          case when v_exp then 'Critical' else 'Normal' end,
          current_date + case when v_exp then 3 else 30 end,
          v_worker);

  insert into journal_entries (case_id, kind, text)
  values (v_case, 'Application',
          case when v_staff then 'Application registered by staff (' || coalesce(p->>'intakeMode','Regular Intake') || ')'
               else 'e-Application received from BenefitsCal portal' end ||
          ' for ' || array_to_string(array(select jsonb_array_elements_text(p->'programs')), ', ') || '.' ||
          case when v_exp then ' EXPEDITED screening: qualifies for 3-day service.' else '' end);

  return query select v_case, v_num, v_exp;
end $$;

-- ============================================================================
-- clear_person: cross-county duplicate clearance for staff person-search.
-- Once can_see_case() is county-scoped, persons search returns only same-county
-- rows, so the "one person, one case" clearance would falsely clear cross-county
-- duplicates. This definer fn surfaces minimal match info (name/case#/county/status)
-- WITHOUT the other county's case graph, and removes the raw .or() injection surface.
-- ============================================================================
create or replace function clear_person(q text)
returns table (name text, case_number text, county text, status case_status)
language sql stable security definer set search_path = public as $$
  select p.name, c.case_number, c.county, c.status
  from persons p join cases c on c.id = p.case_id
  where is_staff() and length(coalesce(q,'')) >= 2
    and (p.name ilike '%'||q||'%' or p.ssn ilike '%'||q||'%')
  order by c.county, c.case_number
  limit 25
$$;
