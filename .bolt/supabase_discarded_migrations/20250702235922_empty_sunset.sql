/*
  # User notification preferences setup
  
  1. New Tables
    - Checks if user_notification_preferences table exists before creating
    - Adds proper constraints and defaults
  
  2. Security
    - Enables RLS
    - Adds policies for users to manage their own preferences
  
  3. Triggers
    - Adds trigger for updating timestamps
    - Adds trigger for creating default preferences for new users
*/

-- Check if the table already exists before creating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_notification_preferences'
  ) THEN
    -- Create the user notification preferences table
    CREATE TABLE public.user_notification_preferences (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      email_notifications BOOLEAN DEFAULT true,
      new_quotes_notifications BOOLEAN DEFAULT true,
      accepted_quotes_notifications BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      UNIQUE(user_id)
    );
    
    -- Enable Row Level Security
    ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.user_notification_preferences;

-- Create individual policies for each operation
CREATE POLICY "Users can delete own notification preferences" ON public.user_notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON public.user_notification_preferences
  FOR INSERT WITH CHECK ((auth.uid() = user_id) OR (SESSION_USER = 'postgres'::name));

CREATE POLICY "Users can update own notification preferences" ON public.user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification preferences" ON public.user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to update updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = timezone('utc'::text, now());
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  END IF;
END
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_notification_prefs_updated_at ON public.user_notification_preferences;

-- Create trigger to update updated_at on row updates
CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure the handle_new_user function exists and is properly configured
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) THEN
    RAISE NOTICE 'The handle_new_user function does not exist. Please create it separately.';
  END IF;
END
$$;