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
  const allVisibleIds = filteredLedger.filter(t => !t.transfer_id).map(t => t.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedTxIds.has(id));
  
  const toggleTx = (id) => setSelectedTxIds(prev => { 
    const next = new Set(prev); 
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
      {/* Sticky controls — sticks to top of .page-content scroll container */}
      <div className="bg-surface sticky top-0 z-[40] px-6 py-8 space-y-10 border-b border-outline-variant/10">
        <div className="flex justify-between items-center">
          <h2 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase">Vault Stream</h2>
          <div className="flex items-center gap-2">
            <button
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${bulkSelectMode ? 'bg-on-surface text-surface border-on-surface shadow-xl' : 'bg-surface-low text-on-surface-variant border-outline-variant hover:text-on-surface'}`}
              onClick={() => bulkSelectMode ? exitBulk() : setBulkSelectMode(true)}
            >
              <span className="material-symbols-outlined text-[14px]">{bulkSelectMode ? 'close' : 'checklist'}</span>
              {bulkSelectMode ? 'Exit' : 'Select'}
            </button>
            <button 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${showAdvancedFilters ? 'bg-on-surface text-surface border-on-surface shadow-xl' : 'bg-surface-low text-on-surface-variant border-outline-variant hover:text-on-surface'}`} 
              onClick={() => setShowFilters(!showAdvancedFilters)}
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
              {activeFiltersCount > 0 ? `Filters (${activeFiltersCount})` : 'Refine'}
            </button>
          </div>
        </div>

        <div className="relative group max-w-3xl">
          <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors opacity-40">search</span>
          <input 
            type="text" 
            placeholder="Search entries, tags, or payees..." 
            className="w-full bg-transparent border-none pl-8 pr-4 py-2 text-sm font-medium focus:outline-none text-on-surface placeholder:text-on-surface-variant/40 transition-all" 
            value={filterOptions.searchTerm} 
            onChange={(e) => updateFilter('searchTerm', e.target.value)} 
          />
          <div className="absolute bottom-0 left-0 w-full h-px bg-outline-variant/20 group-focus-within:bg-primary/40 transition-all"></div>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex gap-2">
            {[{ p: 'all', label: 'All Time' }, { p: 'today', label: 'Today' }, { p: 'this_week', label: 'Week' }, { p: 'this_month', label: 'Month' }, { p: 'last_3m', label: 'Quarter' }].map(({ p, label }) => (
              <button 
                key={p} 
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all ${filterOptions.preset === p ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:text-on-surface'}`} 
                onClick={() => applyDatePreset(p)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="h-3 w-px bg-outline-variant/30 shrink-0"></div>
          <div className="flex gap-2">
            {[{ key: 'date_desc', label: 'Recent' }, { key: 'amount_desc', label: 'Highest' }].map(s => (
              <button 
                key={s.key} 
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all ${ledgerSort === s.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-on-surface-variant hover:text-on-surface'}`} 
                onClick={() => setLedgerSort(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {showAdvancedFilters && (<FilterPanel categories={categories} tags={tags} accounts={accounts} filterOptions={filterOptions} onUpdateFilter={updateFilter} onResetFilters={resetFilters} />)}
        
        {bulkSelectMode && (
          <div className="flex items-center justify-between px-6 py-4 bg-on-surface text-surface rounded-3xl shadow-2xl slide-up">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${allSelected ? 'bg-surface border-surface' : 'border-surface/30 group-hover:border-surface'}`}>
                {allSelected && <span className="material-symbols-outlined text-on-surface text-xs font-black">check</span>}
              </div>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="hidden" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Select Visible ({allVisibleIds.length})</span>
            </label>
            {selectedTxIds.size > 0 && <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-surface/10 px-4 py-1.5 rounded-full border border-surface/10">{selectedTxIds.size} Selected</span>}
          </div>
        )}
      </div>

      {/* Scrollable transaction list */}
      <div className="px-6 py-8">
        <div className="flex flex-col gap-4">
          {groupedLedger.map(([date, txs]) => (
            <div key={date} className="flex flex-col gap-2">
              {date !== '__flat__' && (
                <div className="flex items-center gap-4 py-4 sticky top-[240px] bg-[#0e0e0e]/95 backdrop-blur-sm z-30">
                  <span className="text-[10px] font-black tracking-[0.3em] text-zinc-600 uppercase">{formatGroupDate(date)}</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-zinc-800/50 to-transparent"></div>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {txs.map(t => (
                  <TransactionItem 
                    key={t.id} 
                    t={t} 
                    onClick={openEditTransaction}
                    onDelete={handleDeleteTransaction}
                    accounts={accounts} 
                    categories={categories} 
                    currencySymbol={currencySymbol}
                    isSelected={selectedTxIds.has(t.id)}
                    bulkSelectMode={bulkSelectMode}
                    onToggleSelect={toggleTx}
                  />
                ))}
              </div>
            </div>
          ))}
          {filteredLedger.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 bg-surface-low rounded-[3rem] border border-dashed border-white/5 mx-2">
              <div className="w-16 h-16 rounded-[2rem] bg-[#1a1a1a] flex items-center justify-center text-zinc-800">
                <span className="material-symbols-outlined text-4xl">history</span>
              </div>
              <p className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest">End of transaction stream</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bulk-action bar */}
      {bulkSelectMode && selectedTxIds.size > 0 && (
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
              onClick={bulkCategory ? handleBulkAssignCategory : undefined}
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
