-- Add UPDATE RLS policy to allow users to claim anonymous secrets or update their own
CREATE POLICY "Users can update their own secrets or claim anonymous ones" 
ON public.secrets 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (user_id IS NULL))
WITH CHECK (auth.uid() = user_id);