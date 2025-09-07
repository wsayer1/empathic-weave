-- Drop the existing INSERT policy and recreate it properly
DROP POLICY IF EXISTS "Users can insert secrets" ON public.secrets;

-- Create a proper INSERT policy that allows both authenticated and anonymous users
CREATE POLICY "Users can insert secrets" 
ON public.secrets 
FOR INSERT 
WITH CHECK (
  -- Allow if user is anonymous (user_id is null)
  (user_id IS NULL) OR 
  -- Allow if user is authenticated and inserting their own secret
  (auth.uid() = user_id)
);