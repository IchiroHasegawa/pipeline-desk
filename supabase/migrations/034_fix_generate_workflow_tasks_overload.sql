-- Migration 034: Resolve generate_workflow_tasks overload ambiguity
--
-- PostgREST returns PGRST203 ("Could not choose the best candidate function")
-- because two overloads exist:
--
--   generate_workflow_tasks(text, uuid, uuid)
--   generate_workflow_tasks(text, uuid, uuid, uuid, jsonb)
--
-- Migration 029 rewrote only the 3-argument version, so the 5-argument one
-- still references `ON CONFLICT ON CONSTRAINT uq_production_task_process` —
-- a constraint that 029 replaced with a partial unique index. That version is
-- therefore already broken and would error if it were ever called.
--
-- BEFORE RUNNING: grep the repo for `generate_workflow_tasks`. If any caller
-- passes p_parent_id or p_entity_data, STOP — the 5-arg version is in use and
-- needs porting rather than dropping.
--
-- Depends on: 029.

begin;

drop function if exists public.generate_workflow_tasks(text, uuid, uuid, uuid, jsonb);

-- Confirm exactly one overload survives.
do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'generate_workflow_tasks';

  if v_count <> 1 then
    raise exception
      'Expected exactly 1 generate_workflow_tasks overload, found %. Inspect pg_proc before proceeding.',
      v_count;
  end if;
end $$;

-- Re-assert grants on the surviving function.
revoke execute on function public.generate_workflow_tasks(text, uuid, uuid) from public;
revoke execute on function public.generate_workflow_tasks(text, uuid, uuid) from anon;
grant execute on function public.generate_workflow_tasks(text, uuid, uuid) to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
-- select p.oid::regprocedure as signature,
--        pg_get_functiondef(p.oid) like '%ON CONSTRAINT uq_production_task_process%'
--          as uses_dead_constraint
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname='public' and p.proname='generate_workflow_tasks';
--
-- expect: exactly one row, uses_dead_constraint = false
