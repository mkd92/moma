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

function parseAmount(raw) {
  return parseFloat(String(raw).trim().replace(/,/g, ''));
}

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

    const debit = parseAmount(rawDebit);
    const credit = parseAmount(rawCredit);
    const hasDebit = !Number.isNaN(debit) && debit > 0;
    const hasCredit = !Number.isNaN(credit) && credit > 0;

    if (!hasDebit && !hasCredit) {
      skipped.push({ raw, reason: `Row ${i + 2}: no debit or credit amount` });
      return;
    }

    const type = hasDebit ? 'expense' : 'income';
    parsedRows.push({
      date,
      note: humanizeNote(String(rawNote || '').trim(), type),
      amount: hasDebit ? debit : credit,
      type,
    });
  });

  return { parsedRows, skipped };
}

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
