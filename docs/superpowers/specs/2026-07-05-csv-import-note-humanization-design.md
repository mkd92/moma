# CSV Import Note Humanization — Design

Date: 2026-07-05

## Problem

Bank CSV exports (this codebase targets Indian bank statements, e.g. IOB)
carry machine-oriented narrations in the note/description column, e.g.:

```
UPI/209814909586/CR/MANIKANDAN MAR/IOB/NA
UPI/P2M/608247030050/Thanigai Agencies    /Sent u/YES BANK LIMITED YBS
NEFT/IDFB613083124582/BANYAM MIKRO SUPPLY PLATFORM/IDFC FIRST BANK LTD/April 2026 Salary
```

These get imported verbatim today (`buildRowsFromMapping` in
`src/utils/csvImport.js` just trims the raw column value), so the ledger ends
up full of slash-delimited reference IDs, bank codes, and truncated
boilerplate ("Sent u", "MandateE") instead of a readable payee name. This
design adds a humanization step that extracts the payer/payee name and bank
from recognized narration formats, applied when rows are built from the CSV
mapping.

## Scope

**In scope:**
- Recognizing `UPI/...`, `NEFT/...`, and `IMPS/...` narration formats
  (exact match on the first `/`-separated segment) and rewriting them to
  `"<TYPE> <from|to> <Name> (<Bank>)"`.
- Applying this during CSV import only (`buildRowsFromMapping`), so the
  humanized text becomes the transaction's actual saved `note` — including
  what duplicate detection and category auto-suggestion compare against.
- A safe fallback: any narration that doesn't fit the recognized shape (or
  where no name segment can be confidently identified) is left completely
  unchanged.

**Explicitly out of scope:**
- ECOM/POS/ATM/VISA MERCH/interest-credit/charge-line narrations (e.g.
  `ECOM PUR/BOOKMYSHOW CO/...`, `SB:920010018700161:Int.Pd:...`,
  `ACH-CR-771757-NACH-...`) — these don't start with an exact `UPI`/`NEFT`/
  `IMPS` token (or have no `/` at all) and pass through unchanged by design;
  no special-casing needed since the "unrecognized shape" fallback already
  covers them.
- A UI toggle to disable humanization. The Bulk Entry grid's note field is
  already a plain editable text input, so a misparsed row is a one-click
  manual fix before committing — the same escape hatch already used for
  skipped/duplicate rows.
- Verified IMPS examples — none appeared in the sample data. IMPS is treated
  like NEFT (no P2M/P2A subtype segment). If real IMPS narrations turn out to
  have a different shape, the fallback ensures they degrade to "shown raw"
  rather than producing a wrong result.
- Reconstructing word boundaries in names the bank has already truncated or
  concatenated without spaces (e.g. `RAMKUMARMEDICALSWEST`). These remain a
  single title-cased word — a known cosmetic limitation, not a correctness
  issue.

## Algorithm

New function `humanizeNote(rawNote, type)` in `src/utils/csvImport.js`,
where `type` is `'income'` or `'expense'` (already known from which of the
debit/credit columns had the amount).

1. Split `rawNote` on `/`. If fewer than 3 segments, or the first segment
   (trimmed, uppercased) is not exactly `UPI`, `NEFT`, or `IMPS`, return
   `rawNote` unchanged.
2. **Name segment** (type-dependent, since UPI has an extra P2M/P2A subtype
   segment that NEFT/IMPS lack):
   - `UPI` → segment index 3
   - `NEFT` / `IMPS` → segment index 2
   - If that index doesn't exist, or the segment is blank/`NA` after
     trimming, return `rawNote` unchanged.
3. **Bank segment**: scan the segments *after* the name index, from **last to
   first** (rightmost match wins), for the first one that either contains
   `"BAN"` case-insensitively (matches "BANK", "Bank", truncated forms like
   "ICICI Ban") or exactly equals a known short bank code — `HDFC`, `IDFC`,
   `ICICI`, `SBI`, `IOB`, `KVB`, `YBS` (case-insensitive). If none found (e.g.
   `IOBA`, `KVBL`, `BKID` — close to but not exactly a known code), omit the
   bank suffix — still an improvement over the raw string.

   Scanning right-to-left (instead of left-to-right) matters: in
   `UPI/P2M/608966647612/BANYAM MIKRO SUPPLY P/Banyam/AXIS BANK`, the
   truncated remark segment `Banyam` itself contains the substring `"BAN"`.
   A left-to-right scan would wrongly pick `Banyam` as the bank before ever
   reaching the real `AXIS BANK` at the end. Since the bank segment is
   consistently the *last* meaningful segment across every observed format
   (`UPI` short form, `UPI/P2M`, `UPI/P2A`, `NEFT`), scanning from the end
   finds the real bank first and never risks a remark-word false match.
