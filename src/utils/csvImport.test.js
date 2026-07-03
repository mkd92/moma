import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsvText, buildHeaderSignature, saveMapping, loadMapping, parseDateWithFormat, guessDateFormat, normalizeNote, guessColumnMapping } from './csvImport.js';

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
