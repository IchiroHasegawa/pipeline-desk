-- 1. Enforce Atomicity and Idempotency Constraints
-- Prevents duplicate task generation if the client double-clicks or retries
ALTER TABLE public.production_tasks
  ADD CONSTRAINT uq_production_task_process UNIQUE NULLS NOT DISTINCT (environment_id, episode_id, scene_id, source_workflow_process_id);

ALTER TABLE public.asset_tasks
  ADD CONSTRAINT uq_asset_task_process UNIQUE NULLS NOT DISTINCT (asset_id, source_workflow_process_id);

-- 2. Update Database Function: generate_workflow_tasks
-- Adds strict Workflow Type validation
CREATE OR REPLACE FUNCTION public.generate_workflow_tasks(
  p_entity_type text,
  p_entity_id uuid,
  p_workflow_id uuid
) RETURNS void AS $$
DECLARE
  v_process record;
  v_default_status_name text;
  v_workflow_type text;
BEGIN
  -- Validate user
  IF NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate Workflow Type
  SELECT workflow_type INTO v_workflow_type 
  FROM public.workflows 
  WHERE id = p_workflow_id 
    AND status = 'active';

  IF v_workflow_type IS NULL THEN
    RAISE EXCEPTION 'The selected Workflow is not valid or active.';
  END IF;

  IF v_workflow_type != p_entity_type THEN
    RAISE EXCEPTION 'The selected Workflow is not valid for this item.';
  END IF;

  -- Generate Tasks Idempotently
  FOR v_process IN
    SELECT wp.*,
           wts.name as default_status_name
    FROM public.workflow_processes wp
    LEFT JOIN public.workflow_task_statuses wts ON wp.default_task_status_id = wts.id
    WHERE wp.workflow_id = p_workflow_id
      AND wp.status = 'active'
    ORDER BY wp.position ASC
  LOOP
    v_default_status_name := COALESCE(v_process.default_status_name, 'Standby');

    IF p_entity_type = 'asset' THEN
      INSERT INTO public.asset_tasks (
        asset_id, name, progress, status, sort_order,
        source_workflow_id, source_workflow_process_id,
        task_status_workflow_id, task_status_definition_id,
        assignee_group_id, duration_days, effort_hours,
        take_retake_mode, take_retake_count
      ) VALUES (
        p_entity_id, v_process.name, v_process.default_completion, v_default_status_name, v_process.position,
        p_workflow_id, v_process.id,
        v_process.task_status_workflow_id, v_process.default_task_status_id,
        v_process.assignee_group_id, v_process.duration_days, v_process.effort_hours,
        v_process.take_retake_mode, v_process.take_retake_count
      ) ON CONFLICT ON CONSTRAINT uq_asset_task_process DO NOTHING;
    ELSE
      INSERT INTO public.production_tasks (
        environment_id, episode_id, scene_id,
        name, progress, status, sort_order,
        source_workflow_id, source_workflow_process_id,
        task_status_workflow_id, task_status_definition_id,
        assignee_group_id, duration_days, effort_hours,
        take_retake_mode, take_retake_count
      ) VALUES (
        CASE WHEN p_entity_type = 'environment' THEN p_entity_id ELSE NULL END,
        CASE WHEN p_entity_type = 'job' THEN p_entity_id ELSE NULL END,
        CASE WHEN p_entity_type = 'scene' THEN p_entity_id ELSE NULL END,
        v_process.name, v_process.default_completion, v_default_status_name, v_process.position,
        p_workflow_id, v_process.id,
        v_process.task_status_workflow_id, v_process.default_task_status_id,
        v_process.assignee_group_id, v_process.duration_days, v_process.effort_hours,
        v_process.take_retake_mode, v_process.take_retake_count
      ) ON CONFLICT ON CONSTRAINT uq_production_task_process DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
