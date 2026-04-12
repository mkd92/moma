import React from 'react';

const Section = ({ label, children }) => (
  <div className="space-y-3">
    <p className="text-xs font-semibold text-on-surface-variant">{label}</p>
    {children}
  </div>
);

const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
      active
        ? 'bg-primary text-on-primary'
        : 'bg-surface-low text-on-surface-variant hover:bg-primary-fixed hover:text-primary'
    }`}
  >
    {children}
  </button>
);

const FilterPanel = ({ categories, tags, accounts, filterOptions, onUpdateFilter, onResetFilters }) => {
  const toggleCategory = (id) =>
    onUpdateFilter('categoryIds', filterOptions.categoryIds.includes(id)
      ? filterOptions.categoryIds.filter(x => x !== id)
      : [...filterOptions.categoryIds, id]);

  const toggleTag = (id) =>
    onUpdateFilter('tagIds', filterOptions.tagIds.includes(id)
      ? filterOptions.tagIds.filter(x => x !== id)
      : [...filterOptions.tagIds, id]);

  const toggleAccount = (id) =>
    onUpdateFilter('accountIds', filterOptions.accountIds.includes(id)
      ? filterOptions.accountIds.filter(x => x !== id)
      : [...filterOptions.accountIds, id]);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const hasActiveFilters = filterOptions.categoryIds.length > 0 || filterOptions.tagIds.length > 0 || filterOptions.accountIds.length > 0 || filterOptions.dateRange.start || filterOptions.dateRange.end;

  return (
    <div className="space-y-7 fade-in">

      {/* Type + Date row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section label="Flow type">
          <div className="flex bg-surface-low rounded-2xl p-1 gap-1">
            {['all', 'income', 'expense', 'transfer'].map(t => (
              <button
                key={t}
                onClick={() => onUpdateFilter('type', t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  filterOptions.type === t
                    ? 'bg-surface-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Section>

        <Section label="Date range">
          <div className="flex items-center gap-3">
            <input
              type="date"
              className="flex-1 min-w-0 bg-surface-low border-none rounded-2xl px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-lowest transition-all"
              value={filterOptions.dateRange.start || ''}
              onChange={e => onUpdateFilter('dateRange', { ...filterOptions.dateRange, start: e.target.value })}
            />
            <span className="text-on-surface-variant/40 text-sm shrink-0">→</span>
            <input
              type="date"
              className="flex-1 min-w-0 bg-surface-low border-none rounded-2xl px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-lowest transition-all"
              value={filterOptions.dateRange.end || ''}
              onChange={e => onUpdateFilter('dateRange', { ...filterOptions.dateRange, end: e.target.value })}
            />
          </div>
        </Section>
      </div>

      {/* Accounts */}
      {accounts.length > 0 && (
        <Section label="Accounts">
          <div className="flex flex-wrap gap-2">
            {accounts.map(a => (
              <Chip key={a.id} active={filterOptions.accountIds.includes(a.id)} onClick={() => toggleAccount(a.id)}>
                <span className="material-symbols-outlined text-[14px]">account_balance</span>
                {a.name}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      {/* Categories */}
      {(expenseCategories.length > 0 || incomeCategories.length > 0) && (
        <div className="space-y-5">
          <p className="text-xs font-semibold text-on-surface-variant">Categories</p>

          {expenseCategories.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-on-surface-variant/60 uppercase tracking-widest">Expense</span>
                <div className="flex-1 h-px bg-outline-variant/30" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip active={filterOptions.categoryIds.includes('__uncategorized__')} onClick={() => toggleCategory('__uncategorized__')}>
                  Uncategorized
                </Chip>
                {expenseCategories.map(c => (
                  <Chip key={c.id} active={filterOptions.categoryIds.includes(c.id)} onClick={() => toggleCategory(c.id)}>
                    {c.icon && <span className="material-symbols-outlined text-[14px]">{c.icon}</span>}
                    {c.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {incomeCategories.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-primary/60 uppercase tracking-widest">Income</span>
                <div className="flex-1 h-px bg-primary-fixed" />
              </div>
              <div className="flex flex-wrap gap-2">
                {incomeCategories.map(c => (
                  <Chip key={c.id} active={filterOptions.categoryIds.includes(c.id)} onClick={() => toggleCategory(c.id)}>
                    {c.icon && <span className="material-symbols-outlined text-[14px]">{c.icon}</span>}
                    {c.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <Section label="Tags">
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <Chip key={t.id} active={filterOptions.tagIds.includes(t.id)} onClick={() => toggleTag(t.id)}>
                <span className="opacity-50">#</span>{t.name}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      {/* Clear */}
      {hasActiveFilters && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-error transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
