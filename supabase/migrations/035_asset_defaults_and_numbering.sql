-- Migration 035: Asset numbering and per-project upload defaults
--
-- Uploading assets currently requires name, code, category and workflow for
-- every file, which is unusable when dropping many images at once. This adds
-- the defaults needed to derive those automatically.
--
-- Depends on: 028-032, 034.

begin;

-- ---------------------------------------------------------------------------
-- 1. Per-project upload defaults
-- ---------------------------------------------------------------------------

alter table public.projects
  add column if not exists default_asset_workflow_id uuid
    references public.workflows(id) on delete set null,
  add column if not exists asset_code_prefix text;

-- Seed the prefix from the existing project code so codes are sensible
-- immediately without the user configuring anything.
update public.projects
set asset_code_prefix = project_code
where asset_code_prefix is null;

-- ---------------------------------------------------------------------------
-- 2. Global asset numbering
-- ---------------------------------------------------------------------------
-- Numbering is GLOBAL, not per project. Assets reach projects through link
-- tables and may be linked to several, so a per-project counter would have no
-- single correct value for a shared asset.

create sequence if not exists public.asset_number_seq;

alter table public.assets
  add column if not exists asset_number integer;

-- Backfill existing rows in creation order.
do $$
declare
  r record;
begin
  for r in select id from public.assets where asset_number is null order by created_at
  loop
    update public.assets
    set asset_number = nextval('public.asset_number_seq')
    where id = r.id;
  end loop;
end $$;

alter table public.assets
  alter column asset_number set default nextval('public.asset_number_seq');

create unique index if not exists assets_asset_number_uniq
  on public.assets (asset_number);

commit;

-- ---------------------------------------------------------------------------
-- Verification (run manually)
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from information_schema.columns
--     where table_schema='public' and table_name='projects'
--       and column_name in ('default_asset_workflow_id','asset_code_prefix')) as project_cols,
--   (select count(*) from information_schema.columns
--     where table_schema='public' and table_name='assets'
--       and column_name='asset_number') as asset_num_col,
--   (select count(*) from public.assets where asset_number is null) as unnumbered,
--   (select column_default from information_schema.columns
--     where table_schema='public' and table_name='assets'
--       and column_name='asset_number') as number_default;
--
-- expect: project_cols=2, asset_num_col=1, unnumbered=0,
--         number_default containing nextval('asset_number_seq')
