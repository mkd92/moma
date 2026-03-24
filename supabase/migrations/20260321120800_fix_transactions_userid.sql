-- Fix: Add user_id to transactions and enable strict RLS

ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to fully manage only their own transactions
CREATE POLICY "Users manage own transactions" 
ON public.transactions FOR ALL 
USING ( user_id = auth.uid() )
WITH CHECK ( user_id = auth.uid() );
