CREATE TABLE public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tags" ON public.tags FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE UNIQUE INDEX tags_user_name_unique ON public.tags (user_id, lower(name));

CREATE TABLE public.transaction_tags (
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  tag_id         UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (transaction_id, tag_id)
);
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transaction_tags" ON public.transaction_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.tags WHERE tags.id = transaction_tags.tag_id AND tags.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tags WHERE tags.id = transaction_tags.tag_id AND tags.user_id = auth.uid()));
