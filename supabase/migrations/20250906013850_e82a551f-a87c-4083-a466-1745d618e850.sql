-- Enable the vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create secrets table
CREATE TABLE public.secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secret_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small produces 1536 dimensions
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL -- Allow anonymous secrets
);

-- Enable RLS on secrets
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- Create policies for secrets
CREATE POLICY "Anyone can view secrets (for similarity search)" 
ON public.secrets 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert secrets" 
ON public.secrets 
FOR INSERT 
WITH CHECK (true); -- Allow both authenticated and anonymous submissions

-- Create matches table for connecting users
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret1_id UUID NOT NULL REFERENCES public.secrets(id) ON DELETE CASCADE,
  secret2_id UUID NOT NULL REFERENCES public.secrets(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id, secret1_id, secret2_id)
);

-- Enable RLS on matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policies for matches
CREATE POLICY "Users can view their own matches" 
ON public.matches 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create matches" 
ON public.matches 
FOR INSERT 
WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update their matches" 
ON public.matches 
FOR UPDATE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles timestamps
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create index for similarity search
CREATE INDEX ON public.secrets USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);