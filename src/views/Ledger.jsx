import React from 'react';
import { PageShell } from '../components/layout';
import TransactionItem from '../components/transactions/TransactionItem';
import FilterPanel from '../components/filters/FilterPanel';
import CustomDropdown from '../components/CustomDropdown';
import { formatGroupDate } from '../utils/formatters';

import { useAppDataContext } from '../hooks';

const Ledger = () => {
  const { 
    categories, 
    tags, 
    accounts, 
    filterOptions, 
    ledgerSort, 
    selectedTxIds, 
    bulkCategory, 
    filteredLedger, 
    groupedLedger, 
    currencySymbol, 
    isLoading,
    setShowAdvancedFilters,
    updateFilter, 
    resetFilters, 
    applyDatePreset, 
    setLedgerSort, 
    setBulkSelectMode, 
    setSelectedTxIds, 
    setBulkCategory, 
    openEditTransaction, 
    handleBulkAssignCategory,
    refreshData,
    showAdvancedFilters,
    bulkSelectMode
  } = useAppDataContext();

  const setShowFilters = setShowAdvancedFilters;

  const activeFiltersCount = (filterOptions.type !== 'all' ? 1 : 0) + (filterOptions.dateRange.start ? 1 : 0) + (filterOptions.dateRange.end ? 1 : 0) + filterOptions.categoryIds.length + filterOptions.tagIds.length;
  
  const effectiveSelectedIds = selectedTxIds || new Set();
  const allVisibleIds = filteredLedger.filter(t => !t.transfer_id).map(t => t.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => effectiveSelectedIds.has(id));
  
  const toggleTx = (id) => setSelectedTxIds(prev => { 
    const next = new Set(prev || []); 
    next.has(id) ? next.delete(id) : next.add(id); 
    return next; 
  });
  
  const toggleAll = () => setSelectedTxIds(allSelected ? new Set() : new Set(allVisibleIds));
  
  const exitBulk = () => { 
    setBulkSelectMode(false); 
    setSelectedTxIds(new Set()); 
    setBulkCategory(null); 
  };
  
  const allCatOptions = categories.filter(c => !c.is_system || c.type).map(c => ({ value: c.id, label: c.name, icon: c.icon }));

  const totalBalance = filteredLedger.reduce((acc, t) => {
    const amt = t.amount || 0;
    return t.type === 'expense' ? acc - amt : acc + amt;
  }, 0);

  return (
    <PageShell view="ledger" onRefresh={refreshData} isLoading={isLoading}>
      <div className="flex flex-col min-h-full p-4 sm:p-6 md:p-10 lg:p-14 max-w-7xl mx-auto w-full">
        
        {/* Simplified Professional Header */}
        <section className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-on-surface-variant text-xs uppercase tracking-[0.2em] font-semibold mb-1">Financial Journal</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Transactions</h1>
          </div>
          <div className="bg-surface-low rounded-2xl px-6 py-4 flex items-center gap-6 shadow-sm">
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant mb-0.5 font-bold opacity-60">Net Balance</p>
              <span className="text-2xl font-extrabold text-primary">
                {totalBalance < 0 ? '-' : ''}{currencySymbol}{Math.abs(totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-primary-fixed"></div>
          </div>
        </section>

        {/* Controls */}
        <div className="mb-8 space-y-3">

          {/* Search + action row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search flows..."
                className="w-full bg-surface-lowest rounded-2xl pl-11 pr-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-[0_2px_8px_rgba(77,97,75,0.06)]"
                value={filterOptions.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
              />
            </div>
            <button
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all whitespace-nowrap shadow-[0_2px_8px_rgba(77,97,75,0.06)] ${bulkSelectMode ? 'bg-primary text-on-primary' : 'bg-surface-lowest text-on-surface-variant hover:text-primary'}`}
              onClick={() => bulkSelectMode ? exitBulk() : setBulkSelectMode(true)}
            >
              <span className="material-symbols-outlined text-[18px]">{bulkSelectMode ? 'close' : 'checklist'}</span>
              <span className="hidden sm:inline">Select</span>
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all whitespace-nowrap shadow-[0_2px_8px_rgba(77,97,75,0.06)] ${showAdvancedFilters ? 'bg-primary text-on-primary' : 'bg-surface-lowest text-on-surface-variant hover:text-primary'}`}
              onClick={() => setShowFilters(!showAdvancedFilters)}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span className="hidden sm:inline">{activeFiltersCount > 0 ? `Filter · ${activeFiltersCount}` : 'Filter'}</span>
            </button>
          </div>

          {/* Presets + sort */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-2">
            {/* Date Presets Row */}
            <div className="flex items-center overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 py-1">
              <div className="flex items-center gap-1 bg-surface-lowest rounded-2xl p-1 shadow-[0_2px_8px_rgba(77,97,75,0.06)] shrink-0">
                {[{ p: 'all', label: 'All' }, { p: 'today', label: 'Today' }, { p: 'this_week', label: 'Week' }, { p: 'this_month', label: 'Month' }].map(({ p, label }) => (
                  <button
                    key={p}
                    onClick={() => applyDatePreset(p)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${filterOptions.preset === p ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:block h-5 w-px bg-outline-variant/30 shrink-0" />

            {/* Sort Options Row */}
            <div className="flex items-center overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 py-1">
              <div className="flex items-center gap-1 bg-surface-lowest rounded-2xl p-1 shadow-[0_2px_8px_rgba(77,97,75,0.06)] shrink-0">
                {[{ key: 'date_desc', label: 'Recent', icon: 'schedule' }, { key: 'amount_desc', label: 'Amount', icon: 'sort' }].map(s => (
                  <button
                    key={s.key}
                    onClick={() => setLedgerSort(s.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${ledgerSort === s.key ? 'bg-primary-fixed text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced filters */}
          {showAdvancedFilters && (
            <div className="bg-surface-lowest rounded-[1.75rem] p-6 shadow-[0_4px_16px_rgba(77,97,75,0.08)] fade-in">
              <FilterPanel categories={categories} tags={tags} accounts={accounts} filterOptions={filterOptions} onUpdateFilter={updateFilter} onResetFilters={resetFilters} />
            </div>
          )}

          {/* Bulk select bar */}
          {bulkSelectMode && (
            <div className="flex items-center justify-between px-5 py-3 bg-primary text-on-primary rounded-2xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${allSelected ? 'bg-on-primary/20 border-on-primary/30' : 'border-on-primary/40'}`}>
                  {allSelected && <span className="material-symbols-outlined text-on-primary text-xs">check</span>}
                </div>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="hidden" />
                <span className="text-sm font-medium">Select all</span>
              </label>
              {effectiveSelectedIds.size > 0 && (
                <span className="text-sm font-semibold bg-on-primary/10 px-4 py-1 rounded-full">
                  {effectiveSelectedIds.size} selected
                </span>
              )}
            </div>
          )}
        </div>

        {/* Ledger Table Section */}
        <div className="bg-surface-low rounded-[2rem] overflow-hidden shadow-sm">
          <div className="flex flex-col">
            {groupedLedger.map(([date, txs]) => (
              <React.Fragment key={date}>
                {date !== '__flat__' && (
                  <div className="flex items-center gap-6 px-8 py-5 sticky top-0 bg-surface-low z-30">
                    <span className="text-[9px] font-black tracking-[0.4em] text-on-surface-variant uppercase opacity-60">{formatGroupDate(date)}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-outline-variant/20 to-transparent"></div>
                  </div>
                )}
                <div className="flex flex-col">
                  {txs.map(t => (
                    <TransactionItem
                      key={t.id}
                      t={t}
                      onClick={openEditTransaction}
                      categories={categories}
                      accounts={accounts}
                      currencySymbol={currencySymbol}
                      isSelected={effectiveSelectedIds.has(t.id)}
                      bulkSelectMode={bulkSelectMode}
                      onToggleSelect={toggleTx}
                    />
                  ))}
                </div>
              </React.Fragment>
            ))}
            {filteredLedger.length === 0 && (
              <div className="py-32 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant opacity-20">
                  <span className="material-symbols-outlined text-4xl font-light">history</span>
                </div>
                <p className="text-on-surface-variant font-bold uppercase text-[9px] tracking-[0.3em] opacity-40">No entries found</p>
              </div>
            )}
          </div>
          
          {/* Table Footer */}
          <div className="px-8 py-5 flex justify-between items-center bg-surface-high/20">
            <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.2em] opacity-50">Showing {filteredLedger.length} entries</p>
            <div className="flex items-center gap-4">
              <button className="material-symbols-outlined text-on-surface-variant hover:text-on-surface disabled:opacity-10 transition-colors" disabled>chevron_left</button>
              <span className="text-[10px] font-bold text-primary px-2">1</span>
              <button className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">chevron_right</button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bulk-action bar */}
      {bulkSelectMode && effectiveSelectedIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-6 fade-in">
          <div className="bg-surface-high/80 backdrop-blur-2xl rounded-3xl p-3 flex items-center gap-3 shadow-2xl">
            <div className="flex-1">
              <CustomDropdown
                options={allCatOptions}
                value={bulkCategory}
                onChange={setBulkCategory}
                placeholder="Batch assign category..."
                showSearch={true}
              />
            </div>
            <button
              className={`px-6 py-3.5 rounded-2xl font-bold text-xs transition-all ${bulkCategory ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-highest text-on-surface-variant/40 opacity-50 cursor-not-allowed'}`}
              onClick={bulkCategory ? async () => {
                try {
                  await handleBulkAssignCategory(bulkCategory, effectiveSelectedIds);
                  exitBulk();
                } catch (err) {
                  console.error('Bulk assignment failed:', err);
                }
              } : undefined}
            >
              Apply
            </button>
            <button className="p-3 text-on-surface-variant hover:text-on-surface transition-colors" onClick={exitBulk}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Ledger;
