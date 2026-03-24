ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
