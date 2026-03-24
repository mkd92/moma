ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transfer_id UUID;

CREATE INDEX IF NOT EXISTS transactions_transfer_id_idx ON public.transactions (transfer_id);
