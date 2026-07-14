-- Migration 024: Owner Role
-- Adds system_role to profiles for Owner Access.

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS system_role text NOT NULL DEFAULT 'user'
  CHECK (system_role IN ('user', 'owner'));

-- Create a trigger to prevent clients from updating system_role
CREATE OR REPLACE FUNCTION public.prevent_system_role_update()
RETURNS trigger AS $$
BEGIN
  -- If updated by a normal authenticated or anonymous user via PostgREST,
  -- current_setting('role') will be 'authenticated' or 'anon'.
  -- If it's a superuser or service role, we allow the update.
  IF current_setting('role', true) IN ('authenticated', 'anon') THEN
    NEW.system_role = OLD.system_role;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_update_system_role ON public.profiles;
CREATE TRIGGER on_profile_update_system_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_system_role_update();

-- ==================================================
-- OWNER ASSIGNMENT INSTRUCTIONS
-- ==================================================
-- To assign an owner securely on the backend, execute the following SQL:
-- UPDATE public.profiles SET system_role = 'owner' WHERE id = '<verified owner auth user id>';
