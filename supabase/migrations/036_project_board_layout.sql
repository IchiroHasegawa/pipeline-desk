-- Migration 036: Record projects.board_layout; remove the project_spans view.
--
-- board_layout holds x/y/z positions for the four Project-page info graphs.
-- It is deliberately NOT board_elements: 031's boards_project_uniq means a
-- project's single board row already belongs to the Asset Assembly canvas,
-- and element_type has no 'graph' value.
--
-- Both statements are idempotent — this file records objects that were applied
-- directly to the database before it existed.
--
-- Depends on: 028 through 035.

begin;

alter table public.projects
  add column if not exists board_layout jsonb not null default '{}'::jsonb;

comment on column public.projects.board_layout is
  'Info-graph positions for the Project board, keyed by graph id: '
  '{"episodeStatus":{"x":0,"y":0,"z":1}, "commits":{...}, "assets":{...}, "reviews":{...}}';

-- Created in error during an earlier session. projects.start_date and
-- projects.end_date (added by 028) supersede it.
drop view if exists public.project_spans;

commit;

-- VERIFICATION (run manually)
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'projects'
--    and column_name in ('board_layout','start_date','end_date');
--
-- select count(*) as should_be_zero
--   from information_schema.views
--  where table_schema = 'public' and table_name = 'project_spans';