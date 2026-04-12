import React from 'react';
import { ACCT_META } from '../../constants';

const AcctGroup = ({ title, accts, accountBalances, currencySymbol, onDelete, onEdit, onSetDefault, defaultAccountId }) => accts.length === 0 ? null : (
  <div className="space-y-4 mb-8">
    <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase px-2">{title}</p>
    <div className="bg-surface-low rounded-[2rem] border border-outline-variant/10 overflow-hidden divide-y divide-outline-variant/5 shadow-xl">
      {accts.map(acc => {
        const bal = accountBalances[acc.id] || 0;
        const isDefault = acc.id === defaultAccountId;
        return (
          <div key={acc.id} className="p-6 flex items-center justify-between group hover:bg-on-surface/[0.03] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors border border-outline-variant/5">
                <span className="material-symbols-outlined">{ACCT_META[acc.type || 'asset']?.icon || 'account_balance'}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-on-surface tracking-tight">{acc.name}</p>
                  {isDefault && <span className="text-[8px] font-semibold bg-primary-fixed text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">Default</span>}
                </div>
                <p className={`text-xs font-bold mt-0.5 ${bal < 0 ? 'text-error' : 'text-primary'}`}>
                  {currencySymbol}{bal.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isDefault && (
                <button className="text-[10px] font-bold text-zinc-500 hover:text-primary uppercase tracking-widest transition-colors mr-2" onClick={() => onSetDefault(acc.id)}>Set Default</button>
              )}
              <button className="p-2 text-zinc-500 hover:text-primary transition-colors" onClick={() => onEdit(acc)}>
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
              {!isDefault && (
                <button className="p-2 text-zinc-500 hover:text-error transition-colors" onClick={() => onDelete(acc.id)}>
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
