# CSV Import for Bulk Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users upload a bank/card CSV export, map its columns, and have the parsed rows land in the existing Bulk Entry grid — with duplicate detection and note-based auto-categorization — instead of typing every row by hand.

**Architecture:** A new pure-logic module (`src/utils/csvImport.js`) handles CSV parsing, date-format guessing, column-mapping persistence, duplicate detection, and category suggestion — fully unit-tested with Node's built-in test runner. A new `ImportCsvModal.jsx` component drives the Upload → Map+Preview → Import UI and calls back into `BulkImport.jsx`, which gains an "Import CSV" trigger and a new `'duplicate'` row status.

**Tech Stack:** React 19, Vite, `papaparse` (new dependency) for CSV parsing, Node's built-in `node:test` + `node:assert/strict` for unit tests (no test framework is configured in this repo — see Global Constraints).

## Global Constraints

- No test suite/framework is configured in this repo (per `CLAUDE.md`) — pure-logic tests use Node's built-in `node --test`, requiring no new dev dependency. UI components (`ImportCsvModal.jsx`, `BulkImport.jsx` changes) are verified manually via the dev server, not automated tests.
- CSV only — no Excel/PDF import (spec section "Scope").
- CSV import never produces `transfer`-type rows (spec section "User flow").
- Duplicate detection and category suggestion both use **exact normalized-note matching only** — no partial/substring matching (spec section "Scope" and "Duplicate detection"/"Auto-categorization").
- Auto-categorization and duplicate detection run only on CSV-imported rows, never on manually-typed grid rows (spec section "Scope").
- On no exact note match, `category_id` stays `null` — never guess (spec section "Auto-categorization").
- Column mapping is persisted in `localStorage`, keyed by a signature of the file's sorted header names (spec section "Column mapping & date parsing").
- Skipped/unparseable rows must always be counted and shown with a reason — never silently dropped (spec section "Error handling").

---

### Task 1: CSV parsing, header signature, and mapping persistence

**Files:**
- Modify: `package.json` (add `papaparse` dependency)
- Create: `src/utils/csvImport.js`
- Create: `src/utils/csvImport.test.js`

**Interfaces:**
- Produces: `parseCsvText(text: string) => { headers: string[], rows: string[][] }` — throws `Error` if the file has no rows
- Produces: `buildHeaderSignature(headers: string[]) => string`
- Produces: `saveMapping(signature: string, mapping: object, storage = globalThis.localStorage) => void`
- Produces: `loadMapping(signature: string, storage = globalThis.localStorage) => object | null`

- [ ] **Step 1: Install papaparse**

```bash
npm install papaparse
```

- [ ] **Step 2: Write the failing tests**

Create `src/utils/csvImport.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsvText, buildHeaderSignature, saveMapping, loadMapping } from './csvImport.js';

function makeFakeStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
  };
}

test('parseCsvText splits header and rows', () => {
  const csv = 'Date,Description,Debit,Credit\n2026-01-01,Coffee Shop,4.50,\n2026-01-02,Paycheck,,1500.00\n';
  const { headers, rows } = parseCsvText(csv);
  assert.deepEqual(headers, ['Date', 'Description', 'Debit', 'Credit']);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], ['2026-01-01', 'Coffee Shop', '4.50', '']);
});

test('parseCsvText handles quoted fields with embedded commas', () => {
  const csv = 'Date,Description,Amount\n2026-01-01,"Store, Inc.",10.00\n';
  const { rows } = parseCsvText(csv);
  assert.equal(rows[0][1], 'Store, Inc.');
});

test('parseCsvText throws on empty input', () => {
  assert.throws(() => parseCsvText(''), /Could not read any rows/);
});

test('buildHeaderSignature normalizes case, whitespace, and order', () => {
  const a = buildHeaderSignature(['Date', ' Description ', 'Debit']);
  const b = buildHeaderSignature(['debit', 'date', 'description']);
  assert.equal(a, b);
});

test('saveMapping and loadMapping round-trip through storage', () => {
  const storage = makeFakeStorage();
  const mapping = { dateCol: 'Date', noteCol: 'Description', debitCol: 'Debit', creditCol: 'Credit', dateFormat: 'YYYY-MM-DD' };
  const signature = buildHeaderSignature(['Date', 'Description', 'Debit', 'Credit']);
  saveMapping(signature, mapping, storage);
  assert.deepEqual(loadMapping(signature, storage), mapping);
});

test('loadMapping returns null when nothing saved', () => {
  const storage = makeFakeStorage();
  assert.equal(loadMapping('missing-signature', storage), null);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --test src/utils/csvImport.test.js`
Expected: FAIL — `src/utils/csvImport.js` does not exist yet (Cannot find module).

