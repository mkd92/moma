-- Fix: temp and liability accounts should be excluded from net worth by default.
-- The previous migration set exclude_from_total = false for ALL accounts.
-- This corrects that for non-asset account types.

UPDATE public.accounts
SET exclude_from_total = true
WHERE type IN ('temp', 'liability')
  AND (exclude_from_total IS NULL OR exclude_from_total = false);
