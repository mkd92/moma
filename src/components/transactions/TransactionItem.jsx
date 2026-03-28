import React from 'react';
import { getCategoryIcon } from '../../utils/formatters';

// Transaction item component for consistency
const TransactionItem = ({ t, onClick, onDelete, accounts, categories, currencySymbol, isSelected, bulkSelectMode, onToggleSelect }) => {
  const cat = categories.find(c => c.id === t.category_id);
  const amt = t.amount || 0;
  const isNeg = t.type === 'expense';
  const isTransfer = !!t.transfer_id;
  const icon = isTransfer ? 'sync_alt' : getCategoryIcon(cat?.name || 'Other');
  
  return (
    <div 
      className={`group relative py-6 flex items-center gap-6 cursor-pointer border-b border-outline-variant/10 last:border-0 transition-all active:scale-[0.99]`}
      onClick={() => bulkSelectMode && !isTransfer ? onToggleSelect(t.id) : onClick(t)}
    >
      {bulkSelectMode && !isTransfer && (
        <div 
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-outline-variant group-hover:border-on-surface-variant'}`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(t.id); }}
        >
          {isSelected && <span className="material-symbols-outlined text-on-primary text-xs font-black">check</span>}
        </div>
      )}
      
      <div className="w-10 h-10 rounded-xl bg-on-surface/[0.03] flex items-center justify-center shrink-0 group-hover:bg-on-surface/[0.06] transition-colors text-on-surface-variant group-hover:text-on-surface">
        <span className="material-symbols-outlined text-[20px] font-light">{icon}</span>
      </div>

      <div className="flex-1 min-width-0 flex items-center justify-between gap-4">
        <div className="min-width-0">
          <h3 className="font-bold text-on-surface text-sm tracking-tight truncate group-hover:text-primary transition-colors">
            {t.note || cat?.name || (isTransfer ? 'Internal Transfer' : 'Entry')}
          </h3>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">
            {cat?.name || (isTransfer ? 'Transfer' : 'General')}
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className={`font-headline text-lg font-black tracking-tight ${isNeg ? 'text-on-surface' : 'text-accent'}`}>
            {isTransfer ? '' : (isNeg ? '-' : '+')}
            <span className="opacity-40 text-sm mr-0.5">{currencySymbol}</span>
            {Math.abs(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-tighter mt-1 opacity-40">
            {t.transaction_date || t.created_at?.split('T')[0]}
          </p>
        </div>
      </div>

      {!bulkSelectMode && onDelete && (
        <button 
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-error/5 text-error opacity-0 group-hover:opacity-100 hover:bg-error hover:text-on-primary transition-all flex items-center justify-center shadow-lg"
          onClick={(e) => { e.stopPropagation(); onDelete(t, e); }}
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      )}
    </div>
  );
};

export default TransactionItem;
