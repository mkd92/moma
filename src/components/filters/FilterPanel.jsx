import React from 'react';

const FilterPanel = ({ categories, tags, accounts, filterOptions, onUpdateFilter, onResetFilters }) => {
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubs = (pid) => categories.filter(c => c.parent_id === pid);
  
  const toggleCategory = (id) => onUpdateFilter('categoryIds', filterOptions.categoryIds.includes(id) ? filterOptions.categoryIds.filter(x => x !== id) : [...filterOptions.categoryIds, id]);
  const toggleTag = (id) => onUpdateFilter('tagIds', filterOptions.tagIds.includes(id) ? filterOptions.tagIds.filter(x => x !== id) : [...filterOptions.tagIds, id]);
  const toggleAccount = (id) => onUpdateFilter('accountIds', filterOptions.accountIds.includes(id) ? filterOptions.accountIds.filter(x => x !== id) : [...filterOptions.accountIds, id]);

  return (
    <div className="bg-surface-low p-8 md:p-12 rounded-[3rem] border border-outline-variant/10 shadow-2xl space-y-12 fade-in mt-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
      {/* Type & Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase ml-1 opacity-60">Entry Type</p>
          <div className="flex bg-on-surface/[0.03] p-1.5 rounded-2xl gap-1 border border-outline-variant/5">
            {['all', 'income', 'expense', 'transfer'].map(t => (
              <button 
                key={t} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterOptions.type === t ? 'bg-on-surface text-surface shadow-xl scale-[1.02]' : 'text-on-surface-variant hover:text-on-surface'}`} 
                onClick={() => onUpdateFilter('type', t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-6">
          <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase ml-1 opacity-60">Time Horizon</p>
          <div className="flex items-center gap-4">
            <input 
              type="date" 
              className="flex-1 bg-on-surface/[0.03] border border-outline-variant/10 rounded-2xl p-4 text-[11px] font-bold uppercase tracking-wider text-on-surface focus:ring-2 focus:ring-on-surface/10 outline-none transition-all" 
              value={filterOptions.dateRange.start || ''} 
              onChange={e => onUpdateFilter('dateRange', { ...filterOptions.dateRange, start: e.target.value })} 
            />
            <span className="text-on-surface-variant opacity-20 font-light">/</span>
            <input 
              type="date" 
              className="flex-1 bg-on-surface/[0.03] border border-outline-variant/10 rounded-2xl p-4 text-[11px] font-bold uppercase tracking-wider text-on-surface focus:ring-2 focus:ring-on-surface/10 outline-none transition-all" 
              value={filterOptions.dateRange.end || ''} 
              onChange={e => onUpdateFilter('dateRange', { ...filterOptions.dateRange, end: e.target.value })} 
            />
          </div>
        </div>
      </div>

      {/* Account Selection */}
      <div className="space-y-6">
        <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase ml-1 opacity-60">Vault Accounts</p>
        <div className="flex flex-wrap gap-3">
          {accounts.map(a => (
            <button 
              key={a.id} 
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${filterOptions.accountIds.includes(a.id) ? 'bg-on-surface text-surface border-on-surface shadow-lg' : 'bg-transparent text-on-surface-variant border-outline-variant/20 hover:border-on-surface-variant hover:text-on-surface'}`} 
              onClick={() => toggleAccount(a.id)}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category Hierarchy - Architectural Tiered List */}
      <div className="space-y-8">
        <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase ml-1 opacity-60">Categories</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
          {/* Uncategorized Special Case */}
          <div className="space-y-4">
            <button 
              className={`w-full py-3 px-4 rounded-xl text-left transition-all flex items-center gap-3 ${filterOptions.categoryIds.includes('__uncategorized__') ? 'bg-on-surface text-surface font-black shadow-lg' : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.03]'}`} 
              onClick={() => toggleCategory('__uncategorized__')}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Uncategorized</span>
            </button>
          </div>

          {parentCategories.map(parent => {
            const subs = getSubs(parent.id);
            const isParentSelected = filterOptions.categoryIds.includes(parent.id);
            return (
              <div key={parent.id} className="space-y-4">
                <button 
                  className={`w-full py-3 px-4 rounded-xl text-left transition-all flex items-center gap-4 group ${isParentSelected ? 'bg-on-surface text-surface font-black shadow-lg' : 'text-on-surface hover:bg-on-surface/[0.03]'}`} 
                  onClick={() => toggleCategory(parent.id)}
                >
                  <span className={`text-lg transition-transform duration-500 ${isParentSelected ? 'scale-110' : 'group-hover:scale-110'}`}>{parent.icon}</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">{parent.name}</span>
                </button>
                
                {/* Refined Subcategories - Tiered Indentation */}
                {subs.length > 0 && (
                  <div className="flex flex-col gap-1 pl-6 border-l border-outline-variant/10 ml-6">
                    {subs.map(sub => {
                      const isSubSelected = filterOptions.categoryIds.includes(sub.id);
                      return (
                        <button 
                          key={sub.id} 
                          className={`w-full py-2 px-4 rounded-lg text-left transition-all flex items-center gap-3 ${isSubSelected ? 'text-primary font-black bg-primary/5' : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-on-surface/[0.02]'}`} 
                          onClick={() => toggleCategory(sub.id)}
                        >
                          <span className={`w-1 h-1 rounded-full bg-current ${isSubSelected ? 'opacity-100' : 'opacity-20'}`}></span>
                          <span className="text-[10px] font-bold uppercase tracking-wider">{sub.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="space-y-6">
          <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase ml-1 opacity-60">Global Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <button 
                key={t.id} 
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${filterOptions.tagIds.includes(t.id) ? 'bg-primary text-on-primary border-primary shadow-lg' : 'bg-transparent text-on-surface-variant border-outline-variant/20 hover:text-on-surface'}`} 
                onClick={() => toggleTag(t.id)}
              >
                #{t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-10 border-t border-outline-variant/10">
        <button 
          className="text-[10px] font-black text-error uppercase tracking-[0.3em] hover:brightness-125 transition-all" 
          onClick={onResetFilters}
        >
          Clear Selection
        </button>
        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.5em] opacity-20">System Matrix</p>
      </div>
    </div>
  );
};

export default FilterPanel;
