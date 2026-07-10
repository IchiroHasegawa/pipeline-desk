-- THESE POLICIES ARE FOR LOCAL DEVELOPMENT ONLY.
-- REMOVE THEM BEFORE PUBLIC DEPLOYMENT.
--
-- They temporarily allow the anon role to read and mutate production-tracking
-- records while authentication is not implemented. Replace these with
-- authenticated workspace and role policies before exposing the app publicly.

create policy "development anon select production environments"
  on public.production_environments
  for select
  to anon
  using (true);

create policy "development anon insert production environments"
  on public.production_environments
  for insert
  to anon
  with check (true);

create policy "development anon update production environments"
  on public.production_environments
  for update
  to anon
  using (true)
  with check (true);

create policy "development anon delete production environments"
  on public.production_environments
  for delete
  to anon
  using (true);

create policy "development anon select episodes"
  on public.episodes
  for select
  to anon
  using (true);

create policy "development anon insert episodes"
  on public.episodes
  for insert
  to anon
  with check (true);

create policy "development anon update episodes"
  on public.episodes
  for update
  to anon
  using (true)
  with check (true);

create policy "development anon delete episodes"
  on public.episodes
  for delete
  to anon
  using (true);

create policy "development anon select scenes"
  on public.scenes
  for select
  to anon
  using (true);

create policy "development anon insert scenes"
  on public.scenes
  for insert
  to anon
  with check (true);

create policy "development anon update scenes"
  on public.scenes
  for update
  to anon
  using (true)
  with check (true);

create policy "development anon delete scenes"
  on public.scenes
  for delete
  to anon
  using (true);

create policy "development anon select production tasks"
  on public.production_tasks
  for select
  to anon
  using (true);

create policy "development anon insert production tasks"
  on public.production_tasks
  for insert
  to anon
  with check (true);

create policy "development anon update production tasks"
  on public.production_tasks
  for update
  to anon
  using (true)
  with check (true);

create policy "development anon delete production tasks"
  on public.production_tasks
  for delete
  to anon
  using (true);

create policy "development anon select scene notes"
  on public.scene_notes
  for select
  to anon
  using (true);

create policy "development anon insert scene notes"
  on public.scene_notes
  for insert
  to anon
  with check (true);

create policy "development anon update scene notes"
  on public.scene_notes
  for update
  to anon
  using (true)
  with check (true);

create policy "development anon delete scene notes"
  on public.scene_notes
  for delete
  to anon
  using (true);
