-- Emits the seed rows that migrations 003 / 025 / 026 / 032 create, as a
-- single JSON document with Mongo field names, for scripts/seed-mongo.ts.
--
--   ssh ameya@<host> 'docker exec -i supabase-db psql -U postgres -d postgres -t -A -f -' \
--     < scripts/extract-seed-data.sql > docs/mongo-migration/seed-data.json
--
-- Extracted from the live database rather than transcribed from the migration
-- SQL: there are 60 workflow processes alone, and a hand-copied value that
-- drifts would be invisible until something downstream behaved oddly.
--
-- production_tasks is deliberately absent. Its 11 hand-seeded demo rows are
-- what collide with migration 027's unique constraint, and the Phase 0 deploy
-- patch drops them; re-seeding them would reintroduce the problem.

SELECT jsonb_pretty(jsonb_build_object(

  'projects', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      '_id', id, 'title', title, 'projectCode', project_code,
      'description', description, 'thumbnailUrl', thumbnail_url,
      'status', status, 'startDate', start_date, 'endDate', end_date,
      'isSystem', is_system, 'assetCodePrefix', asset_code_prefix,
      'defaultAssetWorkflowId', default_asset_workflow_id,
      'boardLayout', board_layout
    ) ORDER BY project_code) FROM public.projects), '[]'::jsonb),

  'episodes', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      '_id', id, 'projectId', project_id, 'episodeName', episode_name,
      'code', code, 'description', description, 'status', status,
      'startDate', start_date, 'endDate', end_date, 'sortOrder', sort_order,
      'previewImage', preview_image, 'jobWorkflow', job_workflow,
      'sceneWorkflow', scene_workflow
    ) ORDER BY sort_order, id) FROM public.episodes), '[]'::jsonb),

  'scenes', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      '_id', id, 'episodeId', episode_id, 'sceneName', scene_name,
      'description', description, 'status', status, 'priority', priority,
      'numberOfFrames', number_of_frames, 'workflow', workflow,
      'sortOrder', sort_order, 'previewImage', preview_image
    ) ORDER BY sort_order, id) FROM public.scenes), '[]'::jsonb),

  'sceneNotes', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      '_id', id, 'sceneId', scene_id, 'content', content
    ) ORDER BY id) FROM public.scene_notes), '[]'::jsonb),

  'assetCategories', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      '_id', id, 'name', name, 'sortOrder', sort_order
    ) ORDER BY sort_order, name) FROM public.asset_categories), '[]'::jsonb),

  'workflows', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      '_id', id, 'name', name, 'colour', colour,
      'workflowCode', workflow_code, 'workflowType', workflow_type,
      'description', description, 'status', status, 'sortOrder', sort_order
    ) ORDER BY workflow_type, sort_order, name) FROM public.workflows), '[]'::jsonb),

  'workflowTaskStatuses', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      '_id', id, 'workflowId', workflow_id, 'name', name, 'colour', colour,
      'statusCode', status_code, 'status', status, 'position', position,
      'completionPercentage', completion_percentage
    ) ORDER BY workflow_id, position) FROM public.workflow_task_statuses), '[]'::jsonb),

  'workflowProcesses', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      '_id', id, 'workflowId', workflow_id, 'name', name, 'colour', colour,
      'processType', process_type, 'status', status, 'position', position,
      'durationDays', duration_days, 'effortHours', effort_hours,
      'defaultCompletion', default_completion,
      'takeRetakeMode', take_retake_mode, 'takeRetakeCount', take_retake_count,
      'assigneeGroupId', assignee_group_id,
      'defaultTaskStatusId', default_task_status_id,
      'taskStatusWorkflowId', task_status_workflow_id
    ) ORDER BY workflow_id, position) FROM public.workflow_processes), '[]'::jsonb)

));