- [ ] **Step 4: Implement csvImport.js**

Create `src/utils/csvImport.js`:

```js
import Papa from 'papaparse';

const MAPPING_KEY_PREFIX = 'moma_csv_mapping_';

export function parseCsvText(text) {
  const result = Papa.parse(String(text).trim(), { skipEmptyLines: true });
  if (!result.data || result.data.length === 0) {
    throw new Error('Could not read any rows from this file.');
  }
  const [headerRow, ...dataRows] = result.data;
  const headers = headerRow.map(h => String(h).trim());
  return { headers, rows: dataRows };
}

export function buildHeaderSignature(headers) {
  return headers.map(h => h.trim().toLowerCase()).sort().join('|');
}

export function saveMapping(signature, mapping, storage = globalThis.localStorage) {
  if (!storage) return;
  storage.setItem(MAPPING_KEY_PREFIX + signature, JSON.stringify(mapping));
}

export function loadMapping(signature, storage = globalThis.localStorage) {
  if (!storage) return null;
  const raw = storage.getItem(MAPPING_KEY_PREFIX + signature);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test src/utils/csvImport.test.js`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/utils/csvImport.js src/utils/csvImport.test.js
git commit -m "feat: add CSV parsing and mapping persistence for bulk import"
```

---

### Task 2: Date-format guessing, date parsing, and column-mapping guessing

**Files:**
- Modify: `src/utils/csvImport.js`
- Modify: `src/utils/csvImport.test.js`

**Interfaces:**
- Consumes: nothing from Task 1 (pure additions)
- Produces: `parseDateWithFormat(value: string, format: string) => string | null` (returns `'YYYY-MM-DD'` or `null`)
- Produces: `guessDateFormat(sampleValues: string[]) => string` (one of `'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD-MM-YYYY' | 'MM-DD-YYYY'`)
- Produces: `normalizeNote(note: string | null | undefined) => string`
- Produces: `guessColumnMapping(headers: string[]) => { dateCol: string, noteCol: string, debitCol: string, creditCol: string }`

- [ ] **Step 1: Write the failing tests**

Append to `src/utils/csvImport.test.js` (update the top import line to include the new names):

```js
import { parseCsvText, buildHeaderSignature, saveMapping, loadMapping, parseDateWithFormat, guessDateFormat, normalizeNote, guessColumnMapping } from './csvImport.js';
```

Add these test blocks at the end of the file:

```js
test('parseDateWithFormat parses ISO dates', () => {
  assert.equal(parseDateWithFormat('2026-03-05', 'YYYY-MM-DD'), '2026-03-05');
});

test('parseDateWithFormat parses day-first dates', () => {
  assert.equal(parseDateWithFormat('05/03/2026', 'DD/MM/YYYY'), '2026-03-05');
});

test('parseDateWithFormat parses month-first dates', () => {
  assert.equal(parseDateWithFormat('03/05/2026', 'MM/DD/YYYY'), '2026-03-05');
});

test('parseDateWithFormat returns null for invalid dates', () => {
  assert.equal(parseDateWithFormat('not-a-date', 'YYYY-MM-DD'), null);
  assert.equal(parseDateWithFormat('13/40/2026', 'DD/MM/YYYY'), null);
});

test('guessDateFormat detects ISO format', () => {
  assert.equal(guessDateFormat(['2026-01-01', '2026-01-15']), 'YYYY-MM-DD');
});

test('guessDateFormat detects day-first when a day value exceeds 12', () => {
  assert.equal(guessDateFormat(['25/01/2026', '03/02/2026']), 'DD/MM/YYYY');
});

test('guessDateFormat detects month-first when the second value exceeds 12', () => {
  assert.equal(guessDateFormat(['02/25/2026', '03/01/2026']), 'MM/DD/YYYY');
});

test('normalizeNote trims and lowercases', () => {
  assert.equal(normalizeNote('  Coffee Shop  '), 'coffee shop');
  assert.equal(normalizeNote(null), '');
});

