# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run lint      # ESLint
```

No test suite is configured.

## Environment

Requires a `.env` file with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

**MOMA** is a personal finance tracker — a single-page React app (no router) backed by Supabase.

### View-based navigation

The entire app lives in `src/App.jsx`. Navigation is managed via a `view` state string (`'landing'`, `'auth'`, `'dashboard'`, `'ledger'`, `'new_transaction'`, `'settings'`, `'category_management'`, `'party_management'`). Each view is an `if (view === '...')` block that returns JSX directly from `App()`.

`FloatingNav` is a stable component defined outside `App` to avoid closure bugs and unnecessary re-renders.

### State

All state is in `App`. There is no context, no Redux, no external state manager. `useMemo` and `useCallback` are used throughout to avoid recreating values on every render.

### Supabase schema

Tables (all with RLS enforced):
- `transactions` — core ledger rows; has `user_id`, `category_id` (FK → categories), `party_id` (FK → parties), `amount`, `type` (income/expense), `note`, `transaction_date`
- `categories` — hierarchical (parent/child via `parent_id`); `is_system = true` rows (user_id = null) are shared across all users; user-created categories have `is_system = false`
- `parties` — counterparties (payees/payers) per user
- `profiles` — stores `currency_preference` per user
- `subscriptions`, `budgets` — schema exists in migrations but not yet implemented in the UI

Transactions are fetched with a join: `.select('*, categories(name, icon, type), parties(name)')`.

### Supabase local dev

```bash
supabase start          # Start local Supabase stack
supabase db reset       # Reset DB and apply all migrations + seed.sql
supabase migration new  # Create a new migration file
```

Migrations are in `supabase/migrations/`. `supabase/seed.sql` inserts system-level default categories.
