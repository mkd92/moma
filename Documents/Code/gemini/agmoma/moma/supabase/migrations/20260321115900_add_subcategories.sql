-- Enhance Categories with Hierarchical Subcategories

ALTER TABLE public.categories 
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- Note: Policies naturally inherit since RLS applies to the entire table
