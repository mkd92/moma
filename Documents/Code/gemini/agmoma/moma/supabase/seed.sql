-- Insert MOMA System Default Categories
-- These are available to all users

INSERT INTO public.categories (name, type, icon, color_hex, is_system, user_id)
VALUES 
  ('Salary', 'income', '💰', '#00e676', true, null),
  ('Passive Income', 'income', '📈', '#69f0ae', true, null),
  ('Food & Dining', 'expense', '🍔', '#ff4b4b', true, null),
  ('Rent & Utilities', 'expense', '🏠', '#ff79c6', true, null),
  ('Entertainment', 'expense', '🎮', '#9d4edd', true, null),
  ('Transportation', 'expense', '🚗', '#00b0ff', true, null)
ON CONFLICT DO NOTHING;
