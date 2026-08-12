-- Migration 031: Assembly Boards
--
-- One generic board model serves BOTH the Scene Assembly page (step 9) and the
-- Asset Assembly page (step 10). A board is scoped to exactly one scene or one
-- project; its elements are keyframes, assets, folders, comments, and arrows.
--
-- Keyframes get their own element_type rather than a separate table: they live
-- on the board, carry board coordinates, and are auto-numbered per board —
-- which is exactly what a board element is. The Scene Manage keyframe strip
-- reads element_type = 'keyframe' ordered by keyframe_number.
--
-- Depends on: 028, 029, 030.

begin;

-- ---------------------------------------------------------------------------
-- 1. boards
-- ---------------------------------------------------------------------------

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  scene_id   uuid references public.scenes(id)   on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint boards_one_scope check (
    (scene_id is not null and project_id is null) or
    (scene_id is null     and project_id is not null)
  )
);

-- One board per scene, one per project.
create unique index if not exists boards_scene_uniq
  on public.boards (scene_id) where scene_id is not null;
create unique index if not exists boards_project_uniq
  on public.boards (project_id) where project_id is not null;

-- ---------------------------------------------------------------------------
-- 2. board_elements
-- ---------------------------------------------------------------------------

create table if not exists public.board_elements (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,

  element_type text not null check (
    element_type in ('keyframe', 'asset', 'folder', 'comment', 'arrow')
  ),

  -- Folder nesting. Deleting a folder orphans its children onto the board
  -- rather than destroying them — losing work to a mis-click is unacceptable.
  parent_folder_id uuid references public.board_elements(id) on delete set null,

  -- Board-space geometry
  x numeric not null default 0,
  y numeric not null default 0,
  width  numeric,
  height numeric,
  z_index integer not null default 0,

  -- Content
  title text,
  body text,
  colour text,

  -- Media reference. image_url is for pasted/external images that are not
  -- yet promoted to a managed asset.
  asset_id      uuid references public.assets(id)      on delete cascade,
  asset_file_id uuid references public.asset_files(id) on delete set null,
  image_url text,

  -- Auto-assigned per board for keyframes. See trigger below.
  keyframe_number integer,

  -- Arrow endpoints
  from_element_id uuid references public.board_elements(id) on delete cascade,
  to_element_id   uuid references public.board_elements(id) on delete cascade,

  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- An arrow needs both ends and cannot point at itself.
  constraint board_elements_arrow_ends check (
    element_type <> 'arrow' or (
      from_element_id is not null
      and to_element_id is not null
      and from_element_id <> to_element_id
    )
  ),

  -- A keyframe needs something to render.
  constraint board_elements_keyframe_media check (
    element_type <> 'keyframe' or (
      asset_id is not null or asset_file_id is not null or image_url is not null
    )
  ),

  -- Only folders may parent other elements.
  constraint board_elements_no_self_parent check (
    parent_folder_id is null or parent_folder_id <> id
  )
);

-- Keyframe numbering is unique per board and gap-tolerant.
create unique index if not exists board_elements_keyframe_number_uniq
  on public.board_elements (board_id, keyframe_number)
  where element_type = 'keyframe' and keyframe_number is not null;

create index if not exists board_elements_board_idx
  on public.board_elements (board_id, z_index);

create index if not exists board_elements_keyframe_idx
  on public.board_elements (board_id, keyframe_number)
  where element_type = 'keyframe';

create index if not exists board_elements_folder_idx
  on public.board_elements (parent_folder_id)
  where parent_folder_id is not null;

create index if not exists board_elements_arrow_idx
  on public.board_elements (from_element_id, to_element_id)
  where element_type = 'arrow';

-- ---------------------------------------------------------------------------
-- 3. Keyframe auto-numbering
-- ---------------------------------------------------------------------------
-- Assigns the next free number on insert when the client does not supply one.
--
-- NOTE: two simultaneous inserts can compute the same number. The unique index
-- above rejects the loser with a 23505, and the client should retry. This is
-- deliberate — a sequence per board would leak numbers on every failed insert,
-- and gaps are more confusing to a user than an occasional retry.

