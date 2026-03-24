# Inter-Account Transfer Feature Plan

## Objective
Implement an inter-account transfer feature that allows users to move funds between their existing accounts seamlessly. Transfers will be recorded as two linked transactions (an expense from the source account and an income to the destination account) to keep ledger balances accurate.

## Key Files & Context
- `supabase/migrations/<timestamp>_add_transfer_id_to_transactions.sql` (New)
- `src/App.jsx`

## Implementation Steps

### 1. Database Schema Update
- Create a new Supabase migration to add a `transfer_id` column to the `transactions` table.
  ```sql
  ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transfer_id UUID;
  ```
- This `transfer_id` will act as a grouping key for the two transactions that make up a transfer, allowing them to be updated or deleted together.

### 2. UI Updates (Transaction Form)
- **Mode Toggle:** Update the transaction form's mode toggle to include a third option: "Transfer" (`Expense | Income | Transfer`).
- **Account Selection:** When "Transfer" is selected, replace the standard "Account" dropdown with two distinct dropdowns: "From Account" and "To Account".
- **Category:** Hide the "Category" dropdown for transfers, or automatically assign it to a "Transfer" state to simplify the user experience.

### 3. Application Logic (`handleTransaction` in `App.jsx`)
- **Creation:** When submitting a transfer, generate a unique `transfer_id` (e.g., using `crypto.randomUUID()`).
- Construct two transaction objects:
  1. `type: 'expense'`, `account_id: fromAccount`, `transfer_id: <uuid>`
  2. `type: 'income'`, `account_id: toAccount`, `transfer_id: <uuid>`
- Execute a single Supabase `.insert([tx1, tx2])` call to write both legs of the transfer simultaneously.
- **Editing:** When a user taps a transfer transaction in the ledger, fetch the corresponding pair using the `transfer_id`, populate the "From" and "To" fields, and update both records upon saving.
- **Deletion:** Update the delete logic to delete all transactions matching the `transfer_id` when removing a transfer.

### 4. Ledger Display Update
- Update the ledger view to recognize transactions with a `transfer_id`. 
- Group them visually or display a custom format (e.g., "Transfer: Axis Bank → IOB Saving") with a specific icon (🔄) instead of a generic expense/income label.

## Verification & Testing
- Create a new transfer between two accounts and verify both account balances update correctly.
- Check the ledger to ensure the transfer renders correctly.
- Edit an existing transfer (change amount or accounts) and verify both underlying transactions are updated.
- Delete a transfer and confirm both transactions are successfully removed from the database.
