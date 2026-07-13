-- Phase 4D: Scene Management

alter table public.scenes
  add column if not exists status text not null default 'Active' check (status in ('Active', 'Retired')),
  add column if not exists workflow text,
  add column if not exists number_of_frames integer not null default 1 check (number_of_frames >= 1),
  add column if not exists priority integer not null default 4 check (priority in (1, 2, 3, 4, 5));

-- Ensure existing scenes have default values populated correctly
update public.scenes
set status = 'Active', priority = 4, number_of_frames = 1
where status is null or priority is null or number_of_frames is null;

-- Temporary development policies for Scene Management
create policy "Allow all on scenes"
  on public.scenes
  for all
  using (true);
