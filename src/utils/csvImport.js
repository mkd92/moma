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
