-- Migration A: Auth Profile Foundation
-- Modifies existing profiles table to remove email and ensure strict username rules

-- 1. Remove email column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- 2. Ensure account_status is strictly enforced if not already (it should be, but let's be safe)
-- In 013_profiles it was 'Active', but the prompt requires 'active' (lowercase)
-- Let's update existing statuses and alter the constraint

-- Drop old check constraint if it exists (assuming it was named profiles_account_status_check by default or implicitly)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;

-- Update existing records to lowercase
UPDATE public.profiles SET account_status = LOWER(account_status);

-- Set default to 'active'
ALTER TABLE public.profiles ALTER COLUMN account_status SET DEFAULT 'active';

-- Add strict check constraint for allowed lowercase values
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_status_check 
  CHECK (account_status IN ('active', 'suspended', 'disabled'));

-- 3. Replace the auth user trigger to NOT include email and default to active
-- Set explicitly safe search_path to public
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url, account_status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Ensure username format and uniqueness
-- (013_profiles already created lower(username) index and constraints, but we ensure they exist)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (LOWER(username));

-- (Optional) If username constraints were not named in 013, we ensure they are strict.
-- 013 had:
-- CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
-- CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
-- This is identical to the requirement: 3 to 30 characters, letters, numbers, underscore, no spaces.
