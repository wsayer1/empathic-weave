-- Remove the overly permissive policy that allows anyone to view all secrets
DROP POLICY IF EXISTS "Anyone can view secrets (for similarity search)" ON public.secrets;

-- Create a secure policy that only allows users to view their own secrets
CREATE POLICY "Users can view their own secrets" 
ON public.secrets 
FOR SELECT 
USING (auth.uid() = user_id);

-- For the similarity search functionality, we need a security definer function
-- that can access secrets with elevated privileges for matching purposes only
CREATE OR REPLACE FUNCTION public.find_similar_secrets(
  input_embedding vector,
  current_user_id uuid,
  similarity_threshold float DEFAULT 0.8,
  max_results int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  secret_text text,
  user_id uuid,
  similarity float
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.secret_text,
    s.user_id,
    1 - (s.embedding <=> input_embedding) as similarity
  FROM secrets s
  WHERE s.user_id != current_user_id 
    AND s.embedding IS NOT NULL
    AND 1 - (s.embedding <=> input_embedding) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT max_results;
$$;