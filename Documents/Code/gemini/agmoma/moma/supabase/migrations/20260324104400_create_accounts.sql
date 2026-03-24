-- Migration: Create accounts table and link to transactions

-- 1. Create Accounts Table
CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initial_balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS Policies for Accounts
CREATE POLICY "Users manage own accounts" 
ON public.accounts FOR ALL 
USING ( user_id = auth.uid() )
WITH CHECK ( user_id = auth.uid() );

-- 3. Link Transactions to Accounts
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
