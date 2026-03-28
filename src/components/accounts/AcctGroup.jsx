import React from 'react';
import { ACCT_META } from '../../constants';

const AcctGroup = ({ title, accts, accountBalances, currencySymbol, onDelete, onEdit, onSetDefault, defaultAccountId }) => accts.length === 0 ? null : (
  <div className="space-y-4 mb-8">
    <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase px-2">{title}</p>
    <div className="bg-surface-low rounded-[2rem] border border-outline-variant/10 overflow-hidden divide-y divide-white/5 shadow-xl">
      {accts.map(acc => {
        const bal = accountBalances[acc.id] || 0;
        const isDefault = acc.id === defaultAccountId;
        return (
          <div key={acc.id} className="p-6 flex items-center justify-between group hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-zinc-400 group-hover:text-[#3fff8b] transition-colors border border-white/5">
                <span className="material-symbols-outlined">{ACCT_META[acc.type || 'asset']?.icon || 'account_balance'}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white tracking-tight">{acc.name}</p>
                  {isDefault && <span className="text-[8px] font-black bg-[#3fff8b] text-[#005d2c] px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Default</span>}
                </div>
                <p className={`text-xs font-bold font-headline mt-0.5 ${bal < 0 ? 'text-[#ff716c]' : 'text-[#3fff8b]'}`}>
                  {currencySymbol}{bal.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isDefault && (
                <button className="text-[10px] font-bold text-zinc-500 hover:text-[#3fff8b] uppercase tracking-widest transition-colors mr-2" onClick={() => onSetDefault(acc.id)}>Set Default</button>
              )}
              <button className="p-2 text-zinc-500 hover:text-[#3fff8b] transition-colors" onClick={() => onEdit(acc)}>
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
              {!isDefault && (
                <button className="p-2 text-zinc-500 hover:text-[#ff716c] transition-colors" onClick={() => onDelete(acc.id)}>
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default AcctGroup;
