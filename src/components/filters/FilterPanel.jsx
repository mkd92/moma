import React from 'react';
import CustomDropdown from '../CustomDropdown';

const FilterPanel = ({ categories, tags, accounts, filterOptions, onUpdateFilter, onResetFilters }) => {
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubs = (pid) => categories.filter(c => c.parent_id === pid);
  const toggleCategory = (id) => onUpdateFilter('categoryIds', filterOptions.categoryIds.includes(id) ? filterOptions.categoryIds.filter(x => x !== id) : [...filterOptions.categoryIds, id]);
  const toggleTag = (id) => onUpdateFilter('tagIds', filterOptions.tagIds.includes(id) ? filterOptions.tagIds.filter(x => x !== id) : [...filterOptions.tagIds, id]);
  const toggleAccount = (id) => onUpdateFilter('accountIds', filterOptions.accountIds.includes(id) ? filterOptions.accountIds.filter(x => x !== id) : [...filterOptions.accountIds, id]);

  return (
    <div className="bg-surface-low p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl space-y-10 fade-in mt-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Type</p>
          <div className="flex bg-[#0e0e0e] p-1 rounded-xl gap-1 border border-white/5">
            {['all', 'income', 'expense', 'transfer'].map(t => (
              <button key={t} className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filterOptions.type === t ? 'bg-[#3fff8b] text-[#005d2c]' : 'text-zinc-500 hover:text-zinc-300'}`} onClick={() => onUpdateFilter('type', t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Date Range</p>
          <div className="flex items-center gap-3">
            <input type="date" className="flex-1 bg-[#1a1a1a] border-none rounded-xl p-4 text-xs text-white focus:ring-2 focus:ring-[#3fff8b]/20" value={filterOptions.dateRange.start || ''} onChange={e => onUpdateFilter('dateRange', { ...filterOptions.dateRange, start: e.target.value })} />
            <span className="text-zinc-800 font-bold">/</span>
            <input type="date" className="flex-1 bg-[#1a1a1a] border-none rounded-xl p-4 text-xs text-white focus:ring-2 focus:ring-[#3fff8b]/20" value={filterOptions.dateRange.end || ''} onChange={e => onUpdateFilter('dateRange', { ...filterOptions.dateRange, end: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Account Filter</p>
        <div className="flex flex-wrap gap-2">
          {accounts.map(a => (
            <button key={a.id} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${filterOptions.accountIds.includes(a.id) ? 'bg-[#3fff8b] text-[#005d2c] border-[#3fff8b]' : 'bg-surface-container text-zinc-500 border-outline-variant/10 hover:border-[#3fff8b]/30'}`} onClick={() => toggleAccount(a.id)}>{a.name}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Category Hierarchy</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button className={`p-4 rounded-2xl border text-left transition-all ${filterOptions.categoryIds.includes('__uncategorized__') ? 'bg-[#3fff8b]/10 border-[#3fff8b] text-[#3fff8b]' : 'bg-surface-container border-outline-variant/10 text-zinc-500'}`} onClick={() => toggleCategory('__uncategorized__')}>
            <span className="text-xs font-bold uppercase tracking-widest">Uncategorized</span>
          </button>
          {parentCategories.map(parent => (
            <div key={parent.id} className="space-y-2">
              <button className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${filterOptions.categoryIds.includes(parent.id) ? 'bg-[#3fff8b]/10 border-[#3fff8b] text-[#3fff8b]' : 'bg-surface-container border-outline-variant/10 text-zinc-500'}`} onClick={() => toggleCategory(parent.id)}>
                <span className="text-lg">{parent.icon}</span>
                <span className="text-xs font-bold uppercase tracking-widest">{parent.name}</span>
              </button>
              <div className="pl-4 space-y-1">
                {getSubs(parent.id).map(sub => (
                  <button key={sub.id} className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${filterOptions.categoryIds.includes(sub.id) ? 'bg-[#3fff8b]/10 border-[#3fff8b] text-[#3fff8b]' : 'bg-[#0e0e0e]/50 border-white/5 text-zinc-600'}`} onClick={() => toggleCategory(sub.id)}>
                    <span className="text-xs opacity-70">{sub.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <button key={t.id} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${filterOptions.tagIds.includes(t.id) ? 'bg-[#3fff8b] text-[#005d2c] border-[#3fff8b]' : 'bg-surface-container text-zinc-500 border-outline-variant/10 hover:border-[#3fff8b]/30'}`} onClick={() => toggleTag(t.id)}>#{t.name}</button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-6 border-t border-white/5">
        <button className="text-[10px] font-bold text-[#ff716c] uppercase tracking-widest hover:text-[#ff716c]/80 transition-colors" onClick={onResetFilters}>Reset All Engine Filters</button>
        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.3em]">Vault Filter Matrix</p>
      </div>
    </div>
  );
};

export default FilterPanel;
