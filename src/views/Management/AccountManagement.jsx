import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { PageShell } from '../../components/layout';
import CustomDropdown from '../../components/CustomDropdown';
import { CURRENCY_SYMBOLS, ACCT_META } from '../../constants';

const ManagedAcctGroup = ({ title, accts, accountBalances, currencySymbol, onDelete, onEdit, defaultAccountId }) => 
  accts.length === 0 ? null : (
    <div className="space-y-6">
      <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">{title}</p>
      <div className="bg-surface-low rounded-[3rem] border border-outline-variant shadow-sm overflow-hidden divide-y divide-outline-variant/10">
        {accts.map(acc => {
          const bal = accountBalances[acc.id] || 0;
          const isDefault = acc.id === defaultAccountId;
          return (
            <div key={acc.id} className="p-8 flex items-center justify-between group hover:bg-on-surface/[0.02] transition-colors">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors border border-outline-variant/5 shadow-inner">
                  <span className="material-symbols-outlined text-[24px]">{ACCT_META[acc.type || 'asset']?.icon || 'account_balance'}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-on-surface">{acc.name}</p>
                    {isDefault && <span className="text-[9px] font-black bg-accent text-surface px-2 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm shadow-accent/20">Default</span>}
                    {acc.exclude_from_total && <span className="text-[9px] font-black bg-on-surface/[0.05] text-on-surface-variant px-2 py-0.5 rounded-sm uppercase tracking-tighter">Excluded</span>}
                  </div>
                  <p className={`text-sm font-bold font-headline ${bal < 0 ? 'text-error' : 'text-accent'}`}>
                    <span className="text-[10px] opacity-40 mr-0.5 font-medium">{currencySymbol}</span>
                    {bal.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-on-surface-variant hover:text-on-surface transition-colors" onClick={() => onEdit(acc)}>
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                {!isDefault && (
                  <button className="p-2 text-on-surface-variant hover:text-error transition-colors" onClick={() => onDelete(acc.id)}>
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

export default function AccountManagement({
  accounts,
  accountBalances,
  currencySymbol,
  defaultAccountId,
  handleSetDefaultAccount,
  handleCreateAccount,
  handleDeleteAccount,
  handleUpdateAccount,
  setView,
  newAccountName,
  setNewAccountName,
  newAccountBalance,
  setNewAccountBalance,
  newAccountType,
  setNewAccountType,
  newAccountExclude,
  setNewAccountExclude,
  editingAccount,
  setEditingAccount,
  editAcctName,
  setEditAcctName,
  editAcctMode,
  setEditAcctMode,
  editAcctValue,
  setEditAcctValue,
  editAcctExclude,
  setEditAcctExclude,
  openEditAccount,
  shellProps
}) {
  const assetAccts = accounts.filter(a => (a.type || 'asset') === 'asset');
  const liabilityAccts = accounts.filter(a => a.type === 'liability');
  const tempAccts = accounts.filter(a => a.type === 'temp');
  
  const editAcctCurrentBalance = editingAccount
    ? (() => {
      const txSum = (accountBalances[editingAccount.id] || 0) - (parseFloat(editingAccount.initial_balance) || 0);
      return editAcctMode === 'opening' ? txSum + (parseFloat(editAcctValue) || 0) : parseFloat(editAcctValue) || 0;
    })()
    : 0;

  const editAcctDerivedOpening = editingAccount && editAcctMode === 'current'
    ? (() => {
      const txSum = (accountBalances[editingAccount.id] || 0) - (parseFloat(editingAccount.initial_balance) || 0);
      return (parseFloat(editAcctValue) || 0) - txSum;
    })()
    : null;

  const acctEditModal = editingAccount ? createPortal(
    <div className="modal-overlay" onClick={() => setEditingAccount(null)}>
      <div className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant w-full max-w-md slide-up space-y-10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-headline text-2xl font-black text-on-surface uppercase tracking-tight">Modify Vault</h3>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors hover:bg-on-surface/[0.05]" onClick={() => setEditingAccount(null)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleUpdateAccount} className="space-y-8">
          <div className="space-y-3">
            <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Identity</p>
            <input 
              type="text" 
              className="w-full bg-surface-lowest border border-outline-variant rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-primary/10 transition-all text-sm font-bold outline-none"
              value={editAcctName} 
              onChange={e => setEditAcctName(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Calculation Mode</p>
            <div className="flex bg-surface-lowest p-1.5 rounded-2xl gap-1 border border-outline-variant">
              <button type="button" className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editAcctMode === 'opening' ? 'bg-on-surface text-surface shadow-lg scale-[1.02]' : 'text-on-surface-variant hover:text-on-surface'}`} onClick={() => { setEditAcctMode('opening'); setEditAcctValue(String(parseFloat(editingAccount.initial_balance) || 0)); }}>Opening</button>
              <button type="button" className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editAcctMode === 'current' ? 'bg-on-surface text-surface shadow-lg scale-[1.02]' : 'text-on-surface-variant hover:text-on-surface'}`} onClick={() => { setEditAcctMode('current'); setEditAcctValue(String(accountBalances[editingAccount.id] || 0)); }}>Current</button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">{editAcctMode === 'opening' ? 'Initial Unit Value' : 'Current Unit Value'}</p>
            <input 
              type="number" 
              step="0.01" 
              className="w-full bg-surface-lowest border border-outline-variant rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-primary/10 transition-all text-sm font-bold outline-none"
              value={editAcctValue} 
              onChange={e => setEditAcctValue(e.target.value)} 
              required 
            />
          </div>

          <div className="p-6 bg-surface-lowest rounded-2xl border border-outline-variant space-y-2">
            <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-40">
              {editAcctMode === 'opening' ? 'Projected Current' : 'Calculated Opening'}
            </p>
            <p className="text-xl font-black text-on-surface font-headline tracking-tight">
              <span className="text-xs opacity-30 mr-1 font-bold">{currencySymbol}</span>
              {editAcctMode === 'opening' ? editAcctCurrentBalance.toLocaleString() : editAcctDerivedOpening?.toLocaleString()}
            </p>
          </div>

          <button 
            className="flex items-center gap-4 w-full py-2 group cursor-pointer"
            type="button"
            onClick={() => setEditAcctExclude(!editAcctExclude)}
          >
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editAcctExclude ? 'bg-on-surface border-on-surface' : 'border-outline-variant group-hover:border-on-surface-variant'}`}>
              {editAcctExclude && <span className="material-symbols-outlined text-surface text-sm font-black">check</span>}
            </div>
            <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest group-hover:text-on-surface transition-colors">Exclude from Total Wealth</span>
          </button>

          <div className="flex gap-4 pt-6">
            <button type="submit" className="flex-1 bg-on-surface text-surface py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] active:scale-[0.98] transition-all shadow-xl">Commit Updates</button>
            <button type="button" className="px-8 text-on-surface-variant font-black text-[11px] uppercase tracking-[0.2em] hover:text-on-surface" onClick={() => setEditingAccount(null)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <PageShell {...shellProps}>
      <div className="page-inner max-w-2xl mx-auto space-y-12 pb-32 pt-4 md:pt-0 px-6">
        <div className="flex items-center gap-5 px-2">
          <button className="w-12 h-12 rounded-2xl bg-surface-low border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.05] transition-all" onClick={() => setView('settings')}>
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h2 className="font-headline text-4xl font-black tracking-tight text-accent uppercase">Accounts</h2>
        </div>

        <div className="space-y-12 fade-in">
          <div className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant shadow-2xl space-y-8 relative overflow-hidden group">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase ml-1 opacity-60">Primary Spending Account</p>
            <CustomDropdown
              options={accounts.map(a => ({ value: a.id, label: a.name, icon: ACCT_META[a.type || 'asset']?.icon || 'account_balance' }))}
              value={defaultAccountId}
              onChange={handleSetDefaultAccount}
              placeholder="Assign Core Account"
            />
            <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 opacity-40">
              Pre-selected for all new transactions.
            </p>
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-accent/10 transition-all duration-700"></div>
          </div>

          <ManagedAcctGroup title="Asset Accounts" accts={assetAccts} accountBalances={accountBalances} currencySymbol={currencySymbol} onDelete={handleDeleteAccount} onEdit={openEditAccount} defaultAccountId={defaultAccountId} />
          <ManagedAcctGroup title="Liability Accounts" accts={liabilityAccts} accountBalances={accountBalances} currencySymbol={currencySymbol} onDelete={handleDeleteAccount} onEdit={openEditAccount} defaultAccountId={defaultAccountId} />
          <ManagedAcctGroup title="Transit / Temp" accts={tempAccts} accountBalances={accountBalances} currencySymbol={currencySymbol} onDelete={handleDeleteAccount} onEdit={openEditAccount} defaultAccountId={defaultAccountId} />

          <section className="space-y-6 pt-10">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">Register New Entity</p>
            <form onSubmit={handleCreateAccount} className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant shadow-2xl space-y-8 relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Entity Name</p>
                  <input type="text" placeholder="e.g. Primary Savings" className="w-full bg-surface-lowest border border-outline-variant rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-primary/10 transition-all text-sm font-bold outline-none placeholder:text-on-surface-variant/20" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} required />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Initial Balance</p>
                  <input type="number" step="0.01" placeholder="0.00" className="w-full bg-surface-lowest border border-outline-variant rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-primary/10 transition-all text-sm font-bold outline-none placeholder:text-on-surface-variant/20" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} />
                </div>
              </div>
              <CustomDropdown
                label="Classification"
                options={[
                  { value: 'asset', label: 'Asset (Cash, Bank)', icon: 'account_balance' },
                  { value: 'liability', label: 'Liability (Credit, Loan)', icon: 'credit_card' },
                  { value: 'temp', label: 'Transit / Temporary', icon: 'schedule' }
                ]}
                value={newAccountType}
                onChange={v => {
                  setNewAccountType(v);
                  setNewAccountExclude(v !== 'asset');
                }}
              />
              <button 
                className="flex items-center gap-4 py-2 group cursor-pointer"
                type="button"
                onClick={() => setNewAccountExclude(!newAccountExclude)}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${newAccountExclude ? 'bg-on-surface border-on-surface' : 'border-outline-variant group-hover:border-on-surface-variant'}`}>
                  {newAccountExclude && <span className="material-symbols-outlined text-surface text-sm font-black">check</span>}
                </div>
                <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest group-hover:text-on-surface transition-colors">Exclude from Total Wealth</span>
              </button>
              <button type="submit" className="w-full bg-on-surface text-surface py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-[0.98] transition-all hover:brightness-110">Initialize Entity</button>
            </form>
          </section>
        </div>
      </div>
      {acctEditModal}
    </PageShell>
  );
}
