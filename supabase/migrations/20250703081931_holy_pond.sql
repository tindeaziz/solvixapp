/*
  # Création du système de quotas en base de données

  1. New Tables
    - `user_quotas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `monthly_quotes_used` (integer)
      - `monthly_quotes_limit` (integer)
      - `last_reset_month` (integer)
      - `last_reset_year` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `user_quotas` table
    - Add policies for users to read/update their own quotas
    - Add policy for service role to manage all quotas
  
  3. Functions
    - `initialize_user_quota` - Creates quota entry for new users
    - `reset_user_quota_if_new_month` - Resets quota if month changed
    - `increment_user_quota` - Increments quota and checks limits
  
  4. Triggers
    - Trigger on new user creation
    - Trigger on devis creation to increment quota
    - Trigger to update updated_at timestamp
*/

-- Create user_quotas table
CREATE TABLE IF NOT EXISTS public.user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_quotes_used INTEGER NOT NULL DEFAULT 0,
  monthly_quotes_limit INTEGER NOT NULL DEFAULT 3,
  last_reset_month INTEGER NOT NULL,
  last_reset_year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own quotas" 
  ON public.user_quotas FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotas" 
  ON public.user_quotas FOR UPDATE 
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can manage all quotas" 
  ON public.user_quotas 
  USING (auth.role() = 'service_role');

-- Function to initialize user quota on signup
CREATE OR REPLACE FUNCTION public.initialize_user_quota()
RETURNS TRIGGER AS $$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
BEGIN
  -- Get current month and year
  current_month := EXTRACT(MONTH FROM NOW());
  current_year := EXTRACT(YEAR FROM NOW());
  
  -- Insert new quota record
  INSERT INTO public.user_quotas (
    user_id, 
    monthly_quotes_used, 
    monthly_quotes_limit,
    last_reset_month, 
    last_reset_year
  ) VALUES (
    NEW.id, 
    0, 
    3,
    current_month, 
    current_year
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize quota on user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_quota();

-- Function to check and reset quota if new month
CREATE OR REPLACE FUNCTION public.reset_user_quota_if_new_month(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  user_quota RECORD;
BEGIN
  -- Get current month and year
  current_month := EXTRACT(MONTH FROM NOW());
  current_year := EXTRACT(YEAR FROM NOW());
  
  -- Get user's quota
  SELECT * INTO user_quota FROM public.user_quotas WHERE user_id = user_uuid;
  
  -- If no quota found, create one
  IF user_quota IS NULL THEN
    INSERT INTO public.user_quotas (
      user_id, 
      monthly_quotes_used, 
      monthly_quotes_limit,
      last_reset_month, 
      last_reset_year
    ) VALUES (
      user_uuid, 
      0, 
      3,
      current_month, 
      current_year
    );
    RETURN TRUE;
  END IF;
  
  -- Check if month or year has changed
  IF user_quota.last_reset_month != current_month OR user_quota.last_reset_year != current_year THEN
    -- Reset quota for new month
    UPDATE public.user_quotas 
    SET 
      monthly_quotes_used = 0,
      last_reset_month = current_month,
      last_reset_year = current_year,
      updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment user quota
CREATE OR REPLACE FUNCTION public.increment_user_quota(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_quota RECORD;
  is_premium BOOLEAN;
  quota_reset BOOLEAN;
BEGIN
  -- Check if user has premium
  SELECT EXISTS (
    SELECT 1 FROM public.premium_activation_codes
    WHERE user_id = user_uuid
    AND status = 'USED'
  ) INTO is_premium;
  
  -- If premium, no need to check quota
  IF is_premium THEN
    RETURN TRUE;
  END IF;
  
  -- Check if we need to reset quota for new month
  quota_reset := public.reset_user_quota_if_new_month(user_uuid);
  
  -- Get user's quota after potential reset
  SELECT * INTO user_quota FROM public.user_quotas WHERE user_id = user_uuid;
  
  -- If user has reached quota limit
  IF user_quota.monthly_quotes_used >= user_quota.monthly_quotes_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment quota
  UPDATE public.user_quotas 
  SET 
    monthly_quotes_used = monthly_quotes_used + 1,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create quote
CREATE OR REPLACE FUNCTION public.can_create_quote(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_quota RECORD;
  is_premium BOOLEAN;
  quota_reset BOOLEAN;
BEGIN
  -- Check if user has premium
  SELECT EXISTS (
    SELECT 1 FROM public.premium_activation_codes
    WHERE user_id = user_uuid
    AND status = 'USED'
  ) INTO is_premium;
  
  -- If premium, always allow
  IF is_premium THEN
    RETURN TRUE;
  END IF;
  
  -- Check if we need to reset quota for new month
  quota_reset := public.reset_user_quota_if_new_month(user_uuid);
  
  -- Get user's quota after potential reset
  SELECT * INTO user_quota FROM public.user_quotas WHERE user_id = user_uuid;
  
  -- Check if user has reached quota limit
  RETURN user_quota.monthly_quotes_used < user_quota.monthly_quotes_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_quotas_updated_at
  BEFORE UPDATE ON public.user_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_user_quotas_updated_at();

-- Trigger to increment quota on devis creation
CREATE OR REPLACE FUNCTION increment_quota_on_devis_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the increment_user_quota function
  PERFORM public.increment_user_quota(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_devis_created
  AFTER INSERT ON public.devis
  FOR EACH ROW
  EXECUTE FUNCTION increment_quota_on_devis_creation();

-- Create function to get user quota info
CREATE OR REPLACE FUNCTION public.get_user_quota_info()
RETURNS JSON AS $$
DECLARE
  user_uuid UUID;
  user_quota RECORD;
  is_premium BOOLEAN;
  quota_reset BOOLEAN;
  result JSON;
BEGIN
  -- Get current user ID
  user_uuid := auth.uid();
  
  -- If no user, return error
  IF user_uuid IS NULL THEN
    RETURN json_build_object(
      'error', 'Not authenticated',
      'used', 0,
      'remaining', 0,
      'total', 0,
      'canCreateQuote', false
    );
  END IF;
  
  -- Check if user has premium
  SELECT EXISTS (
    SELECT 1 FROM public.premium_activation_codes
    WHERE user_id = user_uuid
    AND status = 'USED'
  ) INTO is_premium;
  
  -- If premium, return unlimited quota
  IF is_premium THEN
    RETURN json_build_object(
      'used', 0,
      'remaining', 999999,
      'total', 999999,
      'canCreateQuote', true,
      'isPremium', true
    );
  END IF;
  
  -- Check if we need to reset quota for new month
  quota_reset := public.reset_user_quota_if_new_month(user_uuid);
  
  -- Get user's quota after potential reset
  SELECT * INTO user_quota FROM public.user_quotas WHERE user_id = user_uuid;
  
  -- Build result JSON
  result := json_build_object(
    'used', user_quota.monthly_quotes_used,
    'remaining', user_quota.monthly_quotes_limit - user_quota.monthly_quotes_used,
    'total', user_quota.monthly_quotes_limit,
    'canCreateQuote', user_quota.monthly_quotes_used < user_quota.monthly_quotes_limit,
    'isPremium', false
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;