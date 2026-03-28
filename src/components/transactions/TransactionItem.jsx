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
      className={`active:scale-[0.98] transition-all bg-surface-container p-4 rounded-xl flex items-center gap-4 cursor-pointer border border-outline-variant/10 ${isSelected ? 'ring-2 ring-[#3fff8b] bg-[#3fff8b]/5' : ''}`}
      onClick={() => bulkSelectMode && !isTransfer ? onToggleSelect(t.id) : onClick(t)}
    >
      {bulkSelectMode && !isTransfer && (
        <div 
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#3fff8b] border-[#3fff8b]' : 'border-zinc-700'}`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(t.id); }}
        >
          {isSelected && <span className="material-symbols-outlined text-[#005d2c] text-xs font-bold">check</span>}
        </div>
      )}
      <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[#3fff8b]">{icon}</span>
      </div>
      <div className="flex-1 min-width-0">
        <div className="flex justify-between items-baseline gap-2">
          <h3 className="font-bold text-[#ffffff] text-sm truncate">{t.note || cat?.name || (isTransfer ? 'Transfer' : 'Transaction')}</h3>
          <span className={`font-['Manrope'] font-extrabold whitespace-nowrap ${isNeg ? 'text-[#ff716c]' : 'text-[#3fff8b]'}`}>
            {isTransfer ? '⇄' : (isNeg ? '-' : '+')} {currencySymbol}{Math.abs(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-on-surface-variant truncate">{cat?.name || (isTransfer ? 'Transfer' : 'General')}</p>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-tighter whitespace-nowrap">
              {t.transaction_date || t.created_at?.split('T')[0]}
            </p>
            {!bulkSelectMode && onDelete && (
              <button 
                className="text-zinc-600 hover:text-[#ff716c] transition-colors"
                onClick={(e) => { e.stopPropagation(); onDelete(t, e); }}
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
