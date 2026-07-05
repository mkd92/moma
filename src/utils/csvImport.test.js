import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsvText, buildHeaderSignature, saveMapping, loadMapping, parseDateWithFormat, guessDateFormat, normalizeNote, guessColumnMapping, buildRowsFromMapping, findDuplicates, suggestCategories, humanizeNote } from './csvImport.js';

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

test('buildRowsFromMapping strips thousands-separator commas from debit amounts', () => {
  const headers = ['Date', 'Description', 'Debit', 'Credit'];
  const rows = [['2026-01-04', 'Big Purchase', '1,500.00', '']];
  const mapping = { dateCol: 'Date', noteCol: 'Description', debitCol: 'Debit', creditCol: 'Credit', dateFormat: 'YYYY-MM-DD' };
  const { parsedRows, skipped } = buildRowsFromMapping({ headers, rows, mapping });
  assert.equal(skipped.length, 0);
  assert.deepEqual(parsedRows, [{ date: '2026-01-04', note: 'Big Purchase', amount: 1500, type: 'expense' }]);
});

test('buildRowsFromMapping skips rows with no debit or credit amount', () => {
  const headers = ['Date', 'Description', 'Debit', 'Credit'];
  const rows = [['2026-01-03', 'Empty row', '', '']];
  const mapping = { dateCol: 'Date', noteCol: 'Description', debitCol: 'Debit', creditCol: 'Credit', dateFormat: 'YYYY-MM-DD' };
  const { parsedRows, skipped } = buildRowsFromMapping({ headers, rows, mapping });
  assert.equal(parsedRows.length, 0);
  assert.match(skipped[0].reason, /no debit or credit amount/);
});

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
