-- Update SELECT RLS policy on secrets table to allow users to see their owned secrets
-- This replaces the overly restrictive policy that only showed user_id matching secrets

DROP POLICY IF EXISTS "Users can view their own secrets" ON public.secrets;

CREATE POLICY "Users can view their own secrets" 
ON public.secrets 
FOR SELECT 
USING (
  -- Allow if user owns the secret
  (auth.uid() = user_id)
);