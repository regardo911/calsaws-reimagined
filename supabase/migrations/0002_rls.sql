-- ============================================================================
-- CalSAWS Reimagined — Row-Level Security + atomic workflow functions
-- Role matrix:
--   applicant : SELECT own case graph only (via cases.applicant_profile_id)
--   worker    : SELECT/UPDATE case data statewide; no rule_params writes
--   supervisor: worker + authorization
--   admin     : everything incl. rule_params writes
-- Mutations that must be atomic (accept -> notices/issuances/status/tasks) are
-- SECURITY DEFINER functions so they run as a single statement.
-- ============================================================================

-- ---------- helpers ----------
create or replace function my_profile_id() returns uuid
language sql stable security definer set search_path = public as
$$ select id from profiles where auth_user_id = auth.uid() $$;

create or replace function my_role() returns user_role
language sql stable security definer set search_path = public as
$$ select role from profiles where auth_user_id = auth.uid() $$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select my_role() in ('worker','supervisor','admin') $$;

-- ---------- enable RLS ----------
alter table profiles enable row level security;
alter table cases enable row level security;
alter table persons enable row level security;
alter table income_records enable row level security;
alter table resource_records enable row level security;
alter table expense_records enable row level security;
alter table data_matches enable row level security;
alter table edbc_runs enable row level security;
alter table edbc_results enable row level security;
alter table notices enable row level security;
alter table issuances enable row level security;
alter table tasks enable row level security;
alter table journal_entries enable row level security;
alter table rule_params enable row level security;
alter table app_meta enable row level security;

-- ---------- profiles ----------
create policy profiles_select on profiles for select
  using (auth_user_id = auth.uid() or is_staff());

-- ---------- cases ----------
create policy cases_select on cases for select
  using (is_staff() or applicant_profile_id = my_profile_id());
create policy cases_staff_update on cases for update
  using (is_staff());

-- ---------- child tables: applicant sees own case graph; staff sees all ----------
create or replace function can_see_case(p_case_id uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select is_staff() or exists (
     select 1 from cases c where c.id = p_case_id and c.applicant_profile_id = my_profile_id()
   ) $$;

create policy persons_select on persons for select using (can_see_case(case_id));
create policy income_select on income_records for select using (can_see_case(case_id));
create policy resources_select on resource_records for select using (can_see_case(case_id));
create policy expenses_select on expense_records for select using (can_see_case(case_id));
create policy matches_select on data_matches for select using (can_see_case(case_id));
create policy runs_select on edbc_runs for select using (can_see_case(case_id));
create policy results_select on edbc_results for select using (
  exists (select 1 from edbc_runs r where r.id = run_id and can_see_case(r.case_id))
);
create policy notices_select on notices for select using (can_see_case(case_id));
create policy issuances_select on issuances for select using (can_see_case(case_id));
create policy journal_select on journal_entries for select using (can_see_case(case_id));

-- staff-only surfaces
create policy tasks_staff on tasks for select using (is_staff());
create policy tasks_staff_update on tasks for update using (is_staff());

-- staff writes on case data (used sparingly; core mutations go through functions)
create policy matches_staff_update on data_matches for update using (is_staff());
create policy income_staff_update on income_records for update using (is_staff());
create policy journal_staff_insert on journal_entries for insert with check (is_staff());

-- ---------- rules ----------
create policy rules_staff_select on rule_params for select using (is_staff());
create policy rules_admin_write on rule_params for all
  using (my_role() = 'admin') with check (my_role() = 'admin');

create policy app_meta_read on app_meta for select using (true);

-- ============================================================================
-- Atomic workflow functions (SECURITY DEFINER; role-checked internally).
-- Called with the USER's JWT so auth.uid() identifies the actor.
-- ============================================================================

-- Finalize an accepted run: notices + issuances + case status + close tasks + journal.
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
begin
  if not is_staff() then raise exception 'staff role required'; end if;
  v_actor := my_profile_id();
  select case_id into v_case from edbc_runs where id = p_run_id;
  if v_case is null then raise exception 'run not found'; end if;

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
begin
  if my_role() not in ('supervisor','admin') then raise exception 'supervisor role required'; end if;
  v_actor := my_profile_id();
  select full_name into v_actor_name from profiles where id = v_actor;
  select id into v_run from edbc_runs where case_id = p_case_id and accepted order by created_at desc limit 1;
  if v_run is null then raise exception 'no accepted run for case'; end if;

  if p_approve then
    update edbc_runs set authorized_by = v_actor, authorized_at = now() where id = v_run;
    perform _finalize_run(v_run, v_actor);
    insert into journal_entries (case_id, kind, text, author_name, author_profile_id)
    values (p_case_id, 'Authorization', 'Supervisor authorized the EDBC result.', v_actor_name, v_actor);
    return (select status::text from cases where id = p_case_id);
  else
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
  v_actor := my_profile_id();
  select full_name into v_actor_name from profiles where id = v_actor;
  select * into m from data_matches where id = p_match_id;
  if m is null then raise exception 'match not found'; end if;

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
  v_es_income numeric; v_es_res numeric; v_staff boolean;
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

  -- default intake worker: first worker profile (Dana in seed)
  select id into v_worker from profiles where role = 'worker' order by created_at limit 1;

  insert into cases (county, status, programs, source, intake_mode, expedited,
                     assigned_to, applicant_profile_id, flags, address, phone)
  values (
    coalesce(p->>'county', 'Los Angeles'), 'pending',
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
