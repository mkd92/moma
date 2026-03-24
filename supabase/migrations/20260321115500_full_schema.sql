-- Migration: Execute Full MOMA Architectural Schema

-- 1. Create Categories Lenses
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL means System Category
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT '💵',
  color_hex TEXT DEFAULT '#FFFFFF',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Users can view their own categories OR system categories (where user_id is null)
CREATE POLICY "Users can view system and own categories" 
ON public.categories FOR SELECT 
USING ( user_id = auth.uid() OR is_system = true );

CREATE POLICY "Users can manage own custom categories" 
ON public.categories FOR ALL 
USING ( user_id = auth.uid() AND is_system = false )
WITH CHECK ( user_id = auth.uid() AND is_system = false );

-- 2. Upgrade Current Transactions Table
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE;

-- 3. The Autopilot (Subscriptions / Recurring)
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense',
  interval TEXT NOT NULL CHECK (interval IN ('weekly', 'monthly', 'yearly')),
  next_billing_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" 
ON public.subscriptions FOR ALL 
USING ( user_id = auth.uid() )
WITH CHECK ( user_id = auth.uid() );

-- 4. The Ceiling (Budgets)
CREATE TABLE public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(10, 2) NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  UNIQUE(user_id, category_id, month_year)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own budgets" 
ON public.budgets FOR ALL 
USING ( user_id = auth.uid() )
WITH CHECK ( user_id = auth.uid() );
