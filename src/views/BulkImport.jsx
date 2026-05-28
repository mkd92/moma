import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppDataContext, useToast } from '../hooks';
import { supabase } from '../supabaseClient';
import { getCategoryIcon } from '../utils/formatters';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const TODAY = new Date().toISOString().split('T')[0];

const makeRow = () => ({
  id: crypto.randomUUID(),
  date: TODAY,
  note: '',
  category_id: null,
  amount: '',
});

const getRowType = (amount) => {
  const v = parseFloat(amount);
  return !isNaN(v) && v > 0 ? 'income' : 'expense';
};

const getRowStatus = (row) => {
  const hasContent = row.amount !== '' || row.note !== '' || row.category_id;
  if (!hasContent) return 'empty';
  const v = parseFloat(row.amount);
  if (!row.date || isNaN(v) || v === 0) return 'error';
  return 'ready';
};

const fmtCurrency = (symbol, n) => {
  const abs = Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `-${symbol}${abs}` : `${symbol}${abs}`;
};

/* ─── Cell Category Picker ─────────────────────────────────────────────────── */

function CellCategoryPicker({ value, onChange, categories, type }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [style, setStyle] = useState({});
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const parents = categories.filter(c => !c.parent_id && c.type === type);
  const subs = categories.filter(c => c.parent_id);

  const options = parents.flatMap(p => [
    { value: p.id, label: p.name, icon: getCategoryIcon(p.name), isParent: true, parentName: null },
    ...subs
      .filter(s => s.parent_id === p.id)
      .map(s => ({
        value: s.id, label: s.name, icon: getCategoryIcon(s.name), indent: true, parentName: p.name,
      })),
  ]);

  const filtered = search.trim()
    ? options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.parentName && o.parentName.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  const selected = options.find(o => o.value === value);
  const displayLabel = selected
    ? selected.parentName
      ? `${selected.parentName} · ${selected.label}`
      : selected.label
    : null;

  const openMenu = (e) => {
    e.stopPropagation();
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const W = 240;
    const left = Math.min(rect.left, window.innerWidth - W - 16);
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const top = spaceBelow > 270 ? rect.bottom + 4 : rect.top - 274;
    setStyle({ position: 'fixed', top, left, width: W, zIndex: 9999 });
    setSearch('');
    setOpen(true);
    setTimeout(() => searchRef.current?.focus(), 10);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        !btnRef.current?.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openMenu}
        title={displayLabel || 'Select category'}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors whitespace-nowrap max-w-[160px] ${
          selected
            ? 'bg-primary-fixed/70 text-primary'
            : 'text-on-surface-variant/25 hover:text-on-surface-variant hover:bg-surface-container'
        }`}
      >
        {selected && (
          <span className="material-symbols-outlined shrink-0" style={{ fontSize: 11 }}>
            {selected.icon}
          </span>
        )}
        <span className="truncate">{displayLabel || '+ Category'}</span>
        {!selected && (
          <span className="material-symbols-outlined shrink-0" style={{ fontSize: 11 }}>add</span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="bg-surface-low rounded-2xl border border-outline-variant shadow-2xl overflow-hidden"
          style={style}
        >
          <div className="p-2 border-b border-outline-variant/20">
            <input
              ref={searchRef}
              type="text"
              className="w-full bg-surface-lowest rounded-xl py-2 px-3 text-xs outline-none placeholder:text-on-surface-variant/30 focus:ring-1 focus:ring-primary/20 border border-outline-variant/20"
              placeholder="Search categories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto py-1">
            {value && (
              <button
                className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-error/60 hover:bg-error/5 transition-colors"
                onClick={() => { onChange(null); setOpen(false); }}
              >
                — Clear
              </button>
            )}
            {filtered.map(opt => (
              <button
                key={opt.value}
                className={`w-full flex items-center gap-2 text-left py-2.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                  opt.indent ? 'pl-8 pr-4' : 'px-4'
                } ${
                  opt.value === value
                    ? 'bg-primary-fixed text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span className="material-symbols-outlined shrink-0" style={{ fontSize: 13 }}>
                  {opt.icon}
                </span>
                <span className="truncate">{opt.label}</span>
                {opt.value === value && (
                  <span className="material-symbols-outlined ml-auto shrink-0" style={{ fontSize: 11 }}>check</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-[10px] text-on-surface-variant/30 font-bold uppercase tracking-widest">
                No matches
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ─── Status Badge ─────────────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  if (status === 'ready') return (
    <span className="inline-flex items-center gap-1 bg-primary-fixed text-primary px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
      <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      Ready
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

/* ─── Main View ────────────────────────────────────────────────────────────── */

const BulkImport = () => {
  const {
    accounts,
    categories,
    transactions,
    defaultAccountId,
    currencySymbol,
    session,
    fetchTransactions,
    setView,
    isLoading,
  } = useAppDataContext();

  const { showToast } = useToast();

  const [selectedAccountId, setSelectedAccountId] = useState(
    () => defaultAccountId || accounts[0]?.id || null
  );
  const [rows, setRows] = useState(() => Array.from({ length: 8 }, makeRow));
  const [isCommitting, setIsCommitting] = useState(false);
  const tableRef = useRef(null);

  // Sync default account once data loads
  useEffect(() => {
    if (!selectedAccountId && (defaultAccountId || accounts[0]?.id)) {
      setSelectedAccountId(defaultAccountId || accounts[0].id);
    }
  }, [defaultAccountId, accounts, selectedAccountId]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  /* Current balance of selected account derived from existing transactions */
  const accountCurrentBalance = useMemo(() => {
    if (!selectedAccountId) return 0;
    const acct = accounts.find(a => a.id === selectedAccountId);
    if (!acct) return 0;
    const txSum = transactions
      .filter(t => t.account_id === selectedAccountId)
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
    return (acct.initial_balance || 0) + txSum;
  }, [accounts, transactions, selectedAccountId]);

  /* Enrich rows with running balance + status */
  const enrichedRows = useMemo(() => {
    let running = accountCurrentBalance;
    return rows.map(row => {
      const v = parseFloat(row.amount);
      const delta = isNaN(v) ? 0 : v;
      running += delta;
      return {
        ...row,
        _status: getRowStatus(row),
        _type: getRowType(row.amount),
        _runningBalance: running,
        _delta: delta,
      };
    });
  }, [rows, accountCurrentBalance]);

  /* Summary stats */
  const stats = useMemo(() => {
    const ready = enrichedRows.filter(r => r._status === 'ready').length;
    const attention = enrichedRows.filter(r => r._status === 'error').length;
    const filled = enrichedRows.filter(r => r._status !== 'empty').length;
    const netChange = enrichedRows.reduce((s, r) => s + r._delta, 0);
    return { total: filled, ready, attention, netChange };
  }, [enrichedRows]);

  /* ── Row mutations ── */
  const updateRow = useCallback((id, field, val) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  }, []);

  const deleteRow = useCallback((id) => {
    setRows(prev => {
      const next = prev.filter(r => r.id !== id);
      return next.length ? next : [makeRow()];
    });
  }, []);

  const addRows = useCallback((n = 5) => {
    setRows(prev => [...prev, ...Array.from({ length: n }, makeRow)]);
  }, []);

  /* Tab on the last row's amount → append a new row and focus it */
  const handleAmountKeyDown = useCallback((e, rowIdx) => {
    if (e.key === 'Tab' && !e.shiftKey && rowIdx === rows.length - 1) {
      e.preventDefault();
      addRows(1);
      setTimeout(() => {
        const dateCells = tableRef.current?.querySelectorAll('[data-col="date"]');
        if (dateCells) [...dateCells][rowIdx + 1]?.focus();
      }, 40);
    }
  }, [rows.length, addRows]);

  /* ── Discard ── */
  const handleDiscard = () => {
    const hasData = enrichedRows.some(r => r._status !== 'empty');
    if (hasData && !window.confirm('Discard all staged rows and return to Journal?')) return;
    setView('ledger');
  };

  /* ── Commit ready rows ── */
  const handleCommit = useCallback(async () => {
    const readyRows = enrichedRows.filter(r => r._status === 'ready');
    if (!readyRows.length || !selectedAccountId || !session) return;

    setIsCommitting(true);
    try {
      const inserts = readyRows.map(row => {
        const v = parseFloat(row.amount);
        return {
          user_id: session.user.id,
          account_id: selectedAccountId,
          category_id: row.category_id || null,
          amount: Math.abs(v),
          type: v > 0 ? 'income' : 'expense',
          note: row.note.trim() || null,
          transaction_date: row.date,
        };
      });

      const { error } = await supabase.from('transactions').insert(inserts);
      if (error) throw error;

      showToast(
        `${readyRows.length} entr${readyRows.length === 1 ? 'y' : 'ies'} committed to ledger`,
        'success'
      );
      await fetchTransactions();
      setView('ledger');
    } catch (err) {
      console.error('Bulk commit error:', err);
      showToast(err.message || 'Commit failed', 'error');
    } finally {
      setIsCommitting(false);
    }
  }, [enrichedRows, selectedAccountId, session, fetchTransactions, setView, showToast]);

  const fmt = (n) => fmtCurrency(currencySymbol, n);
  const fmtDelta = (n) => (n > 0 ? '+' : '') + fmt(n);

  /* ── Desktop-only gate ── */
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="flex-1 w-full min-h-0 flex flex-col relative scrollable-area">

      {/* ── Mobile fallback ─────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col items-center justify-center h-full px-8 py-16 text-center gap-4">
        <span className="material-symbols-outlined text-5xl text-primary/40" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>
          desktop_windows
        </span>
        <h2 className="text-xl font-black text-on-surface">Bulk Entry is desktop only</h2>
        <p className="text-sm text-on-surface-variant">
          Open MOMA on a wider screen to stage multiple entries at once.
        </p>
        <button
          onClick={() => setView('new_transaction')}
          className="mt-2 flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          Add one entry instead
        </button>
      </div>

      {/* ── Full desktop UI ──────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col flex-1 min-h-0">

        {/* Sticky top bar */}
        <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/15 px-6 py-3.5 flex items-center justify-between gap-4">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-on-surface-variant min-w-0">
            <button
              onClick={() => setView('ledger')}
              className="flex items-center gap-1 hover:text-primary transition-colors font-medium shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">auto_stories</span>
              Journal
            </button>
            <span className="material-symbols-outlined text-sm text-on-surface-variant/30 shrink-0">chevron_right</span>
            <span className="flex items-center gap-1.5 font-black text-on-surface shrink-0">
              <span className="material-symbols-outlined text-[16px] text-primary">table_rows</span>
              Bulk Entry
            </span>
          </div>

          {/* Account selector + actions */}
          <div className="flex items-center gap-2.5 shrink-0">

            {/* Account picker */}
            <label className="flex items-center gap-2 bg-surface-low rounded-2xl px-4 py-2 border border-outline-variant/15 cursor-pointer hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant text-[16px]">account_balance</span>
              <select
                value={selectedAccountId || ''}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="bg-transparent text-[11px] font-black text-on-surface outline-none cursor-pointer pr-1 uppercase tracking-wide"
              >
                {accounts.length === 0 && <option value="">No accounts</option>}
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">expand_more</span>
            </label>

            {/* Discard */}
            <button
              onClick={handleDiscard}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-all border border-outline-variant/15"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              Discard
            </button>

            {/* Commit */}
            <button
              onClick={handleCommit}
              disabled={stats.ready === 0 || isCommitting || !selectedAccountId}
              className="flex items-center gap-2 px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-primary text-on-primary shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: isCommitting ? "'FILL' 0" : "'FILL' 1" }}
              >
                {isCommitting ? 'sync' : 'check_circle'}
              </span>
              {isCommitting ? 'Committing…' : `Commit ${stats.ready} ready`}
            </button>
          </div>
        </div>

        {/* Page body */}
        <div className="px-6 lg:px-8 py-8 max-w-[1440px] w-full mx-auto space-y-6">

          {/* Editorial header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-sm">table_rows</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Bulk Entry · Manual</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-on-surface tracking-tight leading-tight max-w-2xl">
              Stage new movements before they touch your ledger.
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Fill each row, verify the running balance, then commit when every entry is grounded.
              <span className="ml-2 text-[11px] text-on-surface-variant/40 font-semibold">
                Negative amounts = expense · Positive = income
              </span>
            </p>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: 'Total Rows',
                value: stats.total || '—',
                color: 'text-on-surface',
              },
              {
                label: 'Ready to Commit',
                value: stats.ready,
                color: 'text-primary',
              },
              {
                label: 'Need Attention',
                value: stats.attention,
                color: stats.attention > 0 ? 'text-secondary' : 'text-on-surface-variant/30',
              },
              {
                label: 'Net Change After Commit',
                value: stats.netChange === 0
                  ? `${currencySymbol}0.00`
                  : fmtDelta(stats.netChange),
                color:
                  stats.netChange > 0 ? 'text-primary' :
                  stats.netChange < 0 ? 'text-secondary' :
                  'text-on-surface-variant/30',
              },
            ].map(s => (
              <div
                key={s.label}
                className="bg-surface-low rounded-[1.5rem] px-5 py-4 border border-outline-variant/10 shadow-[0_4px_16px_rgba(77,97,75,0.04)]"
              >
                <div className={`text-2xl font-black tabular-nums mb-1 ${s.color}`}>{s.value}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div className="bg-surface-low rounded-[2rem] overflow-hidden border border-outline-variant/10 shadow-[0_20px_40px_rgba(77,97,75,0.06)]">
            <div className="overflow-x-auto">
              <table ref={tableRef} className="w-full min-w-[900px] border-collapse">

                {/* Head */}
                <thead>
                  <tr className="border-b border-outline-variant/15">
                    <th className="w-12 pl-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-on-surface-variant/25 select-none">
                      #
                    </th>
                    <th className="px-3 py-4 text-left text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                      Date
                    </th>
                    <th className="px-3 py-4 text-left text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                      Payee / Note
                    </th>
                    <th className="px-3 py-4 text-left text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                      Category
                    </th>
                    <th className="px-3 py-4 text-right text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                      Amount
                    </th>
                    <th className="px-4 py-4 text-right text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                      Balance · {selectedAccount?.name || 'Account'}
                    </th>
                    <th className="px-3 py-4 text-left text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                      Status
                    </th>
                    <th className="w-10 pr-4" />
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {enrichedRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`group border-b border-outline-variant/10 last:border-0 transition-colors duration-75 ${
                        row._status === 'error'
                          ? 'bg-secondary/[0.03]'
                          : idx % 2 === 0
                          ? 'bg-surface-lowest/20'
                          : ''
                      } hover:bg-primary-fixed/10`}
                    >
                      {/* Row # */}
                      <td className="pl-6 pr-2 py-3 text-[10px] font-bold text-on-surface-variant/25 select-none">
                        {idx + 1}
                      </td>

                      {/* Date */}
                      <td className="px-2 py-3">
                        <input
                          type="date"
                          data-col="date"
                          value={row.date}
                          onChange={e => updateRow(row.id, 'date', e.target.value)}
                          className="bg-transparent outline-none text-xs font-semibold text-on-surface focus:bg-surface-container/60 rounded-lg px-2 py-1.5 transition-colors w-[132px] border border-transparent focus:border-outline-variant/20"
                        />
                      </td>

                      {/* Payee / Note */}
                      <td className="px-2 py-3">
                        <input
                          type="text"
                          placeholder="Payee or note…"
                          value={row.note}
                          onChange={e => updateRow(row.id, 'note', e.target.value)}
                          className="bg-transparent outline-none text-xs font-medium text-on-surface placeholder:text-on-surface-variant/20 focus:bg-surface-container/60 rounded-lg px-2 py-1.5 transition-colors w-full min-w-[150px] border border-transparent focus:border-outline-variant/20"
                        />
                      </td>

                      {/* Category */}
                      <td className="px-2 py-3">
                        <CellCategoryPicker
                          value={row.category_id}
                          onChange={v => updateRow(row.id, 'category_id', v)}
                          categories={categories}
                          type={row._type}
                        />
                      </td>

                      {/* Amount */}
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-0.5 focus-within:bg-surface-container/60 rounded-lg px-2 py-1.5 transition-colors border border-transparent focus-within:border-outline-variant/20">
                          <span className="text-on-surface-variant/25 text-[11px] font-bold select-none">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={row.amount}
                            onChange={e => updateRow(row.id, 'amount', e.target.value)}
                            onKeyDown={e => handleAmountKeyDown(e, idx)}
                            className={`bg-transparent outline-none text-xs font-black text-right w-[88px] tabular-nums placeholder:text-on-surface-variant/20 ${
                              parseFloat(row.amount) > 0
                                ? 'text-primary'
                                : parseFloat(row.amount) < 0
                                ? 'text-secondary'
                                : 'text-on-surface'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Running balance */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-xs font-black tabular-nums ${
                              row._runningBalance >= 0 ? 'text-primary' : 'text-secondary'
                            }`}
                          >
                            {fmt(row._runningBalance)}
                          </span>
                          {row._delta !== 0 && (
                            <span
                              className={`text-[9px] font-bold tabular-nums mt-0.5 ${
                                row._delta > 0 ? 'text-primary/50' : 'text-secondary/50'
                              }`}
                            >
                              {fmtDelta(row._delta)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <StatusBadge status={row._status} />
                      </td>

                      {/* Delete */}
                      <td className="pr-4 py-3 w-10">
                        <button
                          type="button"
                          onClick={() => deleteRow(row.id)}
                          title="Remove row"
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant/30 hover:bg-error/10 hover:text-error transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => addRows(5)}
                  className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Add 5 rows
                </button>
                <span className="text-on-surface-variant/20 select-none">·</span>
                <button
                  type="button"
                  onClick={() => addRows(1)}
                  className="text-xs font-bold text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                >
                  + 1 row
                </button>
              </div>

              <div className="flex items-center gap-5">
                {[
                  { keys: ['Tab'], hint: 'Next cell' },
                  { keys: ['Tab', '↵'], hint: 'New row at end' },
                ].map(({ keys, hint }, i) => (
                  <span key={i} className="flex items-center gap-1 text-[9px] text-on-surface-variant/25">
                    {keys.map(k => (
                      <kbd
                        key={k}
                        className="px-1.5 py-0.5 bg-surface-container rounded text-[9px] font-mono border border-outline-variant/20 text-on-surface-variant/40"
                      >
                        {k}
                      </kbd>
                    ))}
                    <span className="ml-0.5">{hint}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Balance anchor info */}
          <div className="flex items-center gap-2 text-xs text-on-surface-variant/35 px-2 pb-4">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>
              Running balance starts from{' '}
              <strong className="text-on-surface-variant/60">
                {selectedAccount?.name || '…'}
              </strong>
              {' '}current balance:{' '}
              <strong className={accountCurrentBalance >= 0 ? 'text-primary/70' : 'text-secondary/70'}>
                {fmt(accountCurrentBalance)}
              </strong>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BulkImport;