4. All remaining segments (transaction reference numbers, truncated remarks
   like "Sent u"/"Payvia"/"MandateE", `P2V` markers, trailing empty segments)
   are discarded.
5. **Text cleanup** applied to the name and bank segments independently:
   - Collapse repeated whitespace to a single space, trim.
   - If the segment is entirely uppercase (no lowercase letters), title-case
     it word by word, except words matching a fixed acronym list — which are
     kept fully uppercase — `HDFC`, `IDFC`, `ICICI`, `SBI`, `IOB`, `KVB`,
     `YBS`, `GST`, `RTGS`, `UPI`, `NEFT`, `IMPS`.
   - If the segment already has mixed case (e.g. "Zomato Online Order",
     "ICICI Bank"), leave it untouched.
6. Direction word: `type === 'income' ? 'from' : 'to'` — from the row's own
   computed type, not any embedded CR/DR flag (NEFT narrations here don't
   even carry one).
7. Result: `` `${TYPE} ${from|to} ${Name}${bank ? ` (${Bank})` : ''}` ``.

### Worked examples

| Raw note | Type | Result |
|---|---|---|
| `UPI/209814909586/CR/MANIKANDAN MAR/IOB/NA` | income | `UPI from Manikandan Mar (IOB)` — `IOB` matches the known-bank-code list |
| `UPI/P2M/608247030050/Thanigai Agencies    /Sent u/YES BANK LIMITED YBS` | expense | `UPI to Thanigai Agencies (Yes Bank Limited YBS)` |
| `UPI/P2A/791578661253/M  ASIF/IOBA/Payment/` | expense | `UPI to M Asif` |
| `NEFT/IDFB613083124582/BANYAM MIKRO SUPPLY PLATFORM/IDFC FIRST BANK LTD/April 2026 Salary` | income | `NEFT from Banyam Mikro Supply Platform (IDFC First Bank Ltd)` |
| `UPI/P2M/906619501176/Google Pl/AXIS BANK/MandateE//P2V/` | expense | `UPI to Google Pl (Axis Bank)` |
| `Cash Txn Chrgs Incl GST` | expense | unchanged |
| `UPILITE/DORMANT/27.03.2026` | expense | unchanged (not an exact `UPI` match) |
| `ECOM PUR/BOOKMYSHOW CO/1243054000/290326/15:25/608815680819` | expense | unchanged |
| `SB:920010018700161:Int.Pd:01-01-2026 to 31-03-2026` | income | unchanged (no `/`) |

Note: two distinct acronym lists are used for different purposes:
- **Bank identification** (step 3): a narrow set of known short bank codes —
  `HDFC`, `IDFC`, `ICICI`, `SBI`, `IOB`, `KVB`, `YBS` — checked for an *exact*
  segment match. This deliberately excludes `UPI`/`NEFT`/`IMPS`/`GST`/`RTGS`,
  since those words also show up as generic remark/purpose text (e.g. the
  literal remark segment `UPI` in `UPI/P2A/609681115883/ANBURAJ/KVBL/UPI/`) —
  including them here would misidentify a remark as the bank.
- **Title-case preservation** (step 5): a broader list — the bank-code set
  above plus `GST`, `RTGS`, `UPI`, `NEFT`, `IMPS` — used only to keep those
  words uppercase *within a segment already identified as name or bank*, e.g.
  so `YES BANK LIMITED YBS` → `Yes Bank Limited YBS`, not `Yes Bank Limited Ybs`.

## Integration point

In `buildRowsFromMapping` (`src/utils/csvImport.js`), the line:

```js
note: String(rawNote || '').trim(),
```

becomes:

```js
note: humanizeNote(String(rawNote || '').trim(), hasDebit ? 'expense' : 'income'),
```

No other call sites change. `findDuplicates` and `suggestCategories` continue
to operate on `row.note` as before — they now compare humanized notes, which
should improve category auto-suggestion hit rate since transaction IDs no
longer make every UPI row look unique.

## Testing

Unit tests added to `src/utils/csvImport.test.js` covering:
- The worked examples above (recognized UPI/NEFT shapes, both directions).
- Pass-through cases: ECOM/POS/ATM/interest/charge lines, `UPILITE` (near
  but not exact match), ordinary free-text notes ("Coffee Shop").
- Fallback cases: a `UPI/...` string too short to contain a name segment.
- Acronym preservation in bank names (`HDFC`, `IDFC`).
- Bank omitted when no segment contains "BAN".

## New dependency

None — pure string parsing, no new packages.
