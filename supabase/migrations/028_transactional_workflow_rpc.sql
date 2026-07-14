-- 1. Drop existing function to change return type
DROP FUNCTION IF EXISTS public.generate_workflow_tasks(text, uuid, uuid);

-- 2. Create updated transactional RPC
CREATE OR REPLACE FUNCTION public.generate_workflow_tasks(
  p_entity_type text,
  p_entity_id uuid,
  p_workflow_id uuid,
  p_parent_id uuid DEFAULT NULL,
  p_entity_data jsonb DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_process record;
  v_default_status_name text;
  v_workflow_type text;
  v_entity jsonb;
  v_tasks jsonb := '[]'::jsonb;
  v_task_row record;
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

  -- Create Entity if data is provided
  IF p_entity_data IS NOT NULL THEN
    IF p_entity_type = 'job' THEN
      INSERT INTO public.episodes (
        id, environment_id, episode_name, description, preview_image, code, start_date, end_date, status, job_workflow, scene_workflow
      ) VALUES (
        p_entity_id, 
        p_parent_id, 
        p_entity_data->>'episode_name', 
        p_entity_data->>'description', 
        p_entity_data->>'preview_image', 
        p_entity_data->>'code', 
        (p_entity_data->>'start_date')::date, 
        (p_entity_data->>'end_date')::date, 
        COALESCE(p_entity_data->>'status', 'Active'),
        p_entity_data->>'job_workflow',
        p_entity_data->>'scene_workflow'
      ) ON CONFLICT (id) DO UPDATE SET episode_name = EXCLUDED.episode_name
      RETURNING to_jsonb(episodes.*) INTO v_entity;
    ELSIF p_entity_type = 'scene' THEN
      INSERT INTO public.scenes (
        id, episode_id, scene_name, description, preview_image, status, number_of_frames, priority, workflow
      ) VALUES (
        p_entity_id, 
        p_parent_id, 
        p_entity_data->>'scene_name', 
        p_entity_data->>'description', 
        p_entity_data->>'preview_image', 
        COALESCE(p_entity_data->>'status', 'Active'), 
        (p_entity_data->>'number_of_frames')::integer, 
        (p_entity_data->>'priority')::integer,
        p_entity_data->>'workflow'
      ) ON CONFLICT (id) DO UPDATE SET scene_name = EXCLUDED.scene_name
      RETURNING to_jsonb(scenes.*) INTO v_entity;
    ELSIF p_entity_type = 'asset' THEN
      INSERT INTO public.assets (
        id, asset_name, asset_code, description, priority, category_id, asset_type, preview_url, status, workflow
      ) VALUES (
        p_entity_id, 
        p_entity_data->>'asset_name', 
        p_entity_data->>'asset_code', 
        p_entity_data->>'description', 
        (p_entity_data->>'priority')::integer, 
        (p_entity_data->>'category_id')::uuid, 
        COALESCE(p_entity_data->>'asset_type', 'General'), 
        p_entity_data->>'preview_url', 
        COALESCE(p_entity_data->>'status', 'Active'),
        p_entity_data->>'workflow'
      ) ON CONFLICT (id) DO UPDATE SET asset_name = EXCLUDED.asset_name
      RETURNING to_jsonb(assets.*) INTO v_entity;
    END IF;
  ELSE
    -- If no entity data, we assume it's already created, but we can't return it easily without another query.
    v_entity := '{}'::jsonb;
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
      ) ON CONFLICT ON CONSTRAINT uq_asset_task_process DO UPDATE SET name = EXCLUDED.name
      RETURNING * INTO v_task_row;
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
      ) ON CONFLICT ON CONSTRAINT uq_production_task_process DO UPDATE SET name = EXCLUDED.name
      RETURNING * INTO v_task_row;
    END IF;
    
    -- Append generated task to json array
    IF v_task_row IS NOT NULL THEN
      v_tasks := v_tasks || to_jsonb(v_task_row);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'entity', v_entity,
    'tasks', v_tasks
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
