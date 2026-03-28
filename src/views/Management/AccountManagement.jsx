import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { PageShell } from '../../components/layout';
import CustomDropdown from '../../components/CustomDropdown';
import { CURRENCY_SYMBOLS, ACCT_META } from '../../constants';

const ManagedAcctGroup = ({ title, accts, accountBalances, currencySymbol, onDelete, onEdit, defaultAccountId }) => 
  accts.length === 0 ? null : (
    <div className="space-y-4">
      <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase px-2">{title}</p>
      <div className="bg-surface-low rounded-[2rem] border border-outline-variant/10 overflow-hidden divide-y divide-white/5 shadow-xl">
        {accts.map(acc => {
          const bal = accountBalances[acc.id] || 0;
          const isDefault = acc.id === defaultAccountId;
          return (
            <div key={acc.id} className="p-6 flex items-center justify-between group hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-zinc-400">
                  <span className="material-symbols-outlined">{ACCT_META[acc.type || 'asset']?.icon || 'account_balance'}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{acc.name}</p>
                    {isDefault && <span className="text-[8px] font-black bg-[#3fff8b] text-[#005d2c] px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Default</span>}
                    {acc.exclude_from_net_worth && <span className="text-[8px] font-black bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Excluded</span>}
                  </div>
                  <p className={`text-xs font-bold font-headline mt-0.5 ${bal < 0 ? 'text-[#ff716c]' : 'text-[#3fff8b]'}`}>
                    {currencySymbol}{bal.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <div className="bg-[#131313] p-8 rounded-[2.5rem] border border-outline-variant/10 w-full max-w-md slide-up space-y-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-headline text-2xl font-bold text-white">Edit Account</h3>
          <button className="text-zinc-500 hover:text-white" onClick={() => setEditingAccount(null)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleUpdateAccount} className="space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Account Name</p>
            <input 
              type="text" 
              className="w-full bg-[#1a1a1a] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/30 transition-all text-sm font-medium"
              value={editAcctName} 
              onChange={e => setEditAcctName(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Balance Mode</p>
            <div className="flex bg-[#0e0e0e] p-1 rounded-xl gap-1 border border-white/5">
              <button type="button" className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${editAcctMode === 'opening' ? 'bg-[#3fff8b] text-[#005d2c]' : 'text-zinc-500'}`} onClick={() => { setEditAcctMode('opening'); setEditAcctValue(String(parseFloat(editingAccount.initial_balance) || 0)); }}>Opening</button>
              <button type="button" className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${editAcctMode === 'current' ? 'bg-[#3fff8b] text-[#005d2c]' : 'text-zinc-500'}`} onClick={() => { setEditAcctMode('current'); setEditAcctValue(String(accountBalances[editingAccount.id] || 0)); }}>Current</button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">{editAcctMode === 'opening' ? 'Opening Balance' : 'Current Balance'}</p>
            <input 
              type="number" 
              step="0.01" 
              className="w-full bg-[#1a1a1a] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/30 transition-all text-sm font-medium"
              value={editAcctValue} 
              onChange={e => setEditAcctValue(e.target.value)} 
              required 
            />
          </div>

          <div className="p-4 bg-[#0e0e0e] rounded-xl border border-white/5 space-y-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
              {editAcctMode === 'opening' ? 'Resulting Current' : 'Calculated Opening'}
            </p>
            <p className="text-sm font-bold text-[#3fff8b] font-headline">
              {currencySymbol}{editAcctMode === 'opening' ? editAcctCurrentBalance.toLocaleString() : editAcctDerivedOpening?.toLocaleString()}
            </p>
          </div>

          <button 
            className="flex items-center gap-3 w-full py-2 group cursor-pointer"
            type="button"
            onClick={() => setEditAcctExclude(!editAcctExclude)}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${editAcctExclude ? 'bg-[#ff716c] border-[#ff716c]' : 'border-zinc-700'}`}>
              {editAcctExclude && <span className="material-symbols-outlined text-white text-xs font-black">check</span>}
            </div>
            <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">Exclude from total Net Worth</span>
          </button>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="flex-1 bg-[#3fff8b] text-[#005d2c] py-4 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-all shadow-lg">Save Changes</button>
            <button type="button" className="px-6 text-zinc-500 font-bold text-xs uppercase tracking-widest" onClick={() => setEditingAccount(null)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <PageShell {...shellProps}>
      <div className="page-inner max-w-2xl mx-auto space-y-10 pb-32">
        <div className="flex items-center gap-4 px-2">
          <button className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center text-zinc-500 hover:text-white transition-colors" onClick={() => setView('settings')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#3fff8b]">Accounts</h2>
        </div>

        <div className="space-y-10 fade-in">
          <div className="bg-surface-low p-8 rounded-[2.5rem] border border-[#3fff8b]/20 shadow-2xl shadow-[#3fff8b]/5">
            <CustomDropdown
              label="Primary Spending Account"
              options={accounts.map(a => ({ value: a.id, label: a.name, icon: ACCT_META[a.type || 'asset']?.icon || 'account_balance' }))}
              value={defaultAccountId}
              onChange={handleSetDefaultAccount}
              placeholder="Select Default Account"
            />
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4 ml-1 opacity-60">
              Pre-selected for all new transactions.
            </p>
          </div>

          <ManagedAcctGroup title="Asset Accounts" accts={assetAccts} accountBalances={accountBalances} currencySymbol={currencySymbol} onDelete={handleDeleteAccount} onEdit={openEditAccount} defaultAccountId={defaultAccountId} />
          <ManagedAcctGroup title="Liability Accounts" accts={liabilityAccts} accountBalances={accountBalances} currencySymbol={currencySymbol} onDelete={handleDeleteAccount} onEdit={openEditAccount} defaultAccountId={defaultAccountId} />
          <ManagedAcctGroup title="Transit & Temporary" accts={tempAccts} accountBalances={accountBalances} currencySymbol={currencySymbol} onDelete={handleDeleteAccount} onEdit={openEditAccount} defaultAccountId={defaultAccountId} />

          <section className="space-y-4 pt-6">
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase px-2">Register New Account</p>
            <form onSubmit={handleCreateAccount} className="bg-surface-low p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Account Name</p>
                  <input type="text" placeholder="e.g. Main Checking" className="w-full bg-[#1a1a1a] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/30 transition-all text-sm font-medium" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Initial Balance</p>
                  <input type="number" step="0.01" placeholder="0.00" className="w-full bg-[#1a1a1a] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/30 transition-all text-sm font-medium" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} />
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
                className="flex items-center gap-3 py-2 group cursor-pointer"
                type="button"
                onClick={() => setNewAccountExclude(!newAccountExclude)}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${newAccountExclude ? 'bg-[#ff716c] border-[#ff716c]' : 'border-zinc-700'}`}>
                  {newAccountExclude && <span className="material-symbols-outlined text-white text-xs font-black">check</span>}
                </div>
                <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">Exclude from total Net Worth</span>
              </button>
              <button type="submit" className="w-full bg-[#1a1a1a] text-[#3fff8b] py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs border border-[#3fff8b]/20 hover:bg-[#3fff8b]/5 transition-all shadow-lg active:scale-[0.98]">Initialize Account</button>
            </form>
          </section>
        </div>
      </div>
      {acctEditModal}
    </PageShell>
  );
}
