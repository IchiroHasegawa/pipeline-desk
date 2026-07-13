-- Migration B: Authenticated RLS Lockdown
-- Removes all temporary anonymous policies and creates secure authenticated policies.

-- 1. Create is_active_user() helper function
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean AS $$
DECLARE
  status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT account_status INTO status FROM public.profiles WHERE id = auth.uid();
  RETURN status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke execute from public and anon
REVOKE EXECUTE ON FUNCTION public.is_active_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_active_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;

-- 2. Enable RLS and clean up existing policies for all tables

-- projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'projects'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.projects';
  END LOOP;
END $$;

-- production_environments
ALTER TABLE public.production_environments ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'production_environments'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.production_environments';
  END LOOP;
END $$;

-- episodes
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'episodes'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.episodes';
  END LOOP;
END $$;

-- scenes
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'scenes'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.scenes';
  END LOOP;
END $$;

-- production_tasks
ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'production_tasks'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.production_tasks';
  END LOOP;
END $$;

-- scene_notes
ALTER TABLE public.scene_notes ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'scene_notes'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.scene_notes';
  END LOOP;
END $$;

-- asset_categories
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'asset_categories'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.asset_categories';
  END LOOP;
END $$;

-- assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'assets'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.assets';
  END LOOP;
END $$;

-- asset_files
ALTER TABLE public.asset_files ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'asset_files'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.asset_files';
  END LOOP;
END $$;

-- asset_assignments
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'asset_assignments'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.asset_assignments';
  END LOOP;
END $$;

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.profiles';
  END LOOP;
END $$;

-- asset_project_links
ALTER TABLE public.asset_project_links ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'asset_project_links'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.asset_project_links';
  END LOOP;
END $$;

-- asset_environment_links
ALTER TABLE public.asset_environment_links ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'asset_environment_links'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.asset_environment_links';
  END LOOP;
END $$;

-- asset_job_links
ALTER TABLE public.asset_job_links ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'asset_job_links'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.asset_job_links';
  END LOOP;
END $$;

-- asset_scene_links
ALTER TABLE public.asset_scene_links ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'asset_scene_links'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.asset_scene_links';
  END LOOP;
END $$;

-- asset_storage_locations
ALTER TABLE public.asset_storage_locations ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'asset_storage_locations'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.asset_storage_locations';
  END LOOP;
END $$;

-- storage_connections
ALTER TABLE public.storage_connections ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'storage_connections'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.storage_connections';
  END LOOP;
END $$;

-- 3. Create strict RLS policies

-- GROUP A: Shared Production OS Data (CRUD for active users)

CREATE POLICY "Active users can manage projects" ON public.projects
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage production_environments" ON public.production_environments
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage episodes" ON public.episodes
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage scenes" ON public.scenes
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage production_tasks" ON public.production_tasks
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage scene_notes" ON public.scene_notes
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage asset_categories" ON public.asset_categories
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage assets" ON public.assets
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage asset_assignments" ON public.asset_assignments
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage asset_project_links" ON public.asset_project_links
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage asset_environment_links" ON public.asset_environment_links
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage asset_job_links" ON public.asset_job_links
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage asset_scene_links" ON public.asset_scene_links
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

-- GROUP B: Profiles
-- Only SELECT for active users. No direct INSERT/DELETE. Users can update own if active.
CREATE POLICY "Active users can read profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_active_user());

CREATE POLICY "Active users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id AND public.is_active_user())
  WITH CHECK (auth.uid() = id AND public.is_active_user());

-- GROUP C: Google Drive Secrets (storage_connections)
-- No direct client access. Must use privileged server routes.
-- Policies are dropped above, so default-deny applies.

-- GROUP D: Google Drive Metadata (asset_files, asset_storage_locations)
-- Active users can SELECT. Client writes denied.
CREATE POLICY "Active users can read asset_files" ON public.asset_files
  FOR SELECT TO authenticated
  USING (public.is_active_user());

CREATE POLICY "Active users can read asset_storage_locations" ON public.asset_storage_locations
  FOR SELECT TO authenticated
  USING (public.is_active_user());

-- 4. Revoke unnecessary grants from anon
REVOKE ALL ON public.projects FROM anon;
REVOKE ALL ON public.production_environments FROM anon;
REVOKE ALL ON public.episodes FROM anon;
REVOKE ALL ON public.scenes FROM anon;
REVOKE ALL ON public.production_tasks FROM anon;
REVOKE ALL ON public.scene_notes FROM anon;
REVOKE ALL ON public.asset_categories FROM anon;
REVOKE ALL ON public.assets FROM anon;
REVOKE ALL ON public.asset_files FROM anon;
REVOKE ALL ON public.asset_assignments FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.asset_project_links FROM anon;
REVOKE ALL ON public.asset_environment_links FROM anon;
REVOKE ALL ON public.asset_job_links FROM anon;
REVOKE ALL ON public.asset_scene_links FROM anon;
REVOKE ALL ON public.asset_storage_locations FROM anon;
REVOKE ALL ON public.storage_connections FROM anon;
