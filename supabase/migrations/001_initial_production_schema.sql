-- AssetStage production tracking schema.
-- Structure: production environments -> episodes -> scenes -> production tasks / scene notes.

create extension if not exists pgcrypto;

create table if not exists public.production_environments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  environment_id uuid not null references public.production_environments(id) on delete cascade,
  episode_name text not null,
  description text,
  preview_image text,
  code text,
  start_date date,
  end_date date,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scenes (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  scene_name text not null,
  description text,
  preview_image text,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_tasks (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references public.scenes(id) on delete cascade,
  name text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'Unassigned' check (
    status in (
      'Unassigned',
      'In Progress',
      'Pending',
      'To Validate',
      'Review',
      'Approved',
      'Rejected',
      'Standby'
    )
  ),
  assignee text,
  start_date date,
  end_date date,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scene_notes (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references public.scenes(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists production_environments_name_idx
  on public.production_environments (name);

create index if not exists episodes_environment_id_sort_order_idx
  on public.episodes (environment_id, sort_order, episode_name);

create index if not exists scenes_episode_id_sort_order_idx
  on public.scenes (episode_id, sort_order, scene_name);

create index if not exists production_tasks_scene_id_sort_order_idx
  on public.production_tasks (scene_id, sort_order, name);

create index if not exists scene_notes_scene_id_created_at_idx
  on public.scene_notes (scene_id, created_at);

alter table public.production_environments enable row level security;
alter table public.episodes enable row level security;
alter table public.scenes enable row level security;
alter table public.production_tasks enable row level security;
alter table public.scene_notes enable row level security;
