-- Add DELETE policy for secrets table to allow users to delete their own secrets
CREATE POLICY "Users can delete their own secrets" 
ON public.secrets 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);