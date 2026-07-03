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
