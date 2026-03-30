import React from 'react';
import { PageShell } from '../components/layout';
import TransactionItem from '../components/transactions/TransactionItem';
import FilterPanel from '../components/filters/FilterPanel';
import CustomDropdown from '../components/CustomDropdown';
import { formatGroupDate } from '../utils/formatters';

const Ledger = ({ 
  shellProps, 
  categories, 
  tags, 
  accounts, 
  filterOptions, 
  showAdvancedFilters, 
  setShowFilters, 
  updateFilter, 
  resetFilters, 
  applyDatePreset, 
  ledgerSort, 
  setLedgerSort, 
  bulkSelectMode, 
  setBulkSelectMode, 
  selectedTxIds, 
  setSelectedTxIds, 
  bulkCategory, 
  setBulkCategory, 
  filteredLedger, 
  groupedLedger, 
  openEditTransaction, 
  handleDeleteTransaction, 
  currencySymbol, 
  handleBulkAssignCategory 
}) => {
  const activeFiltersCount = (filterOptions.type !== 'all' ? 1 : 0) + (filterOptions.dateRange.start ? 1 : 0) + (filterOptions.dateRange.end ? 1 : 0) + filterOptions.categoryIds.length + filterOptions.tagIds.length;
  
  // Debug log
  console.log('Ledger selectedTxIds:', selectedTxIds);
  
  // Fallback to empty set if undefined
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

  return (
    <PageShell {...shellProps}>
      {/* Content wrapper with extra top padding for mobile to fix 'brown bar' / squishing feel */}
      <div className="flex flex-col min-h-full pt-4 md:pt-0">
        {/* Controls section — now scrolls with the list */}
        <div className="bg-surface px-6 py-8 md:py-10 space-y-8 md:space-y-10 border-b border-outline-variant/10">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-3xl md:text-4xl font-black tracking-tight text-on-surface uppercase">Vault Stream</h2>
            <div className="flex items-center gap-2">
              <button
                className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${bulkSelectMode ? 'bg-on-surface text-surface border-on-surface shadow-xl' : 'bg-surface-low text-on-surface-variant border-outline-variant hover:text-on-surface'}`}
                onClick={() => bulkSelectMode ? exitBulk() : setBulkSelectMode(true)}
              >
                <span className="material-symbols-outlined text-[14px]">{bulkSelectMode ? 'close' : 'checklist'}</span>
                <span className="hidden sm:inline">{bulkSelectMode ? 'Exit' : 'Select'}</span>
              </button>
              <button 
                className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${showAdvancedFilters ? 'bg-on-surface text-surface border-on-surface shadow-xl' : 'bg-surface-low text-on-surface-variant border-outline-variant hover:text-on-surface'}`} 
                onClick={() => setShowFilters(!showAdvancedFilters)}
              >
                <span className="material-symbols-outlined text-[14px]">tune</span>
                <span className="hidden sm:inline">{activeFiltersCount > 0 ? `Filters (${activeFiltersCount})` : 'Refine'}</span>
                {activeFiltersCount > 0 && <span className="sm:hidden">{activeFiltersCount}</span>}
              </button>
            </div>
          </div>

          <div className="relative group max-w-3xl">
            <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors opacity-40">search</span>
            <input 
              type="text" 
              placeholder="Search in vault..." 
              className="w-full bg-transparent border-none pl-8 pr-4 py-2 text-sm font-medium focus:outline-none text-on-surface placeholder:text-on-surface-variant/40 transition-all" 
              value={filterOptions.searchTerm} 
              onChange={(e) => updateFilter('searchTerm', e.target.value)} 
            />
            <div className="absolute bottom-0 left-0 w-full h-px bg-outline-variant/20 group-focus-within:bg-primary/40 transition-all"></div>
          </div>

          <div className="flex items-center gap-4 md:gap-6 overflow-x-auto py-4 -my-4 hide-scrollbar">
            <div className="flex gap-2">
              {[{ p: 'all', label: 'All' }, { p: 'today', label: 'Today' }, { p: 'this_week', label: 'Week' }, { p: 'this_month', label: 'Month' }, { p: 'last_3m', label: '3M' }].map(({ p, label }) => (
                <button 
                  key={p} 
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${filterOptions.preset === p ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:text-on-surface'}`} 
                  onClick={() => applyDatePreset(p)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="h-3 w-px bg-outline-variant/30 shrink-0"></div>
            <div className="flex gap-2">
              {[{ key: 'date_desc', label: 'Recent' }, { key: 'amount_desc', label: 'Value' }].map(s => (
                <button 
                  key={s.key} 
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${ledgerSort === s.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-on-surface-variant hover:text-on-surface'}`} 
                  onClick={() => setLedgerSort(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {showAdvancedFilters && (<FilterPanel categories={categories} tags={tags} accounts={accounts} filterOptions={filterOptions} onUpdateFilter={updateFilter} onResetFilters={resetFilters} />)}
          
          {bulkSelectMode && (
            <div className="flex items-center justify-between px-6 py-4 bg-on-surface text-surface rounded-[2rem] shadow-2xl slide-up">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${allSelected ? 'bg-surface border-surface' : 'border-surface/30 group-hover:border-surface'}`}>
                  {allSelected && <span className="material-symbols-outlined text-on-surface text-xs font-black">check</span>}
                </div>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="hidden" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Select Visible ({allVisibleIds.length})</span>
              </label>
              {effectiveSelectedIds.size > 0 && <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-surface/10 px-4 py-1.5 rounded-full border border-surface/10">{effectiveSelectedIds.size} Selected</span>}
            </div>
          )}
        </div>

        {/* Scrollable transaction list */}
        <div className="px-6 py-10 md:py-12 flex-1">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            {groupedLedger.map(([date, txs]) => (
              <div key={date} className="flex flex-col gap-4">
                {date !== '__flat__' && (
                  <div className="flex items-center gap-6 py-6 sticky top-0 bg-surface/95 backdrop-blur-sm z-30">
                    <span className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase">{formatGroupDate(date)}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-outline-variant/30 to-transparent"></div>
                  </div>
                )}
                <div className="flex flex-col">
                  {txs.map(t => (
                    <TransactionItem 
                      key={t.id} 
                      t={t} 
                      onClick={openEditTransaction}
                      onDelete={handleDeleteTransaction}
                      accounts={accounts} 
                      categories={categories} 
                      currencySymbol={currencySymbol}
                      isSelected={effectiveSelectedIds.has(t.id)}
                      bulkSelectMode={bulkSelectMode}
                      onToggleSelect={toggleTx}
                    />
                  ))}
                </div>
              </div>
            ))}
            {filteredLedger.length === 0 && (
              <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-surface-low rounded-[3rem] border border-dashed border-outline-variant/10">
                <div className="w-20 h-20 rounded-[2.5rem] bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant opacity-20">
                  <span className="material-symbols-outlined text-5xl font-light">history</span>
                </div>
                <p className="text-on-surface-variant font-bold uppercase text-[10px] tracking-[0.3em]">End of Vault Stream</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky bulk-action bar */}
      {bulkSelectMode && effectiveSelectedIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-6 fade-in">
          <div className="bg-[#131313] border border-outline-variant/20 rounded-[2.5rem] p-4 flex items-center gap-4 shadow-[0_32px_64px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            <div className="flex-1">
              <CustomDropdown
                options={allCatOptions}
                value={bulkCategory}
                onChange={setBulkCategory}
                placeholder="Assign group category..."
                showSearch={true}
              />
            </div>
            <button
              className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${bulkCategory ? 'bg-[#3fff8b] text-[#005d2c] shadow-lg shadow-[#3fff8b]/20 scale-105' : 'bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'}`}
              onClick={bulkCategory ? () => handleBulkAssignCategory(bulkCategory, effectiveSelectedIds) : undefined}
            >
              Process
            </button>
            <button className="p-4 text-zinc-500 hover:text-white transition-colors" onClick={exitBulk}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Ledger;
