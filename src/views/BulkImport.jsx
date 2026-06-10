import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppDataContext, useToast } from '../hooks';
import { supabase } from '../supabaseClient';
import { getCategoryIcon } from '../utils/formatters';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

// Column indices — keep in sync with the <td> render order
const COL = { DATE: 0, TYPE: 1, NOTE: 2, DETAIL: 3, AMOUNT: 4 };

const makeRow = () => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().split('T')[0],
  note: '',
  type: 'expense',
  category_id: null,
  amount: '',
  from_account_id: null,
  to_account_id: null,
});

const getRowDelta = (row, defaultAccountId) => {
  const v = parseFloat(row.amount);
  if (isNaN(v) || v <= 0) return 0;
  if (row.type === 'income')   return v;
  if (row.type === 'expense')  return -v;
  if (row.type === 'transfer') {
    if (row.from_account_id === defaultAccountId) return -v;
    if (row.to_account_id   === defaultAccountId) return  v;
    return 0;
  }
  return 0;
};

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
  return 'ready';
};

const fmtCurrency = (symbol, n) => {
  const abs = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `-${symbol}${abs}` : `${symbol}${abs}`;
};

/* ─── Type Toggle ──────────────────────────────────────────────────────────── */

const TYPES = ['expense', 'income', 'transfer'];

const TYPE_META = {
  expense:  { label: 'Exp', activeClass: 'bg-secondary/15 text-secondary' },
  income:   { label: 'Inc', activeClass: 'bg-primary-fixed/80 text-primary' },
  transfer: { label: 'Xfr', activeClass: 'bg-surface-container text-on-surface' },
};

/**
 * Keyboard contract (when wrapper div is focused OR bubbles from child buttons):
 *   ←/→  cycle through Exp → Inc → Xfr
 *   ↑/↓  navigate rows (passed in via onArrow)
 */
