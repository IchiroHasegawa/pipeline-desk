-- Phase 4B: Environment Management

alter table public.production_environments
  add column if not exists thumbnail_url text,
  add column if not exists status text not null default 'Active' check (status in ('Active', 'Retired'));

-- Ensure existing environments are set to 'Active'
update public.production_environments
set status = 'Active'
where status is null;

-- Temporary development policies for Environment Management
create policy "Allow all on production environments"
  on public.production_environments
  for all
  using (true);
