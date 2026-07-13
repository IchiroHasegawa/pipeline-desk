-- Phase 4B: Allow cascading deletion of projects

DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.production_environments'::regclass
      AND contype = 'f'
      AND confrelid = 'public.projects'::regclass;

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.production_environments DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE public.production_environments
  ADD CONSTRAINT production_environments_project_id_fkey
  FOREIGN KEY (project_id)
  REFERENCES public.projects(id)
  ON DELETE CASCADE;
