-- Migration 026: Remove Environment Workflows and Seed Initial Workflows

-- 1. Remove 'environment' from workflow_type constraint
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  -- Find the check constraint on workflow_type
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.workflows'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%workflow_type%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.workflows DROP CONSTRAINT ' || v_constraint_name;
  END IF;
  
  -- Add new constraint without 'environment'
  ALTER TABLE public.workflows ADD CONSTRAINT workflows_workflow_type_check CHECK (workflow_type IN ('job', 'scene', 'asset', 'task_status'));
END $$;


-- 2. Seed Initial Workflows
DO $$
DECLARE
  v_workflow_id uuid;
  v_basic_task_status_id uuid;
  v_standby_status_id uuid;
BEGIN
  -- Get Basic Task Status workflow & Standby status
  SELECT id INTO v_basic_task_status_id FROM public.workflows WHERE workflow_code = 'B-TS' AND workflow_type = 'task_status' LIMIT 1;
  IF v_basic_task_status_id IS NOT NULL THEN
    SELECT id INTO v_standby_status_id FROM public.workflow_task_statuses WHERE workflow_id = v_basic_task_status_id AND status_code = 'SBY' LIMIT 1;
  END IF;

  -- ==========================================
  -- JOB: Episodes
  -- ==========================================
  SELECT id INTO v_workflow_id FROM public.workflows WHERE workflow_code = 'WF-JOB-EPISODES' LIMIT 1;
  IF v_workflow_id IS NULL THEN
    INSERT INTO public.workflows (name, workflow_code, workflow_type, colour, description, status)
    VALUES ('Episodes', 'WF-JOB-EPISODES', 'job', '#888888', 'Workflow to track Jobs such as Episodes of a TV series.', 'active')
    RETURNING id INTO v_workflow_id;
    
    INSERT INTO public.workflow_processes (workflow_id, name, process_type, colour, position, task_status_workflow_id, default_task_status_id, default_completion, take_retake_mode, take_retake_count, status) VALUES
    (v_workflow_id, 'Script', 'Manual', '#888888', 1, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Storyboard', 'Manual', '#33cc33', 2, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Layout', 'Manual', '#3399ff', 3, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Setup', 'Manual', '#99ff99', 4, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Animation', 'Manual', '#ffcc00', 5, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Compositing', 'Manual', '#ff9933', 6, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Post-Production', 'Manual', '#cccccc', 7, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active');
  END IF;

  -- ==========================================
  -- SCENE: Basic
  -- ==========================================
  SELECT id INTO v_workflow_id FROM public.workflows WHERE workflow_code = 'WF-SCN-BASIC' LIMIT 1;
  IF v_workflow_id IS NULL THEN
    INSERT INTO public.workflows (name, workflow_code, workflow_type, colour, description, status)
    VALUES ('Basic', 'WF-SCN-BASIC', 'scene', '#3399ff', 'Workflow to track Scenes in a simple manner.', 'active')
    RETURNING id INTO v_workflow_id;

    INSERT INTO public.workflow_processes (workflow_id, name, process_type, colour, position, task_status_workflow_id, default_task_status_id, default_completion, take_retake_mode, take_retake_count, status) VALUES
    (v_workflow_id, 'Layout', 'Manual', '#3399ff', 1, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Setup', 'Manual', '#99ff99', 2, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Animation', 'Manual', '#ffcc00', 3, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Compositing', 'Manual', '#ff9933', 4, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active');
  END IF;

  -- ==========================================
  -- SCENE: Complete
  -- ==========================================
  SELECT id INTO v_workflow_id FROM public.workflows WHERE workflow_code = 'WF-SCN-COMPLETE' LIMIT 1;
  IF v_workflow_id IS NULL THEN
    INSERT INTO public.workflows (name, workflow_code, workflow_type, colour, description, status)
    VALUES ('Complete', 'WF-SCN-COMPLETE', 'scene', '#ff9933', 'Workflow to track complete 2D paperless Scene production, where animation is drawn digitally.', 'active')
    RETURNING id INTO v_workflow_id;

    INSERT INTO public.workflow_processes (workflow_id, name, process_type, colour, position, task_status_workflow_id, default_task_status_id, default_completion, take_retake_mode, take_retake_count, status) VALUES
    (v_workflow_id, 'Layout', 'Manual', '#3399ff', 1, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Layout Check', 'Approval', '#cccccc', 2, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Layout Approval', 'Approval', '#cccccc', 3, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Setup', 'Manual', '#99ff99', 4, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Animation', 'Manual', '#ffcc00', 5, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Animation Check', 'Approval', '#cccccc', 6, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Animation Approval', 'Approval', '#cccccc', 7, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Clean-Up / Inbetween', 'Manual', '#888888', 8, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Clean-Up / Inbetween Check', 'Approval', '#cccccc', 9, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Clean-Up / Inbetween Approval', 'Approval', '#cccccc', 10, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Ink', 'Manual', '#ff33cc', 11, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Ink Check', 'Approval', '#cccccc', 12, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Ink Approval', 'Approval', '#cccccc', 13, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Compositing', 'Manual', '#ff9933', 14, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Compositing Check', 'Approval', '#cccccc', 15, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Compositing Approval', 'Approval', '#cccccc', 16, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active');
  END IF;

  -- ==========================================
  -- SCENE: Double Approval
  -- ==========================================
  SELECT id INTO v_workflow_id FROM public.workflows WHERE workflow_code = 'WF-SCN-DOUBLE-APPROVAL' LIMIT 1;
  IF v_workflow_id IS NULL THEN
    INSERT INTO public.workflows (name, workflow_code, workflow_type, colour, description, status)
    VALUES ('Double Approval', 'WF-SCN-DOUBLE-APPROVAL', 'scene', '#ffcc00', 'Workflow to track Scenes where two approval stages are required for every major production step.', 'active')
    RETURNING id INTO v_workflow_id;

    INSERT INTO public.workflow_processes (workflow_id, name, process_type, colour, position, task_status_workflow_id, default_task_status_id, default_completion, take_retake_mode, take_retake_count, status) VALUES
    (v_workflow_id, 'Layout', 'Manual', '#3399ff', 1, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Layout Check', 'Approval', '#cccccc', 2, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Layout Approval', 'Approval', '#cccccc', 3, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Setup', 'Manual', '#99ff99', 4, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Animation', 'Manual', '#ffcc00', 5, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Animation Check', 'Approval', '#cccccc', 6, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Animation Approval', 'Approval', '#cccccc', 7, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Compositing', 'Manual', '#ff9933', 8, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Compositing Check', 'Approval', '#cccccc', 9, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Compositing Approval', 'Approval', '#cccccc', 10, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active');
  END IF;

  -- ==========================================
  -- SCENE: Single Approval
  -- ==========================================
  SELECT id INTO v_workflow_id FROM public.workflows WHERE workflow_code = 'WF-SCN-SINGLE-APPROVAL' LIMIT 1;
  IF v_workflow_id IS NULL THEN
    INSERT INTO public.workflows (name, workflow_code, workflow_type, colour, description, status)
    VALUES ('Single Approval', 'WF-SCN-SINGLE-APPROVAL', 'scene', '#99ff99', 'Workflow to track Scenes where one approval stage is required for every major production step.', 'active')
    RETURNING id INTO v_workflow_id;

    INSERT INTO public.workflow_processes (workflow_id, name, process_type, colour, position, task_status_workflow_id, default_task_status_id, default_completion, take_retake_mode, take_retake_count, status) VALUES
    (v_workflow_id, 'Layout', 'Manual', '#3399ff', 1, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Layout Approval', 'Approval', '#cccccc', 2, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Setup', 'Manual', '#99ff99', 3, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Animation', 'Manual', '#ffcc00', 4, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Animation Approval', 'Approval', '#cccccc', 5, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Compositing', 'Manual', '#ff9933', 6, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Compositing Approval', 'Approval', '#cccccc', 7, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active');
  END IF;

  -- ==========================================
  -- ASSET: BG
  -- ==========================================
  SELECT id INTO v_workflow_id FROM public.workflows WHERE workflow_code = 'WF-AST-BG' LIMIT 1;
  IF v_workflow_id IS NULL THEN
    INSERT INTO public.workflows (name, workflow_code, workflow_type, colour, description, status)
    VALUES ('BG', 'WF-AST-BG', 'asset', '#3399ff', 'Workflow to track the creation of bitmap backgrounds.', 'active')
    RETURNING id INTO v_workflow_id;

    INSERT INTO public.workflow_processes (workflow_id, name, process_type, colour, position, task_status_workflow_id, default_task_status_id, default_completion, take_retake_mode, take_retake_count, status) VALUES
    (v_workflow_id, 'BG Layout', 'Manual', '#3399ff', 1, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'BG Layout Approval', 'Approval', '#cccccc', 2, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'BG Colour', 'Manual', '#ff99cc', 3, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'BG Final', 'Approval', '#cccccc', 4, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Library', 'Manual', '#888888', 5, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active');
  END IF;

  -- ==========================================
  -- ASSET: Character
  -- ==========================================
  SELECT id INTO v_workflow_id FROM public.workflows WHERE workflow_code = 'WF-AST-CHARACTER' LIMIT 1;
  IF v_workflow_id IS NULL THEN
    INSERT INTO public.workflows (name, workflow_code, workflow_type, colour, description, status)
    VALUES ('Character', 'WF-AST-CHARACTER', 'asset', '#99ff99', 'Workflow to track the creation and development of production Characters.', 'active')
    RETURNING id INTO v_workflow_id;

    INSERT INTO public.workflow_processes (workflow_id, name, process_type, colour, position, task_status_workflow_id, default_task_status_id, default_completion, take_retake_mode, take_retake_count, status) VALUES
    (v_workflow_id, 'Character Design', 'Manual', '#99ff99', 1, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Character Design Approval', 'Approval', '#cccccc', 2, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Mouth Charts', 'Manual', '#3399ff', 3, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Breakdown', 'Manual', '#33cc33', 4, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Rigging', 'Manual', '#33cccc', 5, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Library', 'Manual', '#888888', 6, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active');
  END IF;

  -- ==========================================
  -- ASSET: Prop
  -- ==========================================
  SELECT id INTO v_workflow_id FROM public.workflows WHERE workflow_code = 'WF-AST-PROP' LIMIT 1;
  IF v_workflow_id IS NULL THEN
    INSERT INTO public.workflows (name, workflow_code, workflow_type, colour, description, status)
    VALUES ('Prop', 'WF-AST-PROP', 'asset', '#ffcc00', 'Workflow to track the creation and development of production Props.', 'active')
    RETURNING id INTO v_workflow_id;

    INSERT INTO public.workflow_processes (workflow_id, name, process_type, colour, position, task_status_workflow_id, default_task_status_id, default_completion, take_retake_mode, take_retake_count, status) VALUES
    (v_workflow_id, 'Prop Design', 'Manual', '#ffcc00', 1, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Prop Design Approval', 'Approval', '#cccccc', 2, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Prop Colour', 'Manual', '#ff9933', 3, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Prop Final', 'Approval', '#cccccc', 4, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active'),
    (v_workflow_id, 'Library', 'Manual', '#888888', 5, v_basic_task_status_id, v_standby_status_id, 0, 'Take', 1, 'active');
  END IF;

END $$;
