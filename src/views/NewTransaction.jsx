import React, { useEffect, useRef, useState } from 'react';
import { PageShell } from '../components/layout';
import CustomDropdown from '../components/CustomDropdown';
import { getCategoryIcon } from '../utils/formatters';
import { useAppDataContext } from '../hooks';

// Local date helpers — avoids UTC midnight timezone shift
const pad = n => String(n).padStart(2, '0');
const toLocalDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const TYPE_CONFIG = {
  expense:  { icon: 'arrow_downward', label: 'Expense',  amountColor: 'text-error',     tabActive: 'bg-error/10 text-error border-error/20' },
  income:   { icon: 'arrow_upward',   label: 'Income',   amountColor: 'text-primary',    tabActive: 'bg-primary/10 text-primary border-primary/20' },
  transfer: { icon: 'sync_alt',       label: 'Transfer', amountColor: 'text-on-surface', tabActive: 'bg-surface-high text-on-surface border-outline-variant/30' },
};

const TX_TYPES = ['expense', 'income', 'transfer'];

const LABEL_STYLE = 'block text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-2';

const NewTransaction = () => {
  const {
    txToEdit, txType, amount, currencySymbol, txDate, note,
    accounts, selectedAccount, currentParents, applicableSubs,
    selectedCategory, selectedSubcategory, parties, selectedParty,
    tags, selectedTags, transferFromAccount, transferToAccount,
    isSubmitting, isLoading, postSaveView,
    resetForm, setView, setTxType, setSelectedCategory, setSelectedSubcategory,
    setAmount, setTxDate, setNote, setSelectedAccount, setSelectedParty,
    setSelectedTags, setTransferFromAccount, setTransferToAccount,
    handleTransaction, handleDeleteTransaction: onDelete, refreshData,
  } = useAppDataContext();

  const isEditing = !!txToEdit;

  const noteInputRef  = useRef(null);
  const amountInputRef = useRef(null);
  const dateInputRef  = useRef(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [amountError, setAmountError]             = useState('');
  const [showHints, setShowHints]                 = useState(false);

  // Recompute each render to handle midnight rollover
  const todayStr     = toLocalDate(new Date());
  const yesterdayD   = new Date(); yesterdayD.setDate(yesterdayD.getDate() - 1);
  const yesterdayStr = toLocalDate(yesterdayD);
  const isToday      = txDate === todayStr;
  const isYesterday  = txDate === yesterdayStr;
  const isCustomDate = !isToday && !isYesterday;
  const formattedCustomDate = isCustomDate && txDate
    ? new Date(txDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const typeConfig = TYPE_CONFIG[txType] || TYPE_CONFIG.expense;

  // Focus note field on new entry
  useEffect(() => {
    if (!isEditing) {
      const t = setTimeout(() => noteInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === 's' && (e.ctrlKey || e.metaKey)) || (e.altKey && e.key === 'Enter')) {
        e.preventDefault(); handleTransaction(); return;
      }
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const idx  = TX_TYPES.indexOf(txType);
        const next = e.key === 'ArrowRight'
          ? (idx + 1) % TX_TYPES.length
          : (idx + TX_TYPES.length - 1) % TX_TYPES.length;
        setTxType(TX_TYPES[next]);
        setSelectedCategory(null); setSelectedSubcategory(null);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleTransaction, txType, setTxType, setSelectedCategory, setSelectedSubcategory]);

  const doDelete = () => { onDelete(txToEdit); resetForm(); setView('ledger'); };

  const handleCancel = () => {
    resetForm();
    setView(isEditing ? (postSaveView || 'ledger') : 'dashboard');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setAmountError('Enter an amount greater than zero.');
      amountInputRef.current?.focus();
      return;
    }
    setAmountError('');
    handleTransaction();
  };

  const handleTypeChange = (t) => {
    setTxType(t); setSelectedCategory(null); setSelectedSubcategory(null);
  };

  // Category options
  const categoryOptions = currentParents.flatMap(p => [
    { value: p.id, label: p.name, icon: getCategoryIcon(p.name), isParent: true },
    ...applicableSubs
      .filter(s => s.parent_id === p.id)
      .map(s => ({ value: s.id, label: s.name, icon: getCategoryIcon(s.name), indent: true, parentId: p.id }))
  ]);
  const activeCategoryValue = selectedSubcategory || selectedCategory;
  const handleCategoryChange = (id) => {
    const sub = applicableSubs.find(s => s.id === id);
    if (sub) { setSelectedCategory(sub.parent_id); setSelectedSubcategory(id); }
    else      { setSelectedCategory(id); setSelectedSubcategory(null); }
  };

  return (
    <PageShell view="new_transaction" onRefresh={refreshData} isLoading={isLoading}>

      {/*
        h-full  → fill the scrollable-area exactly (no page-level scroll)
        flex col → stack top / middle / bottom
        overflow-hidden → prevent the outer shell from growing
      */}
      <div className="h-full flex flex-col overflow-hidden max-w-lg mx-auto w-full px-4">

        {/* ── BACK HEADER (shrink-0) ──────────────────────────────── */}
        <div className="shrink-0 flex items-center gap-3 pt-4 pb-3">
          <button
            type="button"
            aria-label="Go back"
            onClick={handleCancel}
            className="w-9 h-9 rounded-2xl bg-surface-low flex items-center justify-center text-on-surface-variant hover:bg-surface-high hover:text-on-surface transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-on-surface tracking-tight">
            {isEditing ? 'Edit Entry' : 'New Entry'}
          </h1>
        </div>

        {/* ── FORM (flex-1 so it fills remaining height) ─────────── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 min-h-0 flex flex-col"
        >

          {/* ── TYPE TABS (shrink-0) ──────────────────────────────── */}
          <div className="shrink-0 grid grid-cols-3 gap-2 mb-3">
            {TX_TYPES.map(t => {
              const cfg = TYPE_CONFIG[t];
              const isActive = txType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                    isActive
                      ? cfg.tabActive
                      : 'border-transparent bg-surface-low text-on-surface-variant hover:bg-surface-high hover:text-on-surface'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1,'wght' 500" : "'FILL' 0,'wght' 400" }}
                  >
                    {cfg.icon}
                  </span>
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* ── AMOUNT HERO (shrink-0) ────────────────────────────── */}
          <div className="shrink-0 mb-3">
            <div className="flex items-baseline justify-center gap-1.5">
              <span className={`text-xl font-bold leading-none shrink-0 transition-colors ${amountError ? 'text-error' : 'text-on-surface-variant/25'}`}>
                {currencySymbol}
              </span>
              <input
                ref={amountInputRef}
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); if (amountError) setAmountError(''); }}
                placeholder="0.00"
                inputMode="decimal"
                className={`min-w-0 w-full bg-transparent border-none outline-none font-black tabular-nums text-center
                  text-[2.75rem] leading-none placeholder:text-on-surface-variant/15 transition-colors focus:outline-none
                  ${amountError ? 'text-error' : typeConfig.amountColor}`}
                style={{ caretColor: 'var(--primary)', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
              />
            </div>
            {amountError && (
              <p className="text-error text-xs font-medium text-center mt-1 fade-in">{amountError}</p>
            )}
          </div>

          {/* ── FIELDS CARD (flex-1 — fills all remaining vertical space) */}
          <div className="flex-1 min-h-0 mb-3">
            <div className="h-full bg-surface-lowest rounded-[1.5rem] shadow-[0_2px_16px_rgba(7,16,29,0.07)] overflow-y-auto divide-y divide-outline-variant/10">

              {/* Description */}
              <div className="px-5 py-3">
                <label className={LABEL_STYLE}>
                  {txType === 'income' ? 'What was this from?' : txType === 'transfer' ? 'Note' : 'What was this for?'}
                </label>
                <input
                  ref={noteInputRef}
                  type="text"
                  placeholder={
                    txType === 'income'   ? 'e.g. Client payment, salary…'
                    : txType === 'transfer' ? 'e.g. Monthly rebalance'
                    : 'e.g. Coffee, groceries, rent…'
                  }
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-on-surface text-sm font-medium placeholder:text-on-surface-variant/30 focus:outline-none"
                />
              </div>

              {/* Date */}
              <div className="px-5 py-3">
                <label className={LABEL_STYLE}>Date</label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTxDate(todayStr)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${isToday ? 'bg-primary text-on-primary' : 'bg-surface-low text-on-surface-variant hover:bg-surface-high'}`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxDate(yesterdayStr)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${isYesterday ? 'bg-primary text-on-primary' : 'bg-surface-low text-on-surface-variant hover:bg-surface-high'}`}
                  >
                    Yesterday
                  </button>
                  {isCustomDate && formattedCustomDate && (
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary text-on-primary">
                      {formattedCustomDate}
                    </span>
                  )}
                  {/* Invisible date input wrapped in a label — clicking calendar icon opens native picker */}
                  <label className="relative cursor-pointer inline-flex">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-surface-low text-on-surface-variant hover:bg-surface-high transition-all pointer-events-none">
                      <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                    </div>
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      aria-label="Pick a custom date"
                    />
                  </label>
                </div>
              </div>

              {/* Normal (expense / income) fields */}
              {txType !== 'transfer' ? (
                <>
                  {/* Category */}
                  {currentParents.length > 0 && (
                    <div className="px-5 py-3">
                      <label className={LABEL_STYLE}>Category</label>
                      <CustomDropdown
                        options={categoryOptions}
                        value={activeCategoryValue}
                        onChange={handleCategoryChange}
                        placeholder="Select a category"
                        showSearch={true}
                      />
                    </div>
                  )}

                  {/* Account + Payee */}
                  <div className="px-5 py-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_STYLE}>Account</label>
                      <CustomDropdown
                        options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'account_balance' }))}
                        value={selectedAccount}
                        onChange={setSelectedAccount}
                        placeholder="Account"
                      />
                    </div>
                    <div>
                      <label className={LABEL_STYLE}>
                        {txType === 'income' ? 'From' : 'Payee'}
                        <span className="ml-1 font-normal normal-case tracking-normal opacity-50">(opt.)</span>
                      </label>
                      <CustomDropdown
                        options={[
                          { value: '', label: 'None', icon: 'person_off' },
                          ...parties.map(p => ({ value: p.id, label: p.name, icon: 'storefront' }))
                        ]}
                        value={selectedParty || ''}
                        onChange={v => setSelectedParty(v || null)}
                        placeholder="None"
                        showSearch={true}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="px-5 py-3">
                      <label className={LABEL_STYLE}>Tags</label>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTags(prev =>
                              prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id]
                            )}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                              selectedTags.includes(t.id)
                                ? 'bg-primary text-on-primary'
                                : 'bg-surface-low text-on-surface-variant hover:bg-surface-high'
                            }`}
                          >
                            #{t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Transfer: From → To */
                <div className="px-5 py-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_STYLE}>From</label>
                    <CustomDropdown
                      options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'logout' }))}
                      value={transferFromAccount}
                      onChange={setTransferFromAccount}
                      placeholder="Source"
                    />
                  </div>
                  <div>
                    <label className={LABEL_STYLE}>To</label>
                    <CustomDropdown
                      options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'login' }))}
                      value={transferToAccount}
                      onChange={setTransferToAccount}
                      placeholder="Destination"
                    />
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── ACTIONS (shrink-0, pb clears the BottomNav pill) ──── */}
          <div className="shrink-0 pb-24 space-y-2">

            {/* Save */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary py-3.5 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {isEditing ? 'Save Changes' : 'Save Entry'}
                </>
              )}
            </button>

            {/* Cancel / Delete */}
            <div className="flex items-center justify-center gap-6 py-0.5">
              <button
                type="button"
                onClick={handleCancel}
                className="text-on-surface-variant text-sm font-medium hover:text-on-surface transition-colors"
              >
                Cancel
              </button>

              {isEditing && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-error text-sm font-medium hover:underline transition-colors"
                >
                  Delete entry
                </button>
              )}

              {isEditing && showDeleteConfirm && (
                <div className="flex items-center gap-3 fade-in">
                  <span className="text-error text-xs font-medium">Delete permanently?</span>
                  <button type="button" onClick={doDelete} className="text-error text-xs font-bold underline">Yes</button>
                  <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-on-surface-variant text-xs">No</button>
                </div>
              )}
            </div>

            {/* Keyboard shortcuts — collapsible */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowHints(h => !h)}
                className="flex items-center gap-1 text-[10px] text-on-surface-variant/25 hover:text-on-surface-variant/50 transition-colors"
              >
                <span className="material-symbols-outlined text-[13px]">keyboard</span>
                Keyboard shortcuts
              </button>
              {showHints && (
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 fade-in">
                  {[
                    { keys: ['⌥', 'Enter'], label: 'Save' },
                    { keys: ['⌥', '← →'], label: 'Cycle type' },
                    { keys: ['Tab'], label: 'Next field' },
                    { keys: ['⌥', 'N'], label: 'New entry' },
                  ].map(({ keys, label }) => (
                    <span key={label} className="flex items-center gap-1 text-[10px] text-on-surface-variant/40">
                      {keys.map(k => (
                        <kbd key={k} className="px-1.5 py-0.5 rounded bg-surface-low text-on-surface-variant/50 font-mono text-[9px] border border-outline-variant/20">{k}</kbd>
                      ))}
                      <span className="ml-0.5">{label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>
        </form>
      </div>
    </PageShell>
  );
};

export default NewTransaction;
