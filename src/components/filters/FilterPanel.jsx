import React from 'react';

const FilterPanel = ({ categories, tags, accounts, filterOptions, onUpdateFilter, onResetFilters }) => {
  const toggleCategory = (id) => onUpdateFilter('categoryIds', filterOptions.categoryIds.includes(id) ? filterOptions.categoryIds.filter(x => x !== id) : [...filterOptions.categoryIds, id]);
  const toggleTag = (id) => onUpdateFilter('tagIds', filterOptions.tagIds.includes(id) ? filterOptions.tagIds.filter(x => x !== id) : [...filterOptions.tagIds, id]);
  const toggleAccount = (id) => onUpdateFilter('accountIds', filterOptions.accountIds.includes(id) ? filterOptions.accountIds.filter(x => x !== id) : [...filterOptions.accountIds, id]);

  return (
    <div className="bg-surface-low p-6 md:p-8 rounded-[2rem] border border-outline-variant/10 shadow-lg space-y-8 fade-in mt-4">
      {/* Top Row: Type & Dates */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <p className="text-[9px] font-black tracking-widest text-on-surface-variant uppercase opacity-60">Type</p>
          <div className="flex bg-on-surface/[0.03] p-1 rounded-xl gap-1 border border-outline-variant/5">
            {['all', 'income', 'expense', 'transfer'].map(t => (
              <button 
                key={t} 
                className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${filterOptions.type === t ? 'bg-on-surface text-surface shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`} 
                onClick={() => onUpdateFilter('type', t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 space-y-3">
          <p className="text-[9px] font-black tracking-widest text-on-surface-variant uppercase opacity-60">Custom Range</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <input 
                type="date" 
                className="w-full bg-on-surface/[0.03] border border-outline-variant/10 rounded-xl px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-on-surface outline-none" 
                value={filterOptions.dateRange.start || ''} 
                onChange={e => onUpdateFilter('dateRange', { ...filterOptions.dateRange, start: e.target.value })} 
              />
            </div>
            <span className="text-on-surface-variant opacity-30 shrink-0">-</span>
            <div className="flex-1 min-w-0">
              <input 
                type="date" 
                className="w-full bg-on-surface/[0.03] border border-outline-variant/10 rounded-xl px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-on-surface outline-none" 
                value={filterOptions.dateRange.end || ''} 
                onChange={e => onUpdateFilter('dateRange', { ...filterOptions.dateRange, end: e.target.value })} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid for Accounts & Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Accounts Column */}
        <div className="space-y-4">
          <p className="text-[9px] font-black tracking-widest text-on-surface-variant uppercase opacity-60">Vault Accounts</p>
          <div className="flex flex-wrap gap-2">
            {accounts.map(a => (
              <button 
                key={a.id} 
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${filterOptions.accountIds.includes(a.id) ? 'bg-on-surface text-surface border-on-surface' : 'bg-transparent text-on-surface-variant border-outline-variant/20 hover:border-on-surface-variant hover:text-on-surface'}`} 
                onClick={() => toggleAccount(a.id)}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Columns (Span 2) */}
        <div className="md:col-span-2 space-y-8">
          {/* Expense Categories */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <p className="text-[9px] font-black tracking-widest text-on-surface-variant uppercase opacity-60 text-error">Expense Flow</p>
              <div className="h-px flex-1 bg-outline-variant/10"></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${filterOptions.categoryIds.includes('__uncategorized__') ? 'bg-on-surface text-surface border-on-surface' : 'bg-transparent text-on-surface-variant border-outline-variant/20 hover:border-on-surface-variant hover:text-on-surface'}`} 
                onClick={() => toggleCategory('__uncategorized__')}
              >
                Uncategorized
              </button>
              {categories.filter(c => c.type === 'expense').map(c => (
                <button 
                  key={c.id} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${filterOptions.categoryIds.includes(c.id) ? 'bg-on-surface text-surface border-on-surface' : 'bg-transparent text-on-surface-variant border-outline-variant/20 hover:border-on-surface-variant hover:text-on-surface'}`} 
                  onClick={() => toggleCategory(c.id)}
                >
                  {c.icon && <span className="material-symbols-outlined text-[12px]">{c.icon}</span>}
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Income Categories */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <p className="text-[9px] font-black tracking-widest text-on-surface-variant uppercase opacity-60 text-accent">Income Flow</p>
              <div className="h-px flex-1 bg-outline-variant/10"></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.filter(c => c.type === 'income').map(c => (
                <button 
                  key={c.id} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${filterOptions.categoryIds.includes(c.id) ? 'bg-on-surface text-surface border-on-surface' : 'bg-transparent text-on-surface-variant border-outline-variant/20 hover:border-on-surface-variant hover:text-on-surface'}`} 
                  onClick={() => toggleCategory(c.id)}
                >
                  {c.icon && <span className="material-symbols-outlined text-[12px]">{c.icon}</span>}
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-black tracking-widest text-on-surface-variant uppercase opacity-60">Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <button 
                key={t.id} 
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${filterOptions.tagIds.includes(t.id) ? 'bg-primary text-on-primary border-primary' : 'bg-transparent text-on-surface-variant border-outline-variant/20 hover:border-on-surface-variant hover:text-on-surface'}`} 
                onClick={() => toggleTag(t.id)}
              >
                #{t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end pt-4 border-t border-outline-variant/10">
        <button 
          className="text-[9px] font-black text-error uppercase tracking-widest hover:opacity-80 transition-opacity" 
          onClick={onResetFilters}
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
