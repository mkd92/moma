import React from 'react';
import { getCategoryIcon } from '../../utils/formatters';

const TransactionItem = ({ t, onClick, categories, accounts, currencySymbol, isSelected, bulkSelectMode, onToggleSelect, runningBalance }) => {
  const cat = categories.find(c => c.id === t.category_id);
  const account = accounts?.find(a => a.id === t.account_id);
  const amt = t.amount || 0;
  const isNeg = t.type === 'expense';
  const isTransfer = !!t.transfer_id;
  const icon = isTransfer ? 'sync_alt' : getCategoryIcon(cat?.name || 'Other');

  const dateStr = t.transaction_date || t.created_at?.split('T')[0];
  const displayDate = dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  return (
    <div
      className="group flex items-center gap-4 px-6 md:px-7 py-5 hover:bg-surface-low cursor-pointer transition-colors"
      onClick={() => bulkSelectMode && !isTransfer ? onToggleSelect(t.id) : onClick(t)}
    >
      {/* Icon / Selector */}
      <div className="shrink-0">
        {bulkSelectMode && !isTransfer ? (
          <div
            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-outline-variant group-hover:border-on-surface-variant'}`}
            onClick={(e) => { e.stopPropagation(); onToggleSelect(t.id); }}
          >
            {isSelected && <span className="material-symbols-outlined text-on-primary text-xs">check</span>}
          </div>
        ) : (
          <div className="w-10 h-10 bg-surface-low rounded-xl flex items-center justify-center group-hover:bg-primary-fixed transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px] transition-colors">{icon}</span>
          </div>
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">
              {t.note || cat?.name || (isTransfer ? 'Internal Transfer' : 'Entry')}
            </p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
              {displayDate}
              <span className="lg:hidden">{cat?.name ? ` · ${cat.name}` : ''}{account?.name ? ` · ${account.name}` : ''}</span>
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className={`text-base font-bold tracking-tight ${isNeg ? 'text-on-surface' : 'text-primary'}`}>
              {isTransfer ? '' : (isNeg ? '−' : '+')}
              <span className="text-xs font-normal opacity-50 mr-0.5">{currencySymbol}</span>
              {Math.abs(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {runningBalance != null && (
              <p className={`text-[10px] font-semibold mt-0.5 ${runningBalance < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                <span className="opacity-50 mr-0.5">{currencySymbol}</span>
                {runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Desktop meta pills */}
      <div className="hidden lg:flex shrink-0 items-center gap-2 justify-end w-48">
        {account?.name && (
          <span className="text-[10px] font-semibold px-3 py-1 bg-surface-low rounded-full text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary transition-all truncate max-w-[90px]">
            {account.name}
          </span>
        )}
        <span className="text-[10px] font-semibold px-3 py-1 bg-surface-low rounded-full text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary transition-all truncate max-w-[90px]">
          {cat?.name || 'General'}
        </span>
      </div>
    </div>
  );
};

export default TransactionItem;
