-- Migration: Add Parties Schema

CREATE TABLE public.parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own parties" 
ON public.parties FOR ALL 
USING ( user_id = auth.uid() ) 
WITH CHECK ( user_id = auth.uid() );

ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL;
