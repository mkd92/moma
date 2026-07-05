# CSV Import Note Humanization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn machine-oriented bank narrations (`UPI/209814909586/CR/MANIKANDAN MAR/IOB/NA`) into readable notes (`UPI from Manikandan Mar (IOB)`) during CSV import.

**Architecture:** A single pure function `humanizeNote(rawNote, type)` added to `src/utils/csvImport.js` parses recognized `UPI`/`NEFT`/`IMPS` narration shapes, extracting a name and (optionally) a bank, and falls back to the raw string unchanged for anything it doesn't recognize. `buildRowsFromMapping` calls it when building each row's `note`, so the humanized text becomes the transaction's actual saved note.

**Tech Stack:** Plain JavaScript (ES modules), `node:test` + `node:assert/strict` for unit tests (matches existing `csvImport.test.js`). No new dependencies.

## Global Constraints

- Only `UPI`, `NEFT`, `IMPS` narrations are recognized (exact match on the first `/`-separated segment, case-insensitive); everything else passes through unchanged.
- The bank segment is found by scanning **right-to-left** (last segment to first) after the name segment, matching either a known short bank code (`HDFC`, `IDFC`, `ICICI`, `SBI`, `IOB`, `KVB`, `YBS`) exactly, or containing `"BAN"` case-insensitively. Right-to-left order is required to avoid a truncated remark (e.g. `Banyam`) shadowing the real bank.
- Direction word (`from`/`to`) comes from the row's own `type` (`'income'`/`'expense'`, already derived from which of the debit/credit columns held the amount) — never from an embedded `CR`/`DR` flag.
- Title-casing only applies to a segment that is entirely uppercase (no lowercase letters); already-mixed-case segments are left untouched. A fixed acronym list (`HDFC`, `IDFC`, `ICICI`, `SBI`, `IOB`, `KVB`, `YBS`, `GST`, `RTGS`, `UPI`, `NEFT`, `IMPS`) is kept fully uppercase during title-casing.
- No new UI toggle — the Bulk Entry grid's existing editable note field is the escape hatch for misparsed rows.
- Full spec: `docs/superpowers/specs/2026-07-05-csv-import-note-humanization-design.md`.

---

### Task 1: Add `humanizeNote` to `csvImport.js`

**Files:**
- Modify: `src/utils/csvImport.js`
- Test: `src/utils/csvImport.test.js`

**Interfaces:**
- Produces: `export function humanizeNote(rawNote: string, type: 'income' | 'expense'): string` — later tasks (Task 2) call this directly.

- [ ] **Step 1: Write the failing tests**

Add to `src/utils/csvImport.test.js`. First, update the import line at the top of the file:

```js
import { parseCsvText, buildHeaderSignature, saveMapping, loadMapping, parseDateWithFormat, guessDateFormat, normalizeNote, guessColumnMapping, buildRowsFromMapping, findDuplicates, suggestCategories, humanizeNote } from './csvImport.js';
```

Then append these tests at the end of the file:

```js
test('humanizeNote formats a UPI transfer with a CR flag and a short bank code', () => {
  assert.equal(
    humanizeNote('UPI/209814909586/CR/MANIKANDAN MAR/IOB/NA', 'income'),
    'UPI from Manikandan Mar (IOB)'
  );
});

test('humanizeNote formats a UPI P2M transfer with a full bank name', () => {
  assert.equal(
    humanizeNote('UPI/P2M/608247030050/Thanigai Agencies    /Sent u/YES BANK LIMITED YBS', 'expense'),
    'UPI to Thanigai Agencies (Yes Bank Limited YBS)'
  );
});

test('humanizeNote omits the bank when no segment matches a known code or contains "BAN"', () => {
  assert.equal(
    humanizeNote('UPI/P2A/791578661253/M  ASIF/IOBA/Payment/', 'expense'),
    'UPI to M Asif'
  );
});

test('humanizeNote formats a NEFT transfer using the two-segment-earlier name position', () => {
  assert.equal(
    humanizeNote('NEFT/IDFB613083124582/BANYAM MIKRO SUPPLY PLATFORM/IDFC FIRST BANK LTD/April 2026 Salary', 'income'),
    'NEFT from Banyam Mikro Supply Platform (IDFC First Bank Ltd)'
  );
});

test('humanizeNote finds the bank past trailing mandate/P2V markers', () => {
  assert.equal(
    humanizeNote('UPI/P2M/906619501176/Google Pl/AXIS BANK/MandateE//P2V/', 'expense'),
    'UPI to Google Pl (Axis Bank)'
  );
});

test('humanizeNote scans right-to-left so a remark containing "BAN" does not shadow the real bank', () => {
  assert.equal(
    humanizeNote('UPI/P2M/608966647612/BANYAM MIKRO SUPPLY P/Banyam/AXIS BANK', 'expense'),
    'UPI to Banyam Mikro Supply P (Axis Bank)'
  );
});

test('humanizeNote preserves already-mixed-case segments as-is', () => {
  assert.equal(
    humanizeNote('UPI/P2M/752550018963/Zomato Online Order  /Zomato/AIRTEL PAYMENTS BANK', 'expense'),
    'UPI to Zomato Online Order (Airtel Payments Bank)'
  );
});

test('humanizeNote leaves unrecognized narration formats unchanged', () => {
  assert.equal(humanizeNote('Cash Txn Chrgs Incl GST', 'expense'), 'Cash Txn Chrgs Incl GST');
  assert.equal(humanizeNote('UPILITE/DORMANT/27.03.2026', 'expense'), 'UPILITE/DORMANT/27.03.2026');
  assert.equal(
    humanizeNote('ECOM PUR/BOOKMYSHOW CO/1243054000/290326/15:25/608815680819', 'expense'),
    'ECOM PUR/BOOKMYSHOW CO/1243054000/290326/15:25/608815680819'
  );
  assert.equal(
    humanizeNote('SB:920010018700161:Int.Pd:01-01-2026 to 31-03-2026', 'income'),
    'SB:920010018700161:Int.Pd:01-01-2026 to 31-03-2026'
  );
});

test('humanizeNote falls back to the raw note when the name segment is missing or blank/NA', () => {
  assert.equal(humanizeNote('UPI/12345/CR', 'income'), 'UPI/12345/CR');
  assert.equal(humanizeNote('UPI/12345/CR/NA/NA', 'income'), 'UPI/12345/CR/NA/NA');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test src/utils/csvImport.test.js`
Expected: FAIL — `humanizeNote is not a function` (or similar `TypeError`), since it doesn't exist yet.

- [ ] **Step 3: Implement `humanizeNote`**

Add to `src/utils/csvImport.js`, above the existing `export function buildRowsFromMapping` (i.e. after `parseAmount`, before `buildRowsFromMapping`):

```js
const BANK_CODES = new Set(['HDFC', 'IDFC', 'ICICI', 'SBI', 'IOB', 'KVB', 'YBS']);
const TITLE_CASE_ACRONYMS = new Set([...BANK_CODES, 'GST', 'RTGS', 'UPI', 'NEFT', 'IMPS']);

function collapseWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function titleCaseSegment(rawSegment) {
  const collapsed = collapseWhitespace(rawSegment);
  if (!collapsed || /[a-z]/.test(collapsed)) return collapsed;
  return collapsed
    .split(' ')
    .map(word => {
      const upper = word.toUpperCase();
      if (TITLE_CASE_ACRONYMS.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function findBankSegment(segments, startIndex) {
  for (let i = segments.length - 1; i >= startIndex; i--) {
    const segment = String(segments[i] || '').trim();
    if (!segment) continue;
    const upper = segment.toUpperCase();
    if (BANK_CODES.has(upper) || upper.includes('BAN')) return segment;
  }
  return null;
}

export function humanizeNote(rawNote, type) {
  const note = String(rawNote || '').trim();
  const segments = note.split('/');
  if (segments.length < 3) return note;

  const prefix = segments[0].trim().toUpperCase();
  if (!['UPI', 'NEFT', 'IMPS'].includes(prefix)) return note;

  const nameIndex = prefix === 'UPI' ? 3 : 2;
  if (nameIndex >= segments.length) return note;

  const rawName = String(segments[nameIndex] || '').trim();
  if (!rawName || rawName.toUpperCase() === 'NA') return note;

  const rawBank = findBankSegment(segments, nameIndex + 1);
  const name = titleCaseSegment(rawName);
  const bank = rawBank ? titleCaseSegment(rawBank) : null;
  const verb = type === 'income' ? 'from' : 'to';

  return `${prefix} ${verb} ${name}${bank ? ` (${bank})` : ''}`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test src/utils/csvImport.test.js`
