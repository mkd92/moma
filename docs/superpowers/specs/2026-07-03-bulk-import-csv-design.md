# CSV Import for Bulk Entry — Design

Date: 2026-07-03

## Problem

Bulk Entry (`src/views/BulkImport.jsx`) only supports manually typing rows into a
spreadsheet-style grid. Users with a bank/card CSV export have to retype every
transaction by hand. This design adds a CSV import path that feeds parsed rows
into the existing grid, reusing its review/edit/commit machinery.

## Scope

**In scope:**
- "Import CSV" button in the Bulk Entry table footer, next to "Add row"
- Modal flow: Upload → (combined) Map columns + live preview → Import
- Manual column mapping: Date, Note/Description, Debit, Credit — each mapped to
  a header detected in the uploaded file
- Date format auto-detected from sample values, with a manual override dropdown
- Imported rows are appended to the existing Bulk Entry grid as ordinary staged
  rows (`type: expense` or `income` only — CSV import never produces `transfer`
  rows, since a single-account statement carries no "to account")
- Duplicate detection against already-loaded transactions (same date + amount +
  normalized note), surfaced as a new row status in the grid
- Auto-categorization: pre-fill `category_id` by matching the imported note
  (trimmed, case-insensitive) against past transaction notes; on no exact
  match, leave the category blank for manual assignment
- Last-used column mapping remembered per CSV header-shape (localStorage),
  pre-filled next time a similarly-shaped file is uploaded

**Explicitly out of scope:**
- Excel (.xlsx) or PDF import — CSV only
- Streaming/chunked parsing for very large files — parsed in-browser in one pass
- Import history / "undo this specific import" tracking — once committed,
  imported transactions are indistinguishable from manually entered ones
- Partial/substring note matching for duplicate detection or category
  suggestion — both use exact normalized-note matching only, to avoid false
  positives (e.g. "AMAZON" matching unrelated purchases)
- Auto-categorization or duplicate detection for manually-typed rows — this
  only runs on rows produced by CSV import

## User flow

1. **Trigger**: "Import CSV" button in the Bulk Entry table footer opens
   `ImportCsvModal`.
2. **Upload step**: File picker, accepts `.csv`. Parsed with `papaparse`
   (new dependency) for robust quoted-field/comma handling. First row is
   treated as the header row.
3. **Map + Preview step** (combined, single screen): Four dropdowns populated
   with the file's detected header names — *Date column*, *Note/Description
   column*, *Debit column*, *Credit column* — plus a date-format dropdown
   (auto-guessed, editable, e.g. `DD/MM/YYYY`). A live preview table below
   updates immediately as mappings change, showing parsed date/note/amount/type
   plus **Duplicate** and **Suggested category** flags per row. A summary line
   reads e.g. "142 rows parsed, 3 skipped (bad date/empty amount), 8 possible
   duplicates." Skipped rows are listed with their reason.

   If a saved mapping exists for a file with this same header shape (matched
   by a signature of sorted header names), all fields pre-fill from it.
4. **Import step**: Confirm button appends all non-skipped rows to the Bulk
   Entry grid and closes the modal. Imported rows behave exactly like
   manually-typed rows from that point on — same status pipeline, same
   category picker, same single commit.

## Data model changes

`makeRow()` (in `BulkImport.jsx`) gains two fields, defaulted for manual rows
so existing behavior is unaffected:

```js
{
  ...existing fields,
  isDuplicate: false,   // true if matched an existing transaction on date+amount+note
  forceInclude: false,  // true once user clicks "Keep anyway" on a flagged duplicate
}
```

`getRowStatus()` gains a `'duplicate'` outcome, checked after the existing
empty/error checks:

```js
if (row.isDuplicate && !row.forceInclude) return 'duplicate';
```

A `'duplicate'` row is excluded from the commit batch (same as `'error'`)
until the user deletes it or force-includes it. `StatusBadge` gains a
"Duplicate" variant. The stats bar folds the duplicate count into "Need
Attention" rather than adding a new tile.

`category_id` is pre-filled by the auto-categorize match but remains fully
editable via the existing `CellCategoryPicker` — it's a suggestion, not a lock.

## Column mapping & date parsing

- CSV is parsed once on upload (`papaparse`, header row = first line).
- Date format guess: try common formats (`YYYY-MM-DD`, `DD/MM/YYYY`,
  `MM/DD/YYYY`, `DD-MM-YYYY`, `MM-DD-YYYY`) against a sample of values from the
  mapped date column; if any sampled day-position value is >12, that
  disambiguates DD vs MM ordering. Falls back to `YYYY-MM-DD` if ambiguous.
  User can override via a dropdown; the preview table re-parses live against
  the selected format.
- Debit/Credit columns: each row's amount and type are derived from whichever
  of the two mapped columns is populated (debit → `expense`, credit →
  `income`). Rows with both empty are skipped as unparseable.
- Mapping persistence: `localStorage['moma_csv_mapping_<header-signature>']`
  stores the last mapping (column choices + date format) keyed by a signature
  built from the sorted, normalized header names of the uploaded file.

## Duplicate detection

For each parsed row, compare against `transactions` already loaded in
`useAppDataContext()`: a match requires the same `transaction_date`, the same
absolute `amount`, and the same normalized (trimmed, case-insensitive) note.
On match, `isDuplicate: true`.

## Auto-categorization

For each parsed row, search `transactions` for the most recent transaction
whose normalized note exactly matches the imported note. If found, pre-fill
`category_id` with that transaction's category. If no exact match exists,
`category_id` stays `null` (current default behavior).

## New files

- `src/utils/csvImport.js` — pure helper functions: CSV parsing wrapper,
  date-format guessing/parsing, row-building from a column mapping, duplicate
  detection, category-suggestion matching, localStorage mapping save/load.
- `src/components/transactions/ImportCsvModal.jsx` — the upload → map/preview
  → confirm modal. Receives `accounts`, `categories`, `transactions` as props
  (already available in `BulkImport.jsx` via `useAppDataContext()`) and calls
  back with the finished row array for `BulkImport.jsx` to append to its
  `rows` state.

## Error handling

- Unparseable file (not valid CSV) → toast error, stay on upload step.
- Per-row issues (unparseable date, both debit/credit columns empty) → row is
  excluded from import and counted/listed with its reason in the preview
  summary; never silently dropped without a visible count.

## New dependency

`papaparse` — CSV parsing with correct handling of quoted fields, embedded
commas, and header rows.
