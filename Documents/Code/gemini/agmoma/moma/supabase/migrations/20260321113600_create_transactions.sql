-- Migration: Create transactions table

CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Optional: Add Row Level Security (RLS) policies if users are added later
-- ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