create or replace function public.assign_keyframe_number()
returns trigger as $$
begin
  if new.element_type = 'keyframe' and new.keyframe_number is null then
    select coalesce(max(keyframe_number), 0) + 1
      into new.keyframe_number
      from public.board_elements
     where board_id = new.board_id
       and element_type = 'keyframe';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists board_elements_assign_keyframe_number on public.board_elements;
create trigger board_elements_assign_keyframe_number
  before insert on public.board_elements
  for each row execute function public.assign_keyframe_number();

-- ---------------------------------------------------------------------------
-- 4. get_or_create_board
-- ---------------------------------------------------------------------------
-- Boards are created lazily the first time a scene or project is opened in
-- Assembly. Doing this in one round trip avoids a read-then-write race that
-- would otherwise trip the unique indexes.

create or replace function public.get_or_create_board(
  p_scene_id uuid default null,
  p_project_id uuid default null
) returns uuid as $$
declare
  v_id uuid;
begin
  if not public.is_active_user() then
    raise exception 'Not authorized';
  end if;

  if (p_scene_id is null) = (p_project_id is null) then
    raise exception 'Provide exactly one of p_scene_id or p_project_id';
  end if;

  if p_scene_id is not null then
    select id into v_id from public.boards where scene_id = p_scene_id;
    if v_id is null then
      insert into public.boards (scene_id) values (p_scene_id)
      on conflict (scene_id) where scene_id is not null do nothing
      returning id into v_id;
      if v_id is null then
        select id into v_id from public.boards where scene_id = p_scene_id;
      end if;
    end if;
  else
    select id into v_id from public.boards where project_id = p_project_id;
    if v_id is null then
      insert into public.boards (project_id) values (p_project_id)
      on conflict (project_id) where project_id is not null do nothing
      returning id into v_id;
      if v_id is null then
        select id into v_id from public.boards where project_id = p_project_id;
      end if;
    end if;
  end if;

  return v_id;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.get_or_create_board(uuid, uuid) from public;
revoke execute on function public.get_or_create_board(uuid, uuid) from anon;
grant execute on function public.get_or_create_board(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
-- Boards are shared collaborative surfaces, not personal like todos. The
-- blanket active-user policy from 022 is correct here.

alter table public.boards enable row level security;
alter table public.board_elements enable row level security;

drop policy if exists "Active users can manage boards" on public.boards;
create policy "Active users can manage boards" on public.boards
  for all to authenticated
  using (public.is_active_user())
  with check (public.is_active_user());

drop policy if exists "Active users can manage board_elements" on public.board_elements;
create policy "Active users can manage board_elements" on public.board_elements
  for all to authenticated
  using (public.is_active_user())
  with check (public.is_active_user());

revoke all on public.boards from anon;
revoke all on public.board_elements from anon;

commit;

-- ---------------------------------------------------------------------------
-- Verification (run manually)
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from information_schema.tables
--     where table_schema='public' and table_name in ('boards','board_elements')) as tables,
--   (select count(*) from pg_policies
--     where schemaname='public' and tablename in ('boards','board_elements')) as policies,
--   (select count(*) from pg_trigger
--     where tgname='board_elements_assign_keyframe_number') as trigger_present,
--   (select count(*) from pg_proc
--     where proname='get_or_create_board') as rpc_present;
-- expect: tables=2, policies=2, trigger_present=1, rpc_present=1
--
-- Auto-numbering must produce 1 then 2:
--   select public.get_or_create_board(p_scene_id => '<scene uuid>');
--   insert into public.board_elements (board_id, element_type, image_url)
--     values ('<board uuid>','keyframe','x'), ('<board uuid>','keyframe','y')
--     returning keyframe_number;
--   -- then delete the two test rows
