-- Migration 025: Seed Basic Task Status Workflow

-- Idempotent check
DO $$
DECLARE
  v_workflow_id uuid;
BEGIN
  -- Check if the workflow already exists
  SELECT id INTO v_workflow_id FROM public.workflows WHERE workflow_code = 'B-TS' AND workflow_type = 'task_status' LIMIT 1;

  IF v_workflow_id IS NULL THEN
    -- Insert the Basic Task Status workflow
    INSERT INTO public.workflows (
      name, workflow_code, workflow_type, colour, description, status, sort_order
    ) VALUES (
      'Basic Task Status', 'B-TS', 'task_status', '#888888', 'Standard baseline task status configuration.', 'active', 0
    ) RETURNING id INTO v_workflow_id;

    -- Insert the 7 standard statuses
    INSERT INTO public.workflow_task_statuses (
      workflow_id, name, status_code, colour, position, completion_percentage, status
    ) VALUES 
      (v_workflow_id, 'Standby', 'SBY', '#555555', 0, 0, 'active'),
      (v_workflow_id, 'Pending', 'PND', '#ffcc00', 1, 10, 'active'),
      (v_workflow_id, 'Need Assistance', 'AST', '#ff3333', 2, 10, 'active'),
      (v_workflow_id, 'In Progress', 'PRG', '#3399ff', 3, 50, 'active'),
      (v_workflow_id, 'To Validate', 'VAL', '#ff9933', 4, 90, 'active'),
      (v_workflow_id, 'Revise', 'REV', '#cc33ff', 5, 50, 'active'),
      (v_workflow_id, 'Approved', 'APP', '#33cc33', 6, 100, 'active');
  END IF;
END $$;