Expected: PASS — all tests green, including the 9 new `humanizeNote` tests and all pre-existing tests (unaffected, since none of their notes match the `UPI`/`NEFT`/`IMPS` prefix check).

- [ ] **Step 5: Commit**

```bash
git add src/utils/csvImport.js src/utils/csvImport.test.js
git commit -m "feat: add humanizeNote to parse UPI/NEFT/IMPS bank narrations"
```

---

### Task 2: Wire `humanizeNote` into `buildRowsFromMapping`

**Files:**
- Modify: `src/utils/csvImport.js:130-135` (the `parsedRows.push(...)` block inside `buildRowsFromMapping`)
- Test: `src/utils/csvImport.test.js`

**Interfaces:**
- Consumes: `humanizeNote(rawNote: string, type: 'income' | 'expense'): string` from Task 1.

- [ ] **Step 1: Write the failing integration test**

Append to `src/utils/csvImport.test.js`:

```js
test('buildRowsFromMapping humanizes UPI/NEFT narrations using the row\'s own income/expense type', () => {
  const headers = ['Date', 'Description', 'Debit', 'Credit'];
  const rows = [
    ['2026-01-05', 'UPI/209814909586/CR/MANIKANDAN MAR/IOB/NA', '', '500.00'],
    ['2026-01-06', 'UPI/P2M/608247030050/Thanigai Agencies    /Sent u/YES BANK LIMITED YBS', '250.00', ''],
  ];
  const mapping = { dateCol: 'Date', noteCol: 'Description', debitCol: 'Debit', creditCol: 'Credit', dateFormat: 'YYYY-MM-DD' };
  const { parsedRows, skipped } = buildRowsFromMapping({ headers, rows, mapping });
  assert.equal(skipped.length, 0);
  assert.equal(parsedRows[0].note, 'UPI from Manikandan Mar (IOB)');
  assert.equal(parsedRows[0].type, 'income');
  assert.equal(parsedRows[1].note, 'UPI to Thanigai Agencies (Yes Bank Limited YBS)');
  assert.equal(parsedRows[1].type, 'expense');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test src/utils/csvImport.test.js`
Expected: FAIL — `parsedRows[0].note` is the raw untouched string (`'UPI/209814909586/CR/MANIKANDAN MAR/IOB/NA'`), not the humanized version, since `buildRowsFromMapping` doesn't call `humanizeNote` yet.

- [ ] **Step 3: Wire the call into `buildRowsFromMapping`**

In `src/utils/csvImport.js`, find this block inside `buildRowsFromMapping`:

```js
    parsedRows.push({
      date,
      note: String(rawNote || '').trim(),
      amount: hasDebit ? debit : credit,
      type: hasDebit ? 'expense' : 'income',
    });
```

Replace it with:

```js
    const type = hasDebit ? 'expense' : 'income';
    parsedRows.push({
      date,
      note: humanizeNote(String(rawNote || '').trim(), type),
      amount: hasDebit ? debit : credit,
      type,
    });
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test src/utils/csvImport.test.js`
Expected: PASS — the new integration test passes, and all pre-existing `buildRowsFromMapping` tests (`'Coffee Shop'`, `'Paycheck'`, `'Big Purchase'`, `'Mystery'`, `'Empty row'`) still pass unchanged, since none of those notes match the `UPI`/`NEFT`/`IMPS` prefix and `humanizeNote` returns them as-is.

- [ ] **Step 5: Run the full lint check**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/utils/csvImport.js src/utils/csvImport.test.js
git commit -m "feat: wire CSV import to humanize UPI/NEFT/IMPS notes"
```
