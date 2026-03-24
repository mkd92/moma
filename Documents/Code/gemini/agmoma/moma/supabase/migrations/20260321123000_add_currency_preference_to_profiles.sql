-- Migration: Add currency_preference to profiles table for online/production

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS currency_preference TEXT DEFAULT 'USD';
