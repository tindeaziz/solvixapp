/*
  # Fix user registration and notification preferences

  1. RLS Policies
     - Fix RLS policies for profiles table
     - Fix RLS policies for notification preferences table
  
  2. User Registration
     - Create a simplified handle_new_user function
     - Ensure proper trigger setup
  
  3. Permissions
     - Grant necessary permissions to supabase_auth_admin role
*/

-- 1. Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id OR session_user = 'postgres');

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR session_user = 'postgres');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id OR session_user = 'postgres');

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id OR session_user = 'postgres');

-- 2. Fix RLS policies for notification preferences table
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can view own notification preferences" ON user_notification_preferences;

-- Create individual policies for each operation
CREATE POLICY "Users can delete own notification preferences" ON user_notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON user_notification_preferences
  FOR INSERT WITH CHECK ((auth.uid() = user_id) OR (SESSION_USER = 'postgres'::name));

CREATE POLICY "Users can update own notification preferences" ON user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification preferences" ON user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Create a simplified handle_new_user function
-- Note: We're using DO blocks to avoid the DECLARE syntax error
DO $$ 
BEGIN
  -- Drop the existing function if it exists
  DROP FUNCTION IF EXISTS public.handle_new_user();
  
  -- Create a new simplified function
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $func$
  BEGIN
    -- Create profile
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
      COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'full_name', 'Mon Entreprise'),
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'company_phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'company_address', ''),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Create notification preferences
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
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
  END;
  $func$;
END $$;

-- 4. Verify the trigger function is properly set up
DO $$
BEGIN
  -- Drop the existing trigger if it exists
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Create the trigger
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
END $$;

-- 5. Grant necessary permissions to supabase_auth_admin role
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;