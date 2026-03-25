-- Add type and exclude_from_total columns to accounts
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'asset' CHECK (type IN ('asset', 'liability', 'temp')),
  ADD COLUMN IF NOT EXISTS exclude_from_total BOOLEAN DEFAULT false;

-- Existing accounts are assets by default, included in total
UPDATE public.accounts SET type = 'asset', exclude_from_total = false WHERE type IS NULL;
