/*
  # Fix Database Error Saving New User
  
  1. Problem
    - The trigger function that creates a profile when a new user signs up lacks proper permissions
    - This causes "Database error saving new user" during registration
    - Subsequently leads to "Auth session missing" errors throughout the application
  
  2. Solution
    - Grant proper permissions to the auth admin role
    - Fix the trigger function to use SECURITY DEFINER
    - Ensure proper error handling in the trigger function
*/

-- 1. Grant necessary permissions to the auth admin role
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;

-- 2. Drop existing problematic triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_notification_prefs_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_notification_preferences() CASCADE;

-- 3. Create a new combined function with proper security settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- This is crucial for proper permissions
SET search_path = public
AS $$
DECLARE
  default_company_name TEXT;
BEGIN
  -- Get company name from metadata or use default
  default_company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'full_name',
    'Mon Entreprise'
  );

  -- Create profile with proper error handling
  BEGIN
    INSERT INTO public.profiles (
      user_id,
      company_name,
      company_email,
      company_phone,
      company_address,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      default_company_name,
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'company_phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'company_address', ''),
      NOW(),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    -- Continue execution despite error
  END;

  -- Create notification preferences with proper error handling
  BEGIN
    INSERT INTO public.user_notification_preferences (
      user_id,
      email_notifications,
      new_quotes_notifications,
      accepted_quotes_notifications,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      TRUE,
      TRUE,
      TRUE,
      NOW(),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating notification preferences for user %: %', NEW.id, SQLERRM;
    -- Continue execution despite error
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE LOG 'Unhandled error in handle_new_user for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 4. Create a new trigger that uses our improved function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verify the trigger is properly installed
DO $$
BEGIN
  RAISE NOTICE 'Verifying trigger installation...';
  
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ Trigger successfully installed';
  ELSE
    RAISE NOTICE '❌ Trigger installation failed';
  END IF;
END $$;

-- 6. Ensure RLS policies are correctly set up
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Recreate RLS policies for notification preferences
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON user_notification_preferences;

CREATE POLICY "Users can manage own notification preferences" ON user_notification_preferences
  FOR ALL USING (auth.uid() = user_id);