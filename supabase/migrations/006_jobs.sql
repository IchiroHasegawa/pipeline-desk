-- Phase 4C: Job Management

alter table public.episodes
  add column if not exists status text not null default 'Active' check (status in ('Active', 'Retired')),
  add column if not exists job_workflow text,
  add column if not exists scene_workflow text;

-- Ensure existing episodes are set to 'Active'
update public.episodes
set status = 'Active'
where status is null;

-- Temporary development policies for Job Management
create policy "Allow all on episodes"
  on public.episodes
  for all
  using (true);
