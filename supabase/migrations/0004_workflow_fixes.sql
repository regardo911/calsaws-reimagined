-- ============================================================================
-- CalSAWS Reimagined — 0004: authorization-task SLA tracking + preserved clock
-- ----------------------------------------------------------------------------
-- Two workflow-correctness fixes found by the 0003 hardening audit and deferred
-- as low-impact. Both live in the case-authorization path.
--
--   BUG-001  accept_edbc_run routed a CalWORKs grant to the supervisor but never
--            created a task for it — the sign-off step had no SLA clock, no queue
--            row, and no timeliness signal (only a status-driven list on /supervisor).
--            FIX: on CW routing, open a tracked 'Authorize CalWORKs grant' task,
--            assigned to an in-county supervisor, on the case's own SLA clock.
--
--   BUG-002  authorize_case's "return to worker" branch granted a fresh
--            current_date + 5 due date, silently discarding the applicant's
--            original deadline — most damagingly the expedited CalFresh 3-day
--            clock — and marked every returned task the same priority.
--            FIX: re-open the worker task on the case's ORIGINAL clock
--            (application_date + 3 expedited / + 30 regular), Critical priority
--            for expedited, and close the now-moot authorization task on return.
--
-- Both functions are full create-or-replace of the 0003 bodies; deltas marked "0004:".
-- Re-runnable (create-or-replace only). Depends on 0001–0003.
-- Convention: due dates anchor to application_date (one continuous case clock),
-- matching submit_application's task and the seeder (expedited => 3, else 30).
-- ============================================================================

-- Worker accepts an EDBC run. CalWORKs-eligible grants route to supervisor —
-- now WITH a tracked, SLA-clocked authorization task (0004: BUG-001).
create or replace function accept_edbc_run(p_run_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_case uuid; v_actor uuid; v_cw boolean; v_actor_name text; v_summary text;
  v_accepted boolean; v_status case_status;
  v_county text; v_appdate date; v_exp boolean; v_supervisor uuid;       -- 0004
begin
  if not is_staff() then raise exception 'staff role required'; end if;
  select case_id, accepted into v_case, v_accepted from edbc_runs where id = p_run_id;
  if v_case is null then raise exception 'run not found'; end if;

  perform assert_case_county(v_case);                                    -- county gate

  -- idempotency — a run may be accepted once, and only from a live case
  if v_accepted then raise exception 'EDBC run already accepted'; end if;
  select status, county, application_date, expedited                     -- 0004: clock inputs
    into v_status, v_county, v_appdate, v_exp from cases where id = v_case;
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
    -- close the worker's processing task first ...
    update tasks set status = 'done', completed_by = v_actor, completed_at = now()
     where case_id = v_case and status = 'open' and type <> 'Renewal (RE) Due';
    -- 0004 (BUG-001): ... then open a TRACKED authorization task so the supervisor
    -- step carries an SLA clock and shows on the queue (was previously untracked).
    select id into v_supervisor from profiles
      where role = 'supervisor' and county = v_county order by created_at limit 1;
    insert into tasks (case_id, type, priority, due_date, assigned_to)
    values (v_case, 'Authorize CalWORKs grant',
            case when v_exp then 'Critical' else 'High' end,
            v_appdate + case when v_exp then 3 else 30 end,
            coalesce(v_supervisor, v_actor));       -- fall back to EW so it is never orphaned
    return 'pending_authorization';
  else
    perform _finalize_run(p_run_id, v_actor);
    return (select status::text from cases where id = v_case);
  end if;
end $$;

-- Supervisor authorizes (or returns) a pending case.
-- Approve: _finalize_run closes the 'Authorize CalWORKs grant' task (type <> renewal).
-- Return : preserve the case's ORIGINAL clock + close the auth task (0004: BUG-002).
create or replace function authorize_case(p_case_id uuid, p_approve boolean)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid; v_run uuid; v_actor_name text; v_worker uuid;
  v_status case_status; v_authorized timestamptz;
  v_appdate date; v_exp boolean;                                         -- 0004
begin
  if my_role() not in ('supervisor','admin') then raise exception 'supervisor role required'; end if;
  perform assert_case_county(p_case_id);                                 -- county gate
  v_actor := my_profile_id();
  select full_name into v_actor_name from profiles where id = v_actor;

  -- 0004: fetch the clock inputs + assignee in one shot; only a case actually
  -- awaiting authorization can be authorized.
  select status, application_date, expedited, assigned_to
    into v_status, v_appdate, v_exp, v_worker from cases where id = p_case_id;
  if v_status <> 'pending_authorization' then
    raise exception 'case not pending authorization (status %)', v_status;
  end if;

  select id, authorized_at into v_run, v_authorized from edbc_runs
    where case_id = p_case_id and accepted order by created_at desc limit 1;
  if v_run is null then raise exception 'no accepted run for case'; end if;

  if p_approve then
    if v_authorized is not null then raise exception 'run already authorized'; end if;
    update edbc_runs set authorized_by = v_actor, authorized_at = now() where id = v_run;
    perform _finalize_run(v_run, v_actor);   -- also closes the open 'Authorize CalWORKs grant' task
    insert into journal_entries (case_id, kind, text, author_name, author_profile_id)
    values (p_case_id, 'Authorization', 'Supervisor authorized the EDBC result.', v_actor_name, v_actor);
    return (select status::text from cases where id = p_case_id);
  else
    -- un-accept the run so the case must be re-run + re-accepted before it can be
    -- authorized again (previously the run stayed accepted -> re-authorizable).
    update edbc_runs set accepted = false, accepted_by = null, accepted_at = null where id = v_run;
    update cases set status = 'pending' where id = p_case_id;
    -- 0004 (BUG-002): close the now-moot authorization task before re-opening
    -- worker follow-up on the case's ORIGINAL SLA clock (esp. the expedited 3-day
    -- deadline) — NOT a fresh current_date + 5. Expedited => Critical priority.
    update tasks set status = 'done', completed_by = v_actor, completed_at = now()
     where case_id = p_case_id and status = 'open';
    insert into tasks (case_id, type, priority, due_date, assigned_to)
    values (p_case_id,
            case when v_exp then 'Expedited Intake' else 'Process Application' end,
            case when v_exp then 'Critical' else 'High' end,
            v_appdate + case when v_exp then 3 else 30 end,
            v_worker);
    insert into journal_entries (case_id, kind, text, author_name, author_profile_id)
    values (p_case_id, 'Authorization', 'Supervisor returned the case to the worker for review.', v_actor_name, v_actor);
    return 'pending';
  end if;
end $$;

-- 0004 applied-marker (smoke check reads this, mirroring 0003's clear_person probe).
create or replace function _mig_0004_applied() returns boolean
language sql immutable as $$ select true $$;
