-- Phase 4A: Project Management

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  project_code text not null unique check (project_code ~ '^[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$'),
  description text,
  thumbnail_url text,
  status text not null default 'Active' check (status in ('Active', 'Retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.production_environments
  add column if not exists project_id uuid references public.projects(id) on delete restrict;

-- Seed default project and map existing environments safely
insert into public.projects (id, title, project_code, description, status, updated_at)
values (
  '00000000-0000-4000-8000-000000000000',
  'Default Project',
  'DEFAULT_01',
  'Auto-generated default project',
  'Active',
  now()
)
on conflict (id) do nothing;

update public.production_environments
set project_id = '00000000-0000-4000-8000-000000000000'
where project_id is null;

-- Make project_id not null
alter table public.production_environments
  alter column project_id set not null;

create index if not exists production_environments_project_id_idx
  on public.production_environments (project_id);

alter table public.projects enable row level security;

-- Temporary development policies
create policy "Allow all on projects"
  on public.projects
  for all
  using (true);
