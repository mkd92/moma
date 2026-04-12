import React from 'react';
import { PageShell } from '../components/layout';
import CustomDropdown from '../components/CustomDropdown';
import { getCategoryIcon } from '../utils/formatters';
import { useAppDataContext } from '../hooks';

const NewTransaction = () => {
  const {
    txToEdit,
    txType,
    amount,
    currencySymbol,
    txDate,
    note,
    accounts,
    selectedAccount,
    currentParents,
    applicableSubs,
    selectedCategory,
    selectedSubcategory,
    parties,
    selectedParty,
    tags,
    selectedTags,
    transferFromAccount,
    transferToAccount,
    isSubmitting,
    isLoading,
    resetForm,
    setView,
    setTxType,
    setSelectedCategory,
    setSelectedSubcategory,
    setAmount,
    setTxDate,
    setNote,
    setSelectedAccount,
    setSelectedParty,
    setSelectedTags,
    setTransferFromAccount,
    setTransferToAccount,
    handleTransaction,
    handleDeleteTransaction: onDelete,
    refreshData,
    dashTransactions,
    categories
  } = useAppDataContext();

  const isEditing = !!txToEdit;

  const confirmDelete = () => {
    if (window.confirm("Are you sure you want to permanently delete this entry?")) {
      onDelete(txToEdit);
      resetForm();
      setView('ledger');
    }
  };

  const TX_TYPES = ['expense', 'income', 'transfer'];

  const handleGlobalKeyDown = (e) => {
    // Cmd/Ctrl+S or Alt+Enter → save
    if ((e.key === 's' && (e.ctrlKey || e.metaKey)) || (e.altKey && e.key === 'Enter')) {
      e.preventDefault();
      handleTransaction();
      return;
    }
    // Alt+← / Alt+→ → cycle transaction type
    if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const idx = TX_TYPES.indexOf(txType);
      const next = e.key === 'ArrowRight'
        ? (idx + 1) % TX_TYPES.length
        : (idx + TX_TYPES.length - 1) % TX_TYPES.length;
      setTxType(TX_TYPES[next]);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    }
  };

  return (
    <PageShell view="new_transaction" onRefresh={refreshData} isLoading={isLoading}>
      <div
        className="page-inner pb-32 px-4 md:px-8 pt-6 max-w-5xl mx-auto"
        onKeyDown={handleGlobalKeyDown}
      >
        {/* Editorial Header */}
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 text-primary font-semibold mb-4">
            <span className="material-symbols-outlined text-sm">spa</span>
            <span className="text-xs uppercase tracking-widest">Entry Creation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight leading-tight max-w-xl">
            {isEditing ? 'Revise this movement of your funds.' : "Let's record a new movement of your funds."}
          </h1>
          <p className="mt-3 text-on-surface-variant text-base font-normal leading-relaxed">
            Nurture your financial garden by acknowledging every flow.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Main Form */}
          <div className="md:col-span-8 bg-surface-lowest rounded-[2rem] p-8 md:p-10 shadow-[0_20px_40px_rgba(77,97,75,0.08)]">
            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleTransaction(); }}>

              {/* Transaction type selector */}
              <div className="flex bg-surface-low p-1 rounded-2xl gap-1">
                {['expense', 'income', 'transfer'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${txType === t ? 'bg-surface-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                    onClick={() => { setTxType(t); setSelectedCategory(null); setSelectedSubcategory(null); }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Party / Note */}
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2 px-1">Where did this flow to?</label>
                <input
                  type="text"
                  placeholder="e.g. Organic Market"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-surface-low border-none rounded-2xl py-4 px-5 text-on-surface text-base placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 focus:bg-surface-lowest outline-none transition-all"
                />
              </div>

              {/* Date + Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2 px-1">When did it happen?</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-surface-low border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-lowest outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2 px-1">Energy amount</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-bold text-lg">{currencySymbol}</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-surface-low border-none rounded-2xl py-4 pl-10 pr-5 text-on-surface text-xl font-bold focus:ring-2 focus:ring-primary/20 focus:bg-surface-lowest outline-none transition-all"
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              {/* Transfer-specific or normal fields */}
              {txType !== 'transfer' ? (
                <div className="space-y-6">
                  {/* Unified category dropdown */}
                  {currentParents.length > 0 && (() => {
                    const categoryOptions = currentParents.flatMap(p => [
                      { value: p.id, label: p.name, icon: getCategoryIcon(p.name), isParent: true },
                      ...applicableSubs
                        .filter(s => s.parent_id === p.id)
                        .map(s => ({ value: s.id, label: s.name, icon: getCategoryIcon(s.name), indent: true, parentId: p.id }))
                    ]);

                    const activeValue = selectedSubcategory || selectedCategory;

                    const handleCategoryChange = (id) => {
                      const sub = applicableSubs.find(s => s.id === id);
                      if (sub) {
                        setSelectedCategory(sub.parent_id);
                        setSelectedSubcategory(id);
                      } else {
                        setSelectedCategory(id);
                        setSelectedSubcategory(null);
                      }
                    };

                    return (
                      <CustomDropdown
                        label="Category"
                        options={categoryOptions}
                        value={activeValue}
                        onChange={handleCategoryChange}
                        placeholder="Select a category"
                        showSearch={true}
                      />
                    );
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <CustomDropdown
                      label="Account"
                      options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'account_balance' }))}
                      value={selectedAccount}
                      onChange={setSelectedAccount}
                      placeholder="Select Source"
                    />
                    <CustomDropdown
                      label="Payee / Source"
                      options={[{ value: '', label: '— No Attribution —', icon: 'person_off' }, ...parties.map(p => ({ value: p.id, label: p.name, icon: 'storefront' }))]}
                      value={selectedParty || ''}
                      onChange={v => setSelectedParty(v || null)}
                      placeholder="Identify Merchant"
                      showSearch={true}
                    />
                  </div>

                  {tags.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-on-surface-variant px-1">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTags(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${selectedTags.includes(t.id) ? 'bg-primary text-on-primary' : 'bg-surface-low text-on-surface-variant hover:bg-primary-fixed'}`}
                          >
                            #{t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <CustomDropdown label="Source Account" options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'logout' }))} value={transferFromAccount} onChange={setTransferFromAccount} placeholder="From..." />
                  <CustomDropdown label="Destination Account" options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'login' }))} value={transferToAccount} onChange={setTransferToAccount} placeholder="To..." />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full bg-primary text-on-primary py-5 rounded-full text-base font-bold shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  disabled={isSubmitting}
                >
                  <span className="material-symbols-outlined">add_task</span>
                  {isSubmitting ? 'Processing...' : isEditing ? 'Commit Changes' : 'Commit Entry'}
                </button>
                <div className="flex items-center justify-center gap-6">
                  <button type="button" className="text-on-surface-variant font-medium text-sm hover:text-on-surface transition-colors" onClick={() => { resetForm(); setView(isEditing ? 'ledger' : 'dashboard'); }}>
                    Cancel
                  </button>
                  {isEditing && (
                    <button type="button" className="text-error font-medium text-sm hover:underline transition-colors" onClick={confirmDelete}>
                      Delete entry
                    </button>
                  )}
                </div>

                {/* Keyboard shortcuts hint */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1">
                  {[
                    { keys: ['⌥', 'Enter'], label: 'Save' },
                    { keys: ['⌥', '←', '→'], label: 'Cycle type' },
                    { keys: ['Tab'], label: 'Next field' },
                    { keys: ['↑', '↓'], label: 'Navigate' },
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
              </div>
            </form>
          </div>

          {/* Sidebar panel */}
          <aside className="md:col-span-4 space-y-5">
            {/* A Wise Move card */}
            <div className="bg-primary rounded-[2rem] p-7 text-on-primary shadow-xl shadow-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'wght' 200" }}>energy_savings_leaf</span>
              </div>
              <h3 className="text-lg font-bold mb-2">A Wise Move</h3>
              <p className="text-sm opacity-80 leading-relaxed mb-5">Acknowledging every flow has helped countless people save 12% on impulse purchases.</p>
              <div className="h-1.5 w-full bg-primary-container rounded-full overflow-hidden">
                <div className="h-full bg-primary-fixed w-[65%] rounded-full" />
              </div>
              <div className="flex justify-between mt-2 text-xs font-medium opacity-70">
                <span>Mindful Spending</span>
                <span>65%</span>
              </div>
            </div>

            {/* Recent flows */}
            {dashTransactions?.filter(t => !t.transfer_id).slice(0, 3).length > 0 && (
              <div className="bg-surface-low rounded-[2rem] p-7">
                <h4 className="font-bold text-primary mb-5 flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-base">history</span>
                  Recent Roots
                </h4>
                <div className="space-y-5">
                  {dashTransactions.filter(t => !t.transfer_id).slice(0, 3).map(t => {
                    const cat = categories?.find(c => c.id === t.category_id);
                    const isNeg = t.type === 'expense';
                    return (
                      <div key={t.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-lowest flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-[16px]">{getCategoryIcon(cat?.name || 'Other')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{t.note || cat?.name || 'Entry'}</p>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{new Date(t.transaction_date || t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                        <span className={`text-sm font-bold shrink-0 ${isNeg ? 'text-on-surface' : 'text-primary'}`}>
                          {isNeg ? '-' : '+'}{currencySymbol}{Math.abs(t.amount).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inspirational quote */}
            <div className="rounded-[2rem] overflow-hidden bg-primary-fixed p-8 relative">
              <span className="text-5xl absolute top-4 right-6 opacity-20 leading-none text-primary">"</span>
              <p className="text-sm font-medium italic text-primary leading-relaxed relative z-10">
                "Financial peace is not the acquisition of stuff. It's the acquisition of calm."
              </p>
            </div>
          </aside>
        </section>
      </div>
    </PageShell>
  );
};

export default NewTransaction;
