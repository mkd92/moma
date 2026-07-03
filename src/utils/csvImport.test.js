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
