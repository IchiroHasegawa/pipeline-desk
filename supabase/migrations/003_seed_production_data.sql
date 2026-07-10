-- Seed AssetStage production data from data/mockProductions.ts.
-- Safe to run more than once: all records use fixed UUIDs and upsert by primary key.

begin;

insert into public.production_environments (
  id,
  name,
  description,
  updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'Roger_et_ses_humains',
    '40x2 series, 2D animation, cut-out',
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Hand_to_Hand',
    'Feature film, live action and animation hybrid',
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'The_Doll',
    'Short-form 2D animation production',
    now()
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

insert into public.episodes (
  id,
  environment_id,
  episode_name,
  description,
  preview_image,
  code,
  start_date,
  end_date,
  sort_order,
  updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'RSH_109',
    'Production tracking for episode RSH_109',
    '/previews/rsh-109.jpg',
    'TBA_JOB00083',
    '2020-08-10',
    '2020-10-09',
    1,
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'RSH_110',
    'Production tracking for episode RSH_110',
    '/previews/rsh-110.jpg',
    'TBA_JOB00084',
    '2020-08-22',
    '2020-10-21',
    2,
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000003',
    'TD_001',
    'Production tracking for episode TD_001',
    '/previews/td-001.jpg',
    'TBA_JOB00091',
    '2020-11-01',
    '2020-11-20',
    1,
    now()
  )
on conflict (id) do update set
  environment_id = excluded.environment_id,
  episode_name = excluded.episode_name,
  description = excluded.description,
  preview_image = excluded.preview_image,
  code = excluded.code,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.scenes (
  id,
  episode_id,
  scene_name,
  description,
  preview_image,
  sort_order,
  updated_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '109_001',
    'Opening scene',
    '/previews/109-001.jpg',
    1,
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '109_002',
    'Living-room scene',
    '/previews/109-002.jpg',
    2,
    now()
  )
on conflict (id) do update set
  episode_id = excluded.episode_id,
  scene_name = excluded.scene_name,
  description = excluded.description,
  preview_image = excluded.preview_image,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.production_tasks (
  id,
  scene_id,
  name,
  progress,
  status,
  assignee,
  start_date,
  end_date,
  sort_order,
  updated_at
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Layout',
    100,
    'Approved',
    'Jade Johan',
    null,
    null,
    1,
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'Layout Check',
    100,
    'Approved',
    'Frank Banner',
    null,
    null,
    2,
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    'Setup',
    100,
    'Approved',
    'Frank Banner',
    null,
    null,
    3,
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000001',
    'Rough Animation',
    60,
    'To Validate',
    'Toon Boom Admin',
    null,
    null,
    4,
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000001',
    'Cleanup Animation',
    25,
    'Pending',
    'Lea Luthor',
    null,
    null,
    5,
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000001',
    'Compositing',
    0,
    'Standby',
    'Carina Allen',
    null,
    null,
    6,
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000007',
    '20000000-0000-4000-8000-000000000001',
    'Render',
    0,
    'Standby',
    'Sarah Wayne',
    null,
    null,
    7,
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000008',
    '20000000-0000-4000-8000-000000000002',
    'Layout',
    100,
    'Approved',
    'Jade Johan',
    null,
    null,
    1,
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000009',
    '20000000-0000-4000-8000-000000000002',
    'Setup',
    100,
    'Approved',
    'Frank Banner',
    null,
    null,
    2,
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000010',
    '20000000-0000-4000-8000-000000000002',
    'Rough Animation',
    100,
    'Approved',
    'Sarah Wayne',
    null,
    null,
    3,
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000011',
    '20000000-0000-4000-8000-000000000002',
    'Cleanup Animation',
    100,
    'Approved',
    'Lea Luthor',
    null,
    null,
    4,
    now()
  )
on conflict (id) do update set
  scene_id = excluded.scene_id,
  name = excluded.name,
  progress = excluded.progress,
  status = excluded.status,
  assignee = excluded.assignee,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.scene_notes (
  id,
  scene_id,
  content,
  updated_at
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    'Check character positioning.',
    now()
  )
on conflict (id) do update set
  scene_id = excluded.scene_id,
  content = excluded.content,
  updated_at = now();

commit;