test('guessColumnMapping finds columns by common header names', () => {
  const mapping = guessColumnMapping(['Transaction Date', 'Description', 'Debit Amount', 'Credit Amount']);
  assert.equal(mapping.dateCol, 'Transaction Date');
  assert.equal(mapping.noteCol, 'Description');
  assert.equal(mapping.debitCol, 'Debit Amount');
  assert.equal(mapping.creditCol, 'Credit Amount');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test src/utils/csvImport.test.js`
Expected: FAIL — new imports (`parseDateWithFormat` etc.) are `undefined`.

- [ ] **Step 3: Implement the new functions**

Append to `src/utils/csvImport.js`:

```js
function splitDateParts(value, sep) {
  const parts = String(value).trim().split(sep);
  if (parts.length !== 3) return null;
  const nums = parts.map(p => parseInt(p, 10));
  if (nums.some(n => Number.isNaN(n))) return null;
  return nums;
}

export function parseDateWithFormat(value, format) {
  if (!value) return null;
  const sep = format.includes('/') ? '/' : '-';
  const parts = splitDateParts(value, sep);
  if (!parts) return null;
  let year, month, day;
  if (format === 'YYYY-MM-DD') {
    [year, month, day] = parts;
  } else if (format === 'DD/MM/YYYY' || format === 'DD-MM-YYYY') {
    [day, month, year] = parts;
  } else if (format === 'MM/DD/YYYY' || format === 'MM-DD-YYYY') {
    [month, day, year] = parts;
  } else {
    return null;
  }
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const pad = n => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function guessDateFormat(sampleValues) {
  const values = sampleValues.filter(Boolean);
  if (values.length === 0) return 'YYYY-MM-DD';
  if (values.every(v => /^\d{4}-\d{2}-\d{2}$/.test(String(v).trim()))) return 'YYYY-MM-DD';
  const sep = String(values[0]).includes('/') ? '/' : '-';
  const candidates = sep === '/' ? ['DD/MM/YYYY', 'MM/DD/YYYY'] : ['DD-MM-YYYY', 'MM-DD-YYYY'];
  for (const v of values) {
    const parts = splitDateParts(v, sep);
    if (!parts) continue;
    const [a, b] = parts;
    if (a > 12) return candidates[0];
    if (b > 12) return candidates[1];
  }
  return candidates[0];
}

export function normalizeNote(note) {
  return String(note || '').trim().toLowerCase();
}

export function guessColumnMapping(headers) {
  const find = (patterns) => headers.find(h => patterns.some(p => p.test(h))) || '';
  return {
    dateCol: find([/date/i]),
    noteCol: find([/desc/i, /narrat/i, /note/i, /payee/i, /particular/i]),
    debitCol: find([/debit/i, /withdrawal/i, /paid.?out/i]),
    creditCol: find([/credit/i, /deposit/i, /paid.?in/i]),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test src/utils/csvImport.test.js`
Expected: PASS (15 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/csvImport.js src/utils/csvImport.test.js
git commit -m "feat: add date-format guessing and column-mapping heuristics"
```

---

### Task 3: Build rows from a column mapping

**Files:**
- Modify: `src/utils/csvImport.js`
- Modify: `src/utils/csvImport.test.js`

**Interfaces:**
- Consumes: `parseDateWithFormat` (Task 2)
- Produces: `buildRowsFromMapping({ headers: string[], rows: string[][], mapping: { dateCol, noteCol, debitCol, creditCol, dateFormat } }) => { parsedRows: { date: string, note: string, amount: number, type: 'expense'|'income' }[], skipped: { raw: string[], reason: string }[] }`

- [ ] **Step 1: Write the failing tests**

Update the top import line in `src/utils/csvImport.test.js` to add `buildRowsFromMapping`:

```js
import { parseCsvText, buildHeaderSignature, saveMapping, loadMapping, parseDateWithFormat, guessDateFormat, normalizeNote, guessColumnMapping, buildRowsFromMapping } from './csvImport.js';
```

Add these test blocks at the end of the file:

```js
test('buildRowsFromMapping derives expense from the debit column', () => {
  const headers = ['Date', 'Description', 'Debit', 'Credit'];
  const rows = [['2026-01-01', 'Coffee Shop', '4.50', '']];
  const mapping = { dateCol: 'Date', noteCol: 'Description', debitCol: 'Debit', creditCol: 'Credit', dateFormat: 'YYYY-MM-DD' };
  const { parsedRows, skipped } = buildRowsFromMapping({ headers, rows, mapping });
  assert.equal(skipped.length, 0);
  assert.deepEqual(parsedRows, [{ date: '2026-01-01', note: 'Coffee Shop', amount: 4.5, type: 'expense' }]);
});

test('buildRowsFromMapping derives income from the credit column', () => {
  const headers = ['Date', 'Description', 'Debit', 'Credit'];
  const rows = [['2026-01-02', 'Paycheck', '', '1500.00']];
  const mapping = { dateCol: 'Date', noteCol: 'Description', debitCol: 'Debit', creditCol: 'Credit', dateFormat: 'YYYY-MM-DD' };
  const { parsedRows } = buildRowsFromMapping({ headers, rows, mapping });
  assert.deepEqual(parsedRows, [{ date: '2026-01-02', note: 'Paycheck', amount: 1500, type: 'income' }]);
});

test('buildRowsFromMapping skips rows with an unparseable date', () => {
  const headers = ['Date', 'Description', 'Debit', 'Credit'];
  const rows = [['not-a-date', 'Mystery', '10.00', '']];
  const mapping = { dateCol: 'Date', noteCol: 'Description', debitCol: 'Debit', creditCol: 'Credit', dateFormat: 'YYYY-MM-DD' };
  const { parsedRows, skipped } = buildRowsFromMapping({ headers, rows, mapping });
  assert.equal(parsedRows.length, 0);
  assert.equal(skipped.length, 1);
  assert.match(skipped[0].reason, /could not parse date/);
});

test('buildRowsFromMapping skips rows with no debit or credit amount', () => {
  const headers = ['Date', 'Description', 'Debit', 'Credit'];
  const rows = [['2026-01-03', 'Empty row', '', '']];
  const mapping = { dateCol: 'Date', noteCol: 'Description', debitCol: 'Debit', creditCol: 'Credit', dateFormat: 'YYYY-MM-DD' };
  const { parsedRows, skipped } = buildRowsFromMapping({ headers, rows, mapping });
  assert.equal(parsedRows.length, 0);
  assert.match(skipped[0].reason, /no debit or credit amount/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test src/utils/csvImport.test.js`
Expected: FAIL — `buildRowsFromMapping` is `undefined`.

- [ ] **Step 3: Implement buildRowsFromMapping**

Append to `src/utils/csvImport.js`:

```js
export function buildRowsFromMapping({ headers, rows, mapping }) {
  const { dateCol, noteCol, debitCol, creditCol, dateFormat } = mapping;
  const dateIdx = headers.indexOf(dateCol);
  const noteIdx = headers.indexOf(noteCol);
  const debitIdx = debitCol ? headers.indexOf(debitCol) : -1;
  const creditIdx = creditCol ? headers.indexOf(creditCol) : -1;

  const parsedRows = [];
  const skipped = [];

  rows.forEach((raw, i) => {
    const rawDate = dateIdx >= 0 ? raw[dateIdx] : '';
    const rawNote = noteIdx >= 0 ? raw[noteIdx] : '';
    const rawDebit = debitIdx >= 0 ? raw[debitIdx] : '';
    const rawCredit = creditIdx >= 0 ? raw[creditIdx] : '';

    const date = parseDateWithFormat(rawDate, dateFormat);
    if (!date) {
      skipped.push({ raw, reason: `Row ${i + 2}: could not parse date "${rawDate}"` });
      return;
    }

    const debit = parseFloat(rawDebit);
    const credit = parseFloat(rawCredit);
    const hasDebit = !Number.isNaN(debit) && debit > 0;
    const hasCredit = !Number.isNaN(credit) && credit > 0;

    if (!hasDebit && !hasCredit) {
      skipped.push({ raw, reason: `Row ${i + 2}: no debit or credit amount` });
      return;
    }

    parsedRows.push({
      date,
      note: String(rawNote || '').trim(),
      amount: hasDebit ? debit : credit,
      type: hasDebit ? 'expense' : 'income',
    });
  });

  return { parsedRows, skipped };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test src/utils/csvImport.test.js`
Expected: PASS (19 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/csvImport.js src/utils/csvImport.test.js
git commit -m "feat: build staged rows from a CSV column mapping"
```

---

### Task 4: Duplicate detection and category suggestion

**Files:**
- Modify: `src/utils/csvImport.js`
- Modify: `src/utils/csvImport.test.js`

**Interfaces:**
- Consumes: `normalizeNote` (Task 2)
- Produces: `findDuplicates(parsedRows: { date, note, amount, type }[], existingTransactions: { transaction_date, amount, note }[]) => (parsedRow & { isDuplicate: boolean })[]`
- Produces: `suggestCategories(parsedRows: { date, note, amount, type }[], existingTransactions: { transaction_date, note, category_id }[]) => (parsedRow & { category_id: string | null })[]`

- [ ] **Step 1: Write the failing tests**

Update the top import line in `src/utils/csvImport.test.js` to add `findDuplicates` and `suggestCategories`:

```js
import { parseCsvText, buildHeaderSignature, saveMapping, loadMapping, parseDateWithFormat, guessDateFormat, normalizeNote, guessColumnMapping, buildRowsFromMapping, findDuplicates, suggestCategories } from './csvImport.js';
```

Add these test blocks at the end of the file:

```js
test('findDuplicates flags rows matching date, amount, and note', () => {
  const parsedRows = [{ date: '2026-01-01', note: 'Coffee Shop', amount: 4.5, type: 'expense' }];
  const existing = [{ transaction_date: '2026-01-01', amount: 4.5, note: 'Coffee Shop' }];
  const [result] = findDuplicates(parsedRows, existing);
  assert.equal(result.isDuplicate, true);
});

test('findDuplicates does not flag rows with a different amount', () => {
  const parsedRows = [{ date: '2026-01-01', note: 'Coffee Shop', amount: 4.5, type: 'expense' }];
  const existing = [{ transaction_date: '2026-01-01', amount: 9.0, note: 'Coffee Shop' }];
  const [result] = findDuplicates(parsedRows, existing);
  assert.equal(result.isDuplicate, false);
});

test('suggestCategories reuses the category from the most recent matching note', () => {
  const parsedRows = [{ date: '2026-02-01', note: 'Coffee Shop', amount: 5, type: 'expense' }];
  const existing = [
    { transaction_date: '2026-01-01', note: 'Coffee Shop', category_id: 'cat-old' },
    { transaction_date: '2026-01-20', note: 'Coffee Shop', category_id: 'cat-new' },
  ];
  const [result] = suggestCategories(parsedRows, existing);
  assert.equal(result.category_id, 'cat-new');
});

test('suggestCategories leaves category_id null when no exact note match exists', () => {
  const parsedRows = [{ date: '2026-02-01', note: 'Totally New Payee', amount: 5, type: 'expense' }];
  const [result] = suggestCategories(parsedRows, []);
  assert.equal(result.category_id, null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test src/utils/csvImport.test.js`
Expected: FAIL — `findDuplicates`/`suggestCategories` are `undefined`.

- [ ] **Step 3: Implement findDuplicates and suggestCategories**

Append to `src/utils/csvImport.js`:

```js
export function findDuplicates(parsedRows, existingTransactions) {
  return parsedRows.map(row => {
    const isDuplicate = existingTransactions.some(t =>
      t.transaction_date === row.date &&
      Math.abs(t.amount) === row.amount &&
      normalizeNote(t.note) === normalizeNote(row.note)
    );
    return { ...row, isDuplicate };
  });
}

export function suggestCategories(parsedRows, existingTransactions) {
  return parsedRows.map(row => {
    const targetNote = normalizeNote(row.note);
    if (!targetNote) return { ...row, category_id: null };
    const matches = existingTransactions
      .filter(t => t.category_id && normalizeNote(t.note) === targetNote)
      .sort((a, b) => (b.transaction_date || '').localeCompare(a.transaction_date || ''));
    return { ...row, category_id: matches.length > 0 ? matches[0].category_id : null };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test src/utils/csvImport.test.js`
Expected: PASS (23 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/csvImport.js src/utils/csvImport.test.js
git commit -m "feat: add duplicate detection and note-based category suggestion"
```

---

### Task 5: ImportCsvModal component

**Files:**
- Create: `src/components/transactions/ImportCsvModal.jsx`

**Interfaces:**
- Consumes: `parseCsvText, buildHeaderSignature, saveMapping, loadMapping, guessColumnMapping, guessDateFormat, buildRowsFromMapping, findDuplicates, suggestCategories` (all from `src/utils/csvImport.js`, Tasks 1-4)
- Produces: default export `ImportCsvModal({ categories, transactions, onImport, onClose })` — a React component. `onImport` is called with an array of row objects shaped like `BulkImport.jsx`'s `makeRow()` output (see Task 6) plus `isDuplicate`/`forceInclude`.

This task has no automated tests — this repo has no test suite configured for React components (see Global Constraints), so verification is manual via the dev server (Step 4 below). Papaparse's own parsing correctness and this module's row-building logic are already covered by Tasks 1-4.

- [ ] **Step 1: Create the component**

Create `src/components/transactions/ImportCsvModal.jsx`:

```jsx
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  parseCsvText, buildHeaderSignature, saveMapping, loadMapping,
  guessColumnMapping, guessDateFormat, buildRowsFromMapping,
  findDuplicates, suggestCategories,
} from '../../utils/csvImport';

const DATE_FORMAT_OPTIONS = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'MM-DD-YYYY'];

const EMPTY_MAPPING = { dateCol: '', noteCol: '', debitCol: '', creditCol: '', dateFormat: 'YYYY-MM-DD' };

function ImportCsvModal({ categories, transactions, onImport, onClose }) {
  const [step, setStep] = useState('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState(EMPTY_MAPPING);
  const [parseError, setParseError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    try {
      const text = await file.text();
      const { headers: parsedHeaders, rows: parsedRows } = parseCsvText(text);
      setHeaders(parsedHeaders);
      setRows(parsedRows);
      setFileName(file.name);

      const signature = buildHeaderSignature(parsedHeaders);
      const saved = loadMapping(signature);
      if (saved) {
        setMapping(saved);
      } else {
        const guessed = guessColumnMapping(parsedHeaders);
        const sampleIdx = parsedHeaders.indexOf(guessed.dateCol);
        const samples = sampleIdx >= 0 ? parsedRows.slice(0, 10).map(r => r[sampleIdx]) : [];
        setMapping({ ...guessed, dateFormat: guessDateFormat(samples) });
      }
      setStep('map');
    } catch (err) {
      setParseError(err.message || 'Could not read this file.');
    }
  };

  const { parsedRows, skipped } = useMemo(() => {
    if (!mapping.dateCol || !mapping.noteCol || (!mapping.debitCol && !mapping.creditCol)) {
      return { parsedRows: [], skipped: [] };
    }
    return buildRowsFromMapping({ headers, rows, mapping });
  }, [headers, rows, mapping]);

  const previewRows = useMemo(() => {
    const withDuplicates = findDuplicates(parsedRows, transactions);
    return suggestCategories(withDuplicates, transactions);
  }, [parsedRows, transactions]);

  const duplicateCount = previewRows.filter(r => r.isDuplicate).length;
  const categoryName = (id) => categories.find(c => c.id === id)?.name;

  const handleConfirmImport = () => {
    const signature = buildHeaderSignature(headers);
    saveMapping(signature, mapping);
    const newRows = previewRows.map(r => ({
      id: crypto.randomUUID(),
      date: r.date,
      note: r.note,
      type: r.type,
      category_id: r.category_id,
      amount: String(r.amount),
      from_account_id: null,
      to_account_id: null,
      isDuplicate: r.isDuplicate,
      forceInclude: false,
    }));
    onImport(newRows);
    onClose();
  };

  const setMappingField = (field, value) => setMapping(prev => ({ ...prev, [field]: value }));

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-surface-low rounded-[2rem] border border-outline-variant/15 w-full max-w-3xl max-h-[85vh] flex flex-col slide-up shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10">
          <h3 className="text-xl font-black text-on-surface tracking-tight">Import from CSV</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.05] transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-primary/40" style={{ fontVariationSettings: "'wght' 200" }}>upload_file</span>
              <p className="text-sm text-on-surface-variant max-w-sm">
                Choose a CSV export from your bank or card. You'll map its columns to MOMA fields next.
              </p>
              <label className="mt-2 inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary/20 cursor-pointer hover:brightness-110 transition-all">
                <span className="material-symbols-outlined text-base">attach_file</span>
                Choose CSV file
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
              </label>
              {parseError && (
                <p className="text-xs font-bold text-secondary mt-2">{parseError}</p>
              )}
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-6">
              <p className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest">{fileName} · {rows.length} rows detected</p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { field: 'dateCol', label: 'Date column' },
                  { field: 'noteCol', label: 'Note / Description column' },
                  { field: 'debitCol', label: 'Debit column (expenses)' },
                  { field: 'creditCol', label: 'Credit column (income)' },
                ].map(({ field, label }) => (
                  <label key={field} className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">{label}</span>
                    <select
                      value={mapping[field]}
                      onChange={e => setMappingField(field, e.target.value)}
                      className="bg-surface-container/60 rounded-xl px-3 py-2.5 text-sm font-bold outline-none border border-transparent focus:border-primary/30"
                    >
                      <option value="">— None —</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </label>
                ))}

                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Date format</span>
                  <select
                    value={mapping.dateFormat}
                    onChange={e => setMappingField('dateFormat', e.target.value)}
                    className="bg-surface-container/60 rounded-xl px-3 py-2.5 text-sm font-bold outline-none border border-transparent focus:border-primary/30"
                  >
                    {DATE_FORMAT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>
              </div>

              <div className="bg-surface-lowest/40 rounded-2xl border border-outline-variant/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
                  <span className="text-xs font-black text-on-surface">Preview</span>
                  <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">
                    {previewRows.length} to import
                    {skipped.length > 0 && ` · ${skipped.length} skipped`}
                    {duplicateCount > 0 && ` · ${duplicateCount} possible duplicates`}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {previewRows.length === 0 && skipped.length === 0 && (
                    <p className="px-4 py-8 text-center text-xs text-on-surface-variant/40">Map at least Date, Note, and one of Debit/Credit to see a preview.</p>
                  )}
                  {previewRows.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2 text-xs border-b border-outline-variant/5 last:border-0">
                      <span className="w-24 font-mono text-on-surface-variant/60">{r.date}</span>
                      <span className="flex-1 truncate font-medium text-on-surface">{r.note || '—'}</span>
                      <span className="text-on-surface-variant/50">{categoryName(r.category_id) || 'Uncategorized'}</span>
                      <span className={`font-black tabular-nums ${r.type === 'income' ? 'text-primary' : 'text-secondary'}`}>
                        {r.type === 'income' ? '+' : '−'}{r.amount.toFixed(2)}
                      </span>
                      {r.isDuplicate && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full">Dup</span>
                      )}
                    </div>
                  ))}
                  {skipped.map((s, i) => (
                    <div key={`skip-${i}`} className="px-4 py-2 text-[10px] text-secondary/70 font-bold">{s.reason}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {step === 'map' && (
          <div className="px-8 py-5 border-t border-outline-variant/10 flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={previewRows.length === 0}
              className="px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-primary text-on-primary shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Import {previewRows.length} rows
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default ImportCsvModal;
```

- [ ] **Step 2: Confirm the file compiles (dev server, no import errors yet)**

The component isn't wired into `BulkImport.jsx` yet, so it won't render anywhere. This step just confirms it doesn't break the build:

Run: `npm run lint`
Expected: no errors from `src/components/transactions/ImportCsvModal.jsx` (an "unused export" is expected and fine — ESLint doesn't flag unused exports).

- [ ] **Step 3: Commit**

```bash
git add src/components/transactions/ImportCsvModal.jsx
git commit -m "feat: add ImportCsvModal upload/map/preview UI"
```

---

### Task 6: Wire CSV import into Bulk Entry

**Files:**
- Modify: `src/views/BulkImport.jsx`

**Interfaces:**
- Consumes: default export `ImportCsvModal` (Task 5); `getRowStatus`, `makeRow`, `StatusBadge`, `updateRow`, `scrollToBottom` (all already defined in this file)
- Produces: nothing new consumed elsewhere — this is the integration point.

- [ ] **Step 1: Import the modal**

In `src/views/BulkImport.jsx`, add near the top with the other imports (after line 5, `import { getCategoryIcon } from '../utils/formatters';`):

```js
import ImportCsvModal from '../components/transactions/ImportCsvModal';
```

- [ ] **Step 2: Add isDuplicate/forceInclude to makeRow and extend getRowStatus**

Replace the `makeRow` function (currently lines 12-21):

```js
const makeRow = () => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().split('T')[0],
  note: '',
  type: 'expense',
  category_id: null,
  amount: '',
  from_account_id: null,
  to_account_id: null,
  isDuplicate: false,
  forceInclude: false,
});
```

Replace the `getRowStatus` function (currently lines 36-47):

```js
const getRowStatus = (row) => {
  const v = parseFloat(row.amount);
  const hasAmount = !isNaN(v) && v > 0;
  const hasContent = hasAmount || row.note.trim() || row.category_id;
  if (!hasContent) return 'empty';
  if (!row.date || !hasAmount) return 'error';
  if (row.type === 'transfer') {
    if (!row.from_account_id || !row.to_account_id) return 'error';
    if (row.from_account_id === row.to_account_id)  return 'error';
  }
  if (row.isDuplicate && !row.forceInclude) return 'duplicate';
  return 'ready';
};
```

- [ ] **Step 3: Add the Duplicate status badge**

In the `StatusBadge` function (currently lines 328-342), add a duplicate branch before the `error` check:

```js
function StatusBadge({ status }) {
  if (status === 'ready') return (
    <span className="inline-flex items-center gap-1 bg-primary-fixed text-primary px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
      <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      Ready
    </span>
  );
  if (status === 'duplicate') return (
    <span className="inline-flex items-center gap-1 bg-tertiary/10 text-tertiary px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
      <span className="material-symbols-outlined" style={{ fontSize: 10 }}>content_copy</span>
      Duplicate
    </span>
  );
  if (status === 'error') return (
    <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
      <span className="material-symbols-outlined" style={{ fontSize: 10 }}>warning</span>
      Fix
    </span>
  );
  return null;
}
```

- [ ] **Step 4: Fold duplicate rows into the "Need Attention" stat**

In the `stats` `useMemo` (currently lines 405-411), change the `attention` line:

```js
  const stats = useMemo(() => {
    const ready     = enrichedRows.filter(r => r._status === 'ready').length;
    const attention = enrichedRows.filter(r => r._status === 'error' || r._status === 'duplicate').length;
    const filled    = enrichedRows.filter(r => r._status !== 'empty').length;
    const netChange = enrichedRows.reduce((s, r) => s + r._delta, 0);
    return { total: filled, ready, attention, netChange };
  }, [enrichedRows]);
```

- [ ] **Step 5: Add showImportModal state and the import handler**

Near the other `useState`/`useRef` declarations (currently lines 355-361), add:

```js
  const [showImportModal, setShowImportModal] = useState(false);
```

After the `addOneRow` declaration (currently line 433), add:

```js
  const handleImportRows = useCallback((newRows) => {
    setRows(prev => {
      const kept = prev.filter(r => getRowStatus(r) !== 'empty');
      return [...kept, ...newRows];
    });
    setTimeout(scrollToBottom, 60);
  }, [scrollToBottom]);
```

- [ ] **Step 6: Add the "Keep anyway" action to the Status cell**

Replace the Status `<td>` (currently line 862):

```jsx
                      {/* Status */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={row._status} />
                          {row._status === 'duplicate' && (
                            <button
                              type="button"
                              onClick={() => updateRow(row.id, 'forceInclude', true)}
                              className="text-[9px] font-bold text-primary underline underline-offset-2 hover:text-primary/70 transition-colors"
                            >
                              Keep anyway
                            </button>
                          )}
                        </div>
                      </td>
```

- [ ] **Step 7: Add the "Import CSV" button next to "Add row"**

Replace the table footer's left-hand button (currently lines 882-890):

```jsx
            {/* Table footer */}
            <div className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={addRowAndFocus}
                  className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Add row
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  Import CSV
                </button>
              </div>
```

(The `<div className="flex items-center gap-4">` that follows, containing the keyboard hints, stays as-is — it's now the second child of the footer's flex row instead of the first.)

- [ ] **Step 8: Render the modal**

Immediately before the closing `</div>` that ends the "Desktop UI" wrapper (currently line 925, right after the page body's closing `</div>` at line 924), add:

```jsx
        {showImportModal && (
          <ImportCsvModal
            categories={categories}
            transactions={transactions}
            onImport={handleImportRows}
            onClose={() => setShowImportModal(false)}
          />
        )}
```

- [ ] **Step 9: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add src/views/BulkImport.jsx
git commit -m "feat: wire CSV import into Bulk Entry grid"
```

---

### Task 7: End-to-end manual verification

**Files:** none (verification only)

This project has no automated UI test suite (see Global Constraints), so this feature's end-to-end behavior is verified by driving the real app in a browser, per the `run` skill's guidance to launch and interact with the actual app rather than just typechecking it.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Vite starts on `http://localhost:5173/` with no errors.

- [ ] **Step 2: Create a sample CSV fixture**

Create a scratch file (not part of the repo) at a temp path, e.g. `sample-import.csv`, with this content:

```csv
Date,Description,Debit,Credit
25/06/2026,Coffee Shop,4.50,
26/06/2026,Paycheck,,1500.00
27/06/2026,,,
28/06/2026,Grocery Store,62.10,
```

Note: row 4 (`27/06/2026,,,`) has no debit/credit and must be skipped by the importer; the other three rows must be imported. Use `DD/MM/YYYY` dates to verify date-format guessing picks day-first correctly (day value 25/26/27/28 all exceed 12, which disambiguates the format).

- [ ] **Step 3: Drive the flow in the browser**

1. Log in and navigate to Bulk Entry.
2. Click "Import CSV" in the table footer — modal opens on the Upload step.
3. Choose `sample-import.csv` — modal advances to the Map step.
4. Verify: `Date`, `Description`, `Debit`, `Credit` are auto-detected into the right dropdowns, and the date format dropdown shows `DD/MM/YYYY`.
5. Verify the preview shows exactly 3 rows to import and 1 skipped (with a reason mentioning "no debit or credit amount"), and the Coffee Shop row shows `− 4.50` (expense) while the Paycheck row shows `+ 1500.00` (income).
6. Click "Import 3 rows" — modal closes, and the 3 rows now appear in the Bulk Entry grid with correct date/note/amount/type, `Ready` status, and editable category pickers.
7. Re-upload the same `sample-import.csv` file via "Import CSV" again — in the Map step preview, the 3 previously-imported rows should now show as possible duplicates (since they now exist in your loaded transactions... note: they won't, because they haven't been committed yet in this session — see Step 8 below).
8. Click "Commit" in Bulk Entry to save the 3 rows, then repeat the CSV import once more (Steps 3-5) with the same file — this time the preview should flag all 3 matching rows with a "Dup" badge and the grid should show them with a "Duplicate" status and a "Keep anyway" link.
9. Click "Keep anyway" on one duplicate row and verify its status flips to "Ready".

If any step doesn't match, fix the relevant code in Tasks 1-6 and re-verify before proceeding.

- [ ] **Step 4: Clean up test data**

Delete the transactions created during manual verification (via the ledger's normal delete action) so they don't pollute real data, unless the user wants to keep them.