function TypeToggle({ value, onChange, onArrow, dataRow, dataCol }) {
  return (
    <div
      tabIndex={0}
      data-row={dataRow}
      data-col={dataCol}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          onChange(TYPES[(TYPES.indexOf(value) + 1) % TYPES.length]);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onChange(TYPES[(TYPES.indexOf(value) + TYPES.length - 1) % TYPES.length]);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          onArrow(e);
        }
      }}
      className="flex gap-0.5 bg-surface-container/40 p-0.5 rounded-lg shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/30"
    >
      {TYPES.map(key => (
        <button
          key={key}
          type="button"
          tabIndex={-1}   /* Tab skips individual buttons; wrapper handles keyboard */
          onClick={() => onChange(key)}
          className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wide transition-all whitespace-nowrap ${
            value === key
              ? TYPE_META[key].activeClass
              : 'text-on-surface-variant/30 hover:text-on-surface-variant'
          }`}
        >
          {TYPE_META[key].label}
        </button>
      ))}
    </div>
  );
}

/* ─── Cell Category Picker ─────────────────────────────────────────────────── */

/**
 * Keyboard contract:
 *   Trigger button  — Enter/Space opens dropdown; ↑↓←→ delegated to onArrow
 *   Search input    — type to filter; ↓ moves into list; Enter auto-selects
 *                     when exactly one result remains; Escape closes
 *   Option buttons  — ↓/↑ navigate list (↑ on first wraps back to search);
 *                     Enter/Space selects; Escape closes
 */
function CellCategoryPicker({ value, onChange, categories, type, onArrow, dataRow, dataCol }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const [style, setStyle]   = useState({});
  const btnRef    = useRef(null);
  const menuRef   = useRef(null);
  const searchRef = useRef(null);
  const listRef   = useRef(null);   // wraps all option buttons for keyboard nav

  const parents = categories.filter(c => !c.parent_id && c.type === type);
  const subs    = categories.filter(c => c.parent_id);

  const options = parents.flatMap(p => [
    { value: p.id, label: p.name, icon: getCategoryIcon(p.name), parentName: null },
    ...subs
      .filter(s => s.parent_id === p.id)
      .map(s => ({ value: s.id, label: s.name, icon: getCategoryIcon(s.name), indent: true, parentName: p.name })),
  ]);

  const filtered = search.trim()
    ? options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.parentName && o.parentName.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  const selected     = options.find(o => o.value === value);
  const displayLabel = selected
    ? selected.parentName ? `${selected.parentName} · ${selected.label}` : selected.label
    : null;

  const closeMenu = () => { setOpen(false); btnRef.current?.focus(); };

  const openMenu = (e) => {
    e?.stopPropagation();
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const W    = 240;
    const left = Math.min(rect.left, window.innerWidth - W - 16);
    const top  = (window.innerHeight - rect.bottom - 8) > 270 ? rect.bottom + 4 : rect.top - 274;
    setStyle({ position: 'fixed', top, left, width: W, zIndex: 9999 });
    setSearch('');
    setOpen(true);
    setTimeout(() => searchRef.current?.focus(), 10);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keyboard navigation inside the option list
  const handleItemKeyDown = (e) => {
    const items = Array.from(listRef.current?.querySelectorAll('button') || []);
    const idx   = items.indexOf(e.currentTarget);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = items[idx + 1];
      if (next) next.focus(); else searchRef.current?.focus(); // wrap to top
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) items[idx - 1].focus(); else searchRef.current?.focus(); // back to search
    } else if (e.key === 'Escape') {
      closeMenu();
    } else if (e.key === 'Tab') {
      // Close and let Tab move to the next table cell naturally
      setOpen(false);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        data-row={dataRow}
        data-col={dataCol}
        onClick={openMenu}
        onKeyDown={(e) => {
          if (open) return; // dropdown is open — let its own handlers take over
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMenu(); return; }
          onArrow?.(e);
        }}
        title={displayLabel || 'Select category'}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors whitespace-nowrap max-w-[170px] focus:outline-none focus:ring-1 focus:ring-primary/30 ${
          selected
            ? 'bg-primary-fixed/70 text-primary'
            : 'text-on-surface-variant/25 hover:text-on-surface-variant hover:bg-surface-container'
        }`}
      >
        {selected && <span className="material-symbols-outlined shrink-0" style={{ fontSize: 11 }}>{selected.icon}</span>}
        <span className="truncate">{displayLabel || '+ Category'}</span>
        {!selected && <span className="material-symbols-outlined shrink-0" style={{ fontSize: 11 }}>add</span>}
      </button>

      {open && createPortal(
        <div ref={menuRef} className="bg-surface-low rounded-2xl border border-outline-variant shadow-2xl overflow-hidden" style={style}>
          {/* Search */}
          <div className="p-2 border-b border-outline-variant/20">
            <input
              ref={searchRef}
              type="text"
              className="w-full bg-surface-lowest rounded-xl py-2 px-3 text-xs outline-none placeholder:text-on-surface-variant/30 focus:ring-1 focus:ring-primary/20 border border-outline-variant/20"
              placeholder="Search categories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') { closeMenu(); return; }

                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  // Move focus into the first item in the list
                  listRef.current?.querySelectorAll('button')[0]?.focus();
                  return;
                }

                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filtered.length === 1) {
                    // Single match — auto-select immediately
                    onChange(filtered[0].value); closeMenu();
                  } else if (filtered.length > 1) {
                    // Multiple matches — jump into the list so the user can pick
                    listRef.current?.querySelectorAll('button')[0]?.focus();
                  }
                }
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Option list */}
          <div ref={listRef} className="max-h-[220px] overflow-y-auto py-1">
            {value && (
              <button
                className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-error/60 hover:bg-error/5 focus:outline-none focus:bg-error/5 transition-colors"
                onKeyDown={handleItemKeyDown}
                onClick={() => { onChange(null); closeMenu(); }}
              >
                — Clear
              </button>
            )}
            {filtered.map(opt => (
              <button
                key={opt.value}
                className={`w-full flex items-center gap-2 text-left py-2.5 text-[10px] font-bold uppercase tracking-wide transition-colors focus:outline-none ${
                  opt.indent ? 'pl-8 pr-4' : 'px-4'
                } ${
                  opt.value === value
                    ? 'bg-primary-fixed text-primary focus:bg-primary-fixed/80'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface focus:bg-surface-container focus:text-on-surface'
                }`}
                onKeyDown={handleItemKeyDown}
                onClick={() => { onChange(opt.value); closeMenu(); }}
              >
                <span className="material-symbols-outlined shrink-0" style={{ fontSize: 13 }}>{opt.icon}</span>
                <span className="truncate">{opt.label}</span>
                {opt.value === value && <span className="material-symbols-outlined ml-auto shrink-0" style={{ fontSize: 11 }}>check</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-[10px] text-on-surface-variant/30 font-bold uppercase tracking-widest">No matches</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ─── Transfer Account Selector ────────────────────────────────────────────── */

function TransferAccounts({ fromId, toId, onFromChange, onToChange, accounts, onArrow, dataRow }) {
  return (
    <div className="flex items-center gap-1.5">
      <select
        value={fromId || ''}
        data-row={dataRow}
        data-col={COL.DETAIL}
        onChange={e => onFromChange(e.target.value || null)}
        onKeyDown={onArrow}
        className={`bg-surface-container/60 rounded-lg px-2 py-1 text-[10px] font-bold outline-none max-w-[110px] truncate border border-transparent focus:ring-1 focus:ring-primary/30 ${
          !fromId ? 'text-on-surface-variant/40' : 'text-on-surface'
        }`}
      >
        <option value="">From…</option>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <span className="material-symbols-outlined text-on-surface-variant/30 shrink-0" style={{ fontSize: 13 }}>arrow_forward</span>
      <select
        value={toId || ''}
        onChange={e => onToChange(e.target.value || null)}
        className={`bg-surface-container/60 rounded-lg px-2 py-1 text-[10px] font-bold outline-none max-w-[110px] truncate border border-transparent focus:ring-1 focus:ring-primary/30 ${
          !toId ? 'text-on-surface-variant/40' : 'text-on-surface'
        }`}
      >
        <option value="">To…</option>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
    </div>
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
    accounts, categories, transactions,
    defaultAccountId, currencySymbol,
    session, fetchTransactions, setView,
  } = useAppDataContext();

  const { showToast } = useToast();

  const [rows, setRows]           = useState([makeRow()]);
  const [isCommitting, setIsCommitting] = useState(false);
  const [postAccountId, setPostAccountId] = useState(null);
  const userPickedAccount = useRef(false);
  const committingRef = useRef(false);   // hard re-entrancy guard (closes the double-click window)
  const tableRef = useRef(null);

  /**
   * The account every NON-transfer row posts to. Seeded from the user's saved
   * default account once it loads (the profile fetch is async and can resolve
   * AFTER cached accounts populate). Auto-corrects to the real default when it
   * arrives — UNLESS the user has manually overridden the selector. We never
   * silently fall back to accounts[0] for committing: see the commit guard.
   */
  useEffect(() => {
    if (userPickedAccount.current) return;
    if (defaultAccountId) {
      setPostAccountId(defaultAccountId);
    } else if (accounts.length > 0) {
      setPostAccountId(prev => prev || accounts[0].id);
    }
  }, [defaultAccountId, accounts]);

  // Posting target (user-controlled). Alias keeps the rest of the file unchanged.
  const effectiveAccountId = postAccountId;
  const postAccount = accounts.find(a => a.id === effectiveAccountId);

  /* Current balance of the account entries post to */
  const accountCurrentBalance = useMemo(() => {
    if (!effectiveAccountId) return 0;
    const acct = accounts.find(a => a.id === effectiveAccountId);
    if (!acct) return 0;
    const txSum = transactions
      .filter(t => t.account_id === effectiveAccountId)
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
    return (acct.initial_balance || 0) + txSum;
  }, [accounts, transactions, effectiveAccountId]);

  /* Enrich rows */
  const enrichedRows = useMemo(() => {
    let running = accountCurrentBalance;
    return rows.map(row => {
      const delta = getRowDelta(row, effectiveAccountId);
      running += delta;
      return { ...row, _status: getRowStatus(row), _delta: delta, _runningBalance: running };
    });
  }, [rows, accountCurrentBalance, effectiveAccountId]);

  /* Stats */
  const stats = useMemo(() => {
    const ready     = enrichedRows.filter(r => r._status === 'ready').length;
    const attention = enrichedRows.filter(r => r._status === 'error').length;
    const filled    = enrichedRows.filter(r => r._status !== 'empty').length;
    const netChange = enrichedRows.reduce((s, r) => s + r._delta, 0);
    return { total: filled, ready, attention, netChange };
  }, [enrichedRows]);

  /* ── Row mutations ────────────────────────────────────────────────────── */

  const updateRow = useCallback((id, field, val) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r))
  , []);

  const handleTypeChange = useCallback((id, newType) =>
    setRows(prev => prev.map(r => r.id !== id ? r : {
      ...r,
      type: newType,
      category_id:     newType === 'transfer' ? null : r.category_id,
      from_account_id: newType === 'transfer' ? (effectiveAccountId || null) : null,
      to_account_id:   newType === 'transfer' ? r.to_account_id : null,
    }))
  , [effectiveAccountId]);

  const deleteRow = useCallback((id) =>
    setRows(prev => { const next = prev.filter(r => r.id !== id); return next.length ? next : [makeRow()]; })
  , []);

  const addOneRow = useCallback(() => setRows(prev => [...prev, makeRow()]), []);

  /* ── Keyboard navigation ──────────────────────────────────────────────── */

  /**
   * Focus the primary focusable element of cell (rowIdx, colIdx).
   * Every navigable cell has [data-row][data-col] on its focusable element.
   */
  const focusCell = useCallback((rowIdx, colIdx) => {
    if (rowIdx < 0) return;
    const el = tableRef.current?.querySelector(
      `[data-row="${rowIdx}"][data-col="${colIdx}"]`
    );
    if (!el) return;
    el.focus({ preventScroll: true });
    // Scroll the whole ROW into view (not just the cell): the row carries
    // scroll-margin top/bottom so it clears the sticky top bar AND the
    // floating bottom nav, which otherwise covers the last row.
    const row = el.closest('tr') || el;
    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  /* Append a row and scroll/focus straight into it (used by the Add-row button) */
  const addRowAndFocus = useCallback(() => {
    const newIdx = rows.length;            // new row's index = current length
    addOneRow();
    setTimeout(() => focusCell(newIdx, COL.DATE), 40);
  }, [rows.length, addOneRow, focusCell]);

  /**
   * Central arrow-key handler. Called by each cell with its own (rowIdx, colIdx).
   *
   * Navigation rules:
   *   ↑ / ↓        → move to same column in prev/next row (↓ at last row: add row)
   *   ← / →        → move to adjacent column (text inputs: only at boundary)
   *   col DATE(0)  → no Up/Down interception (browser changes date parts)
   *   col TYPE(1)  → ← / → cycle type instead of changing column (handled in TypeToggle)
   *   col AMT(4)   → no Up/Down interception (browser increments number)
   */
  const handleArrowKey = useCallback((e, rowIdx, colIdx) => {
    const key = e.key;
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) return;

    // Date input: let the browser handle all arrow keys (cycles day/month/year)
    if (colIdx === COL.DATE) return;
    // Amount input: let the browser handle Up/Down (increments number value)
    if (colIdx === COL.AMOUNT && (key === 'ArrowUp' || key === 'ArrowDown')) return;
    // Transfer "To" select: Up/Down used by native select — skip
    if (e.target.tagName === 'SELECT' && (key === 'ArrowUp' || key === 'ArrowDown')) return;

    if (key === 'ArrowDown') {
      e.preventDefault();
      if (rowIdx >= rows.length - 1) {
        // Last row → append and move down
        addOneRow();
        setTimeout(() => focusCell(rowIdx + 1, colIdx), 40);
      } else {
        focusCell(rowIdx + 1, colIdx);
      }
      return;
    }

    if (key === 'ArrowUp') {
      if (rowIdx <= 0) return;
      e.preventDefault();
      focusCell(rowIdx - 1, colIdx);
      return;
    }

    // Left / Right  — only move column when cursor is at text boundary
    const isTextInput = e.target.tagName === 'INPUT' && e.target.type === 'text';
    const isNumberInput = e.target.tagName === 'INPUT' && e.target.type === 'number';

    if (key === 'ArrowLeft') {
      if (isTextInput && e.target.selectionStart !== 0) return;
      if (isNumberInput && e.target.selectionStart !== 0) return;
      if (colIdx <= COL.DATE) return;
      e.preventDefault();
      focusCell(rowIdx, colIdx - 1);
      return;
    }

    if (key === 'ArrowRight') {
      if (isTextInput && e.target.selectionStart !== e.target.value.length) return;
      if (isNumberInput && e.target.selectionStart !== e.target.value.length) return;
      if (colIdx >= COL.AMOUNT) return;
      e.preventDefault();
      focusCell(rowIdx, colIdx + 1);
    }
  }, [rows.length, addOneRow, focusCell]);

  /* Tab on the last row's amount → add a new row */
  const handleAmountKeyDown = useCallback((e, rowIdx) => {
    if (e.key === 'Tab' && !e.shiftKey && rowIdx === rows.length - 1) {
      e.preventDefault();
      addOneRow();
      setTimeout(() => focusCell(rowIdx + 1, COL.DATE), 40);
    }
    handleArrowKey(e, rowIdx, COL.AMOUNT);
  }, [rows.length, addOneRow, focusCell, handleArrowKey]);

  /* ── Discard / Commit ─────────────────────────────────────────────────── */

  const handleDiscard = () => {
    if (enrichedRows.some(r => r._status !== 'empty') &&
        !window.confirm('Discard all staged rows and return to Journal?')) return;
    setView('ledger');
  };

  const handleCommit = useCallback(async () => {
    // Re-entrancy guard: `isCommitting` is async state with a render gap, so a
    // fast double/triple-click would fire this again and insert the batch twice.
    // The ref flips synchronously, so only the first invocation proceeds.
    if (committingRef.current) return;

    const readyRows = enrichedRows.filter(r => r._status === 'ready');
    if (!readyRows.length || !session) return;
    // Never post to an arbitrary account — require an explicit target.
    if (!effectiveAccountId) {
      showToast('Choose which account these entries post to first', 'error');
      return;
    }

    committingRef.current = true;
    setIsCommitting(true);
    try {
      const payload = [];

      for (const row of readyRows) {
        const v = parseFloat(row.amount);
        if (row.type === 'transfer') {
          const tid = crypto.randomUUID();
          const base = { user_id: session.user.id, amount: v, note: row.note.trim() || null, transaction_date: row.date, transfer_id: tid, category_id: null, party_id: null };
          payload.push(
            { ...base, account_id: row.from_account_id, type: 'expense' },
            { ...base, account_id: row.to_account_id, type: 'income' },
          );
        } else {
          payload.push({ user_id: session.user.id, account_id: effectiveAccountId, category_id: row.category_id || null, amount: v, type: row.type, note: row.note.trim() || null, transaction_date: row.date });
        }
      }

      // Single insert = one atomic statement. No partial success across two
      // calls, so a transient error can never leave half the batch saved (which
      // a retry would then duplicate).
      const { error } = await supabase.from('transactions').insert(payload);
      if (error) throw error;

      showToast(`${readyRows.length} entr${readyRows.length === 1 ? 'y' : 'ies'} committed`, 'success');
      await fetchTransactions();
      setView('ledger');
    } catch (err) {
      console.error('Bulk commit error:', err);
      showToast(err.message || 'Commit failed', 'error');
      // Only release the guard on failure so the user can retry. On success we
      // navigate away and the component unmounts, discarding the ref.
      committingRef.current = false;
    } finally {
      setIsCommitting(false);
    }
  }, [enrichedRows, effectiveAccountId, session, fetchTransactions, setView, showToast]);

  const fmt      = (n) => fmtCurrency(currencySymbol, n);
  const fmtDelta = (n) => (n > 0 ? '+' : '') + fmt(n);

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div className="flex-1 w-full min-h-0 flex flex-col relative scrollable-area">

      {/* Mobile gate */}
      <div className="md:hidden flex flex-col items-center justify-center h-full px-8 py-16 text-center gap-4">
        <span className="material-symbols-outlined text-5xl text-primary/40" style={{ fontVariationSettings: "'wght' 200" }}>desktop_windows</span>
        <h2 className="text-xl font-black text-on-surface">Bulk Entry is desktop only</h2>
        <p className="text-sm text-on-surface-variant">Open MOMA on a wider screen to stage multiple entries at once.</p>
        <button onClick={() => setView('new_transaction')} className="mt-2 flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-base">add_circle</span>
          Add one entry instead
        </button>
      </div>

      {/* Desktop UI */}
      <div className="hidden md:flex flex-col flex-1 min-h-0">

        {/* Sticky top bar */}
        <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/15 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-sm text-on-surface-variant min-w-0">
            <button onClick={() => setView('ledger')} className="flex items-center gap-1 hover:text-primary transition-colors font-medium shrink-0">
              <span className="material-symbols-outlined text-[16px]">auto_stories</span>
              Journal
            </button>
            <span className="material-symbols-outlined text-sm text-on-surface-variant/30 shrink-0">chevron_right</span>
            <span className="flex items-center gap-1.5 font-black text-on-surface shrink-0">
              <span className="material-symbols-outlined text-[16px] text-primary">table_rows</span>
              Bulk Entry
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button onClick={handleDiscard} className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-all border border-outline-variant/15">
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              Discard
            </button>
            <button
              onClick={handleCommit}
              disabled={stats.ready === 0 || isCommitting || !effectiveAccountId}
              className="flex items-center gap-2 px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-primary text-on-primary shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: isCommitting ? "'FILL' 0" : "'FILL' 1" }}>
                {isCommitting ? 'sync' : 'check_circle'}
              </span>
              {isCommitting ? 'Committing…' : `Commit ${stats.ready} ready`}
            </button>
          </div>
        </div>

        {/* Page body */}
        <div className="px-6 lg:px-8 pt-8 pb-40 max-w-[1440px] w-full mx-auto space-y-6">

          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-sm">table_rows</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Bulk Entry · Manual</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-on-surface tracking-tight leading-tight max-w-2xl">
              Stage new movements before they touch your ledger.
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Set the type per row, fill in the details, confirm the running balance, then commit when every entry is grounded.
            </p>

            {/* Post-to account selector — every non-transfer row lands here.
                Made explicit so entries never silently post to the wrong account. */}
            <div className="flex items-center gap-3 flex-wrap pt-1">
              <div className="inline-flex items-center gap-2.5 bg-surface-low rounded-2xl pl-4 pr-3 py-2.5 border border-outline-variant/15 shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-primary">account_balance</span>
                <label htmlFor="bulk-post-account" className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">
                  Post entries to
                </label>
                <select
                  id="bulk-post-account"
                  value={postAccountId || ''}
                  onChange={e => { userPickedAccount.current = true; setPostAccountId(e.target.value || null); }}
                  className="bg-transparent text-sm font-black text-on-surface outline-none cursor-pointer pr-1"
                >
                  {accounts.length === 0 && <option value="">No accounts</option>}
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant/40 font-medium">
                <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                Transfer rows use their own From → To accounts.
              </span>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Rows',            value: stats.total || '—',  color: 'text-on-surface' },
              { label: 'Ready to Commit',        value: stats.ready,          color: 'text-primary' },
              { label: 'Need Attention',          value: stats.attention,      color: stats.attention > 0 ? 'text-secondary' : 'text-on-surface-variant/30' },
              {
                label: 'Net Change After Commit',
                value: stats.netChange === 0 ? `${currencySymbol}0.00` : fmtDelta(stats.netChange),
                color: stats.netChange > 0 ? 'text-primary' : stats.netChange < 0 ? 'text-secondary' : 'text-on-surface-variant/30',
              },
            ].map(s => (
              <div key={s.label} className="bg-surface-low rounded-[1.5rem] px-5 py-4 border border-outline-variant/10 shadow-[0_4px_16px_rgba(77,97,75,0.04)]">
                <div className={`text-2xl font-black tabular-nums mb-1 ${s.color}`}>{s.value}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-surface-low rounded-[2rem] overflow-hidden border border-outline-variant/10 shadow-[0_20px_40px_rgba(77,97,75,0.06)]">
            <div className="overflow-x-auto">
              <table ref={tableRef} className="w-full min-w-[980px] border-collapse">

                <thead>
                  <tr className="border-b border-outline-variant/15">
                    {[
                      { label: '#',                                           cls: 'w-10 pl-6' },
                      { label: 'Date',                                        cls: 'px-3' },
                      { label: 'Type  ←/→',                                  cls: 'px-3' },
                      { label: 'Payee / Note',                               cls: 'px-3' },
                      { label: 'Category / Accounts',                        cls: 'px-3' },
                      { label: 'Amount',                                      cls: 'px-3 text-right' },
                      { label: `Balance · ${postAccount?.name || 'Account'}`, cls: 'px-4 text-right' },
                      { label: 'Status',                                      cls: 'px-3' },
                      { label: '',                                            cls: 'w-10 pr-4' },
                    ].map(({ label, cls }) => (
                      <th key={label} className={`py-4 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 text-left select-none ${cls}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {enrichedRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`group border-b border-outline-variant/10 last:border-0 transition-colors duration-75 scroll-mt-24 scroll-mb-28 ${
                        row._status === 'error' ? 'bg-secondary/[0.03]' : idx % 2 === 0 ? 'bg-surface-lowest/20' : ''
                      } hover:bg-primary-fixed/10`}
                    >
                      {/* # */}
                      <td className="pl-6 pr-2 py-3 text-[10px] font-bold text-on-surface-variant/25 select-none">{idx + 1}</td>

                      {/* DATE — col 0: no Up/Down interception (native date nav) */}
                      <td className="px-2 py-3">
                        <input
                          type="date"
                          data-row={idx}
                          data-col={COL.DATE}
                          value={row.date}
                          onChange={e => updateRow(row.id, 'date', e.target.value)}
                          className="bg-transparent outline-none text-xs font-semibold text-on-surface focus:bg-surface-container/60 rounded-lg px-2 py-1.5 transition-colors w-[132px] border border-transparent focus:border-outline-variant/20"
                        />
                      </td>

                      {/* TYPE — col 1: ←/→ cycle type, ↑/↓ navigate rows */}
                      <td className="px-2 py-3">
                        <TypeToggle
                          value={row.type}
                          onChange={t => handleTypeChange(row.id, t)}
                          onArrow={e => handleArrowKey(e, idx, COL.TYPE)}
                          dataRow={idx}
                          dataCol={COL.TYPE}
                        />
                      </td>

                      {/* NOTE — col 2: ↑/↓ navigate rows, ←/→ at boundary navigate cols */}
                      <td className="px-2 py-3">
                        <input
                          type="text"
                          data-row={idx}
                          data-col={COL.NOTE}
                          placeholder="Payee or note…"
                          value={row.note}
                          onChange={e => updateRow(row.id, 'note', e.target.value)}
                          onKeyDown={e => handleArrowKey(e, idx, COL.NOTE)}
                          className="bg-transparent outline-none text-xs font-medium text-on-surface placeholder:text-on-surface-variant/20 focus:bg-surface-container/60 rounded-lg px-2 py-1.5 transition-colors w-full min-w-[140px] border border-transparent focus:border-outline-variant/20"
                        />
                      </td>

                      {/* DETAIL (category or transfer) — col 3 */}
                      <td className="px-2 py-3">
                        {row.type === 'transfer' ? (
                          <TransferAccounts
                            fromId={row.from_account_id}
                            toId={row.to_account_id}
                            onFromChange={v => updateRow(row.id, 'from_account_id', v)}
                            onToChange={v => updateRow(row.id, 'to_account_id', v)}
                            accounts={accounts}
                            dataRow={idx}
                            onArrow={e => handleArrowKey(e, idx, COL.DETAIL)}
                          />
                        ) : (
                          <CellCategoryPicker
                            value={row.category_id}
                            onChange={v => updateRow(row.id, 'category_id', v)}
                            categories={categories}
                            type={row.type}
                            onArrow={e => handleArrowKey(e, idx, COL.DETAIL)}
                            dataRow={idx}
                            dataCol={COL.DETAIL}
                          />
                        )}
                      </td>

                      {/* AMOUNT — col 4: ↑/↓ native number, ← at boundary → col 3 */}
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-0.5 focus-within:bg-surface-container/60 rounded-lg px-2 py-1.5 transition-colors border border-transparent focus-within:border-outline-variant/20">
                          <span className={`text-[11px] font-black select-none mr-0.5 ${
                            row.type === 'income' ? 'text-primary/60' :
                            row.type === 'expense' ? 'text-secondary/60' : 'text-on-surface-variant/25'
                          }`}>
                            {row.type === 'income' ? '+' : row.type === 'expense' ? '−' : '⇄'}
                          </span>
                          <span className="text-on-surface-variant/25 text-[11px] font-bold select-none">{currencySymbol}</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            data-row={idx}
                            data-col={COL.AMOUNT}
                            value={row.amount}
                            onChange={e => updateRow(row.id, 'amount', e.target.value)}
                            onKeyDown={e => handleAmountKeyDown(e, idx)}
                            className={`bg-transparent outline-none text-xs font-black text-right w-[80px] tabular-nums placeholder:text-on-surface-variant/20 ${
                              row.type === 'income' ? 'text-primary' :
                              row.type === 'expense' ? 'text-secondary' : 'text-on-surface'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Running balance */}
                      <td className="px-4 py-3 text-right">
                        {row.type === 'transfer' && row._delta === 0 ? (
                          <span className="text-[10px] text-on-surface-variant/30 font-bold">—</span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-black tabular-nums ${row._runningBalance >= 0 ? 'text-primary' : 'text-secondary'}`}>
                              {fmt(row._runningBalance)}
                            </span>
                            {row._delta !== 0 && (
                              <span className={`text-[9px] font-bold tabular-nums mt-0.5 ${row._delta > 0 ? 'text-primary/50' : 'text-secondary/50'}`}>
                                {fmtDelta(row._delta)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3"><StatusBadge status={row._status} /></td>

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
              <button
                type="button"
                onClick={addRowAndFocus}
                className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                Add row
              </button>

              <div className="flex items-center gap-4">
                {[
                  { keys: ['↑','↓'],        hint: 'Move rows' },
                  { keys: ['←','→'],        hint: 'Move cols / cycle type' },
                  { keys: ['Tab'],          hint: 'Next cell' },
                  { keys: ['↓'],            hint: 'New row at end' },
                ].map(({ keys, hint }, i) => (
                  <span key={i} className="flex items-center gap-1 text-[9px] text-on-surface-variant/25">
                    {keys.map(k => (
                      <kbd key={k} className="px-1.5 py-0.5 bg-surface-container rounded text-[9px] font-mono border border-outline-variant/20 text-on-surface-variant/40">{k}</kbd>
                    ))}
                    <span className="ml-0.5">{hint}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Balance info */}
          <div className="flex items-center gap-2 text-xs text-on-surface-variant/35 px-2 pb-4">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>
              Running balance anchors to{' '}
              <strong className="text-on-surface-variant/60">{postAccount?.name || '…'}</strong>
              {' '}current balance:{' '}
              <strong className={accountCurrentBalance >= 0 ? 'text-primary/70' : 'text-secondary/70'}>
                {fmt(accountCurrentBalance)}
              </strong>
              . Transfers not involving this account show —.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BulkImport;
