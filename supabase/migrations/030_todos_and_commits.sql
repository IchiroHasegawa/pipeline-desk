-- Migration 030: To Dos and Commits
--
-- A "Commit" is not a separate entity. It is a To Do with completed_at set.
-- The Manage pages read one table for both panels:
--   To Do panel  -> completed_at IS NULL,     ordered by sort_order
--   Commit panel -> completed_at IS NOT NULL, ordered by completed_at DESC
--
-- This keeps the two panels incapable of disagreeing, and makes un-checking a
-- To Do a single UPDATE rather than a delete-plus-insert across two tables.
--
-- Depends on: 028 (flattened hierarchy), 029 (days / custom tasks).

begin;

-- ---------------------------------------------------------------------------
-- 1. todos
-- ---------------------------------------------------------------------------

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),

  -- Scope: exactly one of episode_id / scene_id. Enforced by CHECK below.
  episode_id uuid references public.episodes(id) on delete cascade,
  scene_id   uuid references public.scenes(id)   on delete cascade,

  -- Optional link to the Main Task this work counts toward. Drives the
  -- "Last commit..." caption under each row of the Main Tasks panel.
  task_id uuid references public.production_tasks(id) on delete set null,

  -- To Dos are personal. Every row belongs to exactly one user.
  user_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  description text,
  sort_order integer,

  -- NULL = open To Do. Non-null = a commit, and the moment it happened.
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint todos_one_scope check (
    (episode_id is not null and scene_id is null) or
    (episode_id is null     and scene_id is not null)
  ),

  constraint todos_title_not_blank check (length(btrim(title)) > 0)
);

-- Open To Dos for one user on one episode, in display order.
create index if not exists todos_episode_open_idx
  on public.todos (episode_id, user_id, sort_order)
  where completed_at is null;

create index if not exists todos_scene_open_idx
  on public.todos (scene_id, user_id, sort_order)
  where completed_at is null;

-- Commit feed: most recent first.
create index if not exists todos_commits_idx
  on public.todos (user_id, completed_at desc)
  where completed_at is not null;

-- "Last commit..." lookup per Main Task.
create index if not exists todos_task_commits_idx
  on public.todos (task_id, completed_at desc)
  where completed_at is not null and task_id is not null;

-- ---------------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------------
-- Deliberately NOT the blanket "Active users can manage X" pattern from 022.
--
-- Read is workspace-wide so a supervisor can see a team member's progress and
-- so the "Last commit..." caption works regardless of who did the work.
-- Write is restricted to the owner: one user must not be able to tick off,
-- edit, or delete another user's To Dos.

alter table public.todos enable row level security;

drop policy if exists "Active users can read todos" on public.todos;
drop policy if exists "Users can insert own todos" on public.todos;
drop policy if exists "Users can update own todos" on public.todos;
drop policy if exists "Users can delete own todos" on public.todos;

create policy "Active users can read todos" on public.todos
  for select to authenticated
  using (public.is_active_user());

create policy "Users can insert own todos" on public.todos
  for insert to authenticated
  with check (public.is_active_user() and user_id = auth.uid());

create policy "Users can update own todos" on public.todos
  for update to authenticated
  using (public.is_active_user() and user_id = auth.uid())
  with check (public.is_active_user() and user_id = auth.uid());

create policy "Users can delete own todos" on public.todos
  for delete to authenticated
  using (public.is_active_user() and user_id = auth.uid());

revoke all on public.todos from anon;

-- ---------------------------------------------------------------------------
-- 3. Guard against client-side user_id spoofing
-- ---------------------------------------------------------------------------
-- The WITH CHECK above already blocks inserting as another user, but this
-- makes user_id default correctly so the client never has to send it.

alter table public.todos alter column user_id set default auth.uid();

commit;

-- ---------------------------------------------------------------------------
-- Verification (run manually)
-- ---------------------------------------------------------------------------
-- select count(*) from information_schema.columns
--   where table_schema='public' and table_name='todos';            -- expect 11
--
-- select policyname, cmd from pg_policies
--   where schemaname='public' and tablename='todos' order by cmd;  -- expect 4
--
-- select indexname from pg_indexes
--   where schemaname='public' and tablename='todos';               -- expect 4 + pkey
--
-- Scope constraint must reject a row with both, and a row with neither:
--   insert into public.todos (episode_id, scene_id, title)
--     values ('<ep uuid>', '<scene uuid>', 'x');   -- must FAIL
--   insert into public.todos (title) values ('x'); -- must FAIL
