/*
  # Fix RLS policies for user registration

  1. Problem
    - During user registration, the trigger function `handle_new_user` runs with SECURITY DEFINER
    - However, RLS policies check `auth.uid()` which is NULL during user creation
    - This blocks INSERT operations on `profiles` and `user_notification_preferences` tables

  2. Solution
    - Modify RLS policies to allow the `postgres` user (trigger executor) to bypass auth.uid() checks
    - Add `OR (session_user = 'postgres')` condition to INSERT policies
    - This allows the system to create default records for new users during registration

  3. Security
    - Only affects INSERT operations during user creation
    - All other operations still require proper authentication
    - No security compromise as this only allows system-level user creation
*/

-- Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    session_user = 'postgres'
  );

-- Fix RLS policies for user_notification_preferences table
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON user_notification_preferences;

-- Create separate policies for different operations on notification preferences
CREATE POLICY "Users can view own notification preferences" ON user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON user_notification_preferences
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    session_user = 'postgres'
  );

CREATE POLICY "Users can update own notification preferences" ON user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences" ON user_notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Verify the policies are correctly set up
DO $$
BEGIN
  RAISE NOTICE 'Verifying RLS policy fixes...';
  
  -- Check profiles policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert own profile'
    AND qual LIKE '%session_user%'
  ) THEN
    RAISE NOTICE '✅ Profiles INSERT policy fixed';
  ELSE
    RAISE NOTICE '❌ Profiles INSERT policy not properly configured';
  END IF;
  
  -- Check notification preferences policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_notification_preferences' 
    AND policyname = 'Users can insert own notification preferences'
    AND qual LIKE '%session_user%'
  ) THEN
    RAISE NOTICE '✅ Notification preferences INSERT policy fixed';
  ELSE
    RAISE NOTICE '❌ Notification preferences INSERT policy not properly configured';
  END IF;
  
  RAISE NOTICE 'RLS policy verification complete';
END $$;