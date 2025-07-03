/*
  # Allow users to view available activation codes
  
  1. Security
    - Add a new RLS policy to allow authenticated users to view available and sold codes
    - This enables regular users to validate codes before activation
    - Fixes the issue where users couldn't activate codes because they couldn't see them
*/

-- Check if the policy already exists before creating it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'premium_activation_codes' 
    AND policyname = 'Allow authenticated users to view available and sold codes'
  ) THEN
    -- Allow authenticated users to view available and sold codes
    CREATE POLICY "Allow authenticated users to view available and sold codes" ON public.premium_activation_codes
      FOR SELECT TO authenticated
      USING (status IN ('AVAILABLE', 'SOLD'));
  END IF;
END $$;