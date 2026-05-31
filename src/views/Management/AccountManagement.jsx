import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { PageShell } from '../../components/layout';

import { useAppDataContext } from '../../hooks';

const ACCT_META = {
  asset:      { label: 'Asset',      icon: 'account_balance' },
  liability:  { label: 'Liability',  icon: 'credit_card' },
  investment: { label: 'Investment', icon: 'trending_up' },
  temp:       { label: 'Temporary',  icon: 'trending_up' },
};

const AcctGroup = ({ title, accts, accountBalances, currencySymbol, currencyCode, transactions, onDelete, onEdit, onSetDefault, defaultAccountId }) => accts.length === 0 ? null : (
    <div className="space-y-6">
      <h3 className="font-headline text-xs font-black tracking-[0.4em] text-on-surface uppercase opacity-60 px-4">{title}</h3>
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
                    {isDefault && <span className="text-[8px] font-black bg-primary text-on-primary px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Default</span>}
                  </div>
                  <p className={`text-xs font-bold font-headline mt-0.5 ${bal < 0 ? 'text-error' : 'text-primary'}`}>
                    {currencySymbol}{bal.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isDefault && (
                  <button className="text-[10px] font-bold text-zinc-500 hover:text-primary uppercase tracking-widest transition-colors mr-2" onClick={() => onSetDefault(acc.id)}>Set Default</button>
                )}
                <button
                  className="p-2 text-zinc-500 hover:text-primary transition-colors"
                  title="Export transactions as CSV"
                  onClick={() => exportAccountCSV(acc, transactions, currencyCode)}
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                </button>
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

const exportAccountCSV = (acc, transactions, currencyCode) => {
  const isLiab = acc.type === 'liability';
  const acctTxs = [...transactions.filter(t => t.account_id === acc.id)]
    .sort((a, b) => {
      const d1 = a.transaction_date || '';
      const d2 = b.transaction_date || '';
      if (d1 !== d2) return d1.localeCompare(d2);
      return (a.created_at || '').localeCompare(b.created_at || '');
    });

  let bal = parseFloat(acc.initial_balance) || 0;

  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = ['Date', 'Description', 'Category', 'Party', 'Type', `Amount (${currencyCode})`, `Balance (${currencyCode})`];

  const rows = acctTxs.map(t => {
    const amt = parseFloat(t.amount) || 0;
    if (isLiab) {
      if (t.type === 'income') bal -= amt;
      else if (t.type === 'expense') bal += amt;
    } else {
      if (t.type === 'income') bal += amt;
      else if (t.type === 'expense') bal -= amt;
    }
    const signedAmt = t.transfer_id ? 0 : (t.type === 'income' ? amt : -amt);
    return [
      t.transaction_date || '',
      esc(t.note || ''),
      esc(t.categories?.name || ''),
      esc(t.parties?.name || ''),
      t.transfer_id ? 'transfer' : t.type,
      signedAmt.toFixed(2),
      bal.toFixed(2),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv, ''], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${acc.name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')}_transactions.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function AccountManagement() {
  const {
    accounts,
    transactions,
    accountBalances,
    currencySymbol,
    currencyCode,
    defaultAccountId,
    isLoading,
    handleDeleteAccount,
    handleCreateAccount,
    handleUpdateAccount,
    handleSetDefaultAccount,
    setView,
    refreshData
  } = useAppDataContext();

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [newAccountType, setNewAccountType] = useState('asset');
  const [newAccountExclude, setNewAccountExclude] = useState(false);

  const [editingAccount, setEditingAccount] = useState(null);
  const [editAcctName, setEditAcctName] = useState('');
  const [editAcctMode, setEditAcctMode] = useState('opening');
  const [editAcctValue, setEditAcctValue] = useState('');
  const [editAcctExclude, setEditAcctExclude] = useState(false);
  const [editAcctType, setEditAcctType] = useState('asset');

  const openEditAccount = (acc) => {
    setEditingAccount(acc);
    setEditAcctName(acc.name);
    setEditAcctMode('opening');
    setEditAcctValue(String(parseFloat(acc.initial_balance) || 0));
    setEditAcctExclude(!!acc.exclude_from_total);
    setEditAcctType(acc.type || 'asset');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: newAccountName,
      initial_balance: parseFloat(newAccountBalance) || 0,
      type: newAccountType,
      exclude_from_total: newAccountExclude
    };
    const error = await handleCreateAccount(payload);
    if (!error) {
      setNewAccountName('');
      setNewAccountBalance('');
      setNewAccountType('asset');
      setNewAccountExclude(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const txSum = (accountBalances[editingAccount.id] || 0) - (parseFloat(editingAccount.initial_balance) || 0);
    const newInitial = editAcctMode === 'current' ? (parseFloat(editAcctValue) || 0) - txSum : (parseFloat(editAcctValue) || 0);
    const error = await handleUpdateAccount(editingAccount.id, { name: editAcctName, initial_balance: newInitial, exclude_from_total: editAcctExclude, type: editAcctType });
    if (!error) setEditingAccount(null);
  };

  const acctEditModal = editingAccount ? createPortal(
    <div className="modal-overlay" onClick={() => setEditingAccount(null)}>
      <div className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant w-full max-w-md slide-up space-y-10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-headline text-2xl font-black text-on-surface uppercase tracking-tight">Edit Account</h3>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors hover:bg-on-surface/[0.05]" onClick={() => setEditingAccount(null)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleUpdateSubmit} className="space-y-10">
          <div className="space-y-4">
            <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Display Name</p>
            <input type="text" className="w-full bg-on-surface/[0.03] border border-outline-variant rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all font-bold outline-none" value={editAcctName} onChange={e => setEditAcctName(e.target.value)} required />
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Classification</p>
            <select className="w-full bg-on-surface/[0.03] border border-outline-variant rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all font-bold outline-none appearance-none cursor-pointer" value={editAcctType} onChange={e => setEditAcctType(e.target.value)}>
              <option value="asset">Cash / Asset</option>
              <option value="liability">Liability / Debt</option>
            </select>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase opacity-60">Balance Logic</p>
              <div className="flex bg-on-surface/[0.03] p-1 rounded-xl gap-1">
                <button type="button" className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${editAcctMode === 'opening' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`} onClick={() => { setEditAcctMode('opening'); setEditAcctValue(String(parseFloat(editingAccount.initial_balance) || 0)); }}>Opening</button>
                <button type="button" className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${editAcctMode === 'current' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`} onClick={() => { setEditAcctMode('current'); setEditAcctValue(String(((accountBalances[editingAccount.id] || 0)).toFixed(2))); }}>Current</button>
              </div>
            </div>
            <input type="number" step="0.01" className="w-full bg-on-surface/[0.03] border border-outline-variant rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all font-bold outline-none" value={editAcctValue} onChange={e => setEditAcctValue(e.target.value)} required />
            <p className="text-[10px] text-on-surface-variant italic px-2">
              {editAcctMode === 'opening' ? "Set the historical starting point for this account." : "We'll auto-calculate the opening balance based on current entries."}
            </p>
          </div>

          <label className="flex items-center gap-4 px-2 cursor-pointer group">
            <input type="checkbox" checked={editAcctExclude} onChange={e => setEditAcctExclude(e.target.checked)} className="hidden" />
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editAcctExclude ? 'bg-primary border-primary' : 'border-outline-variant group-hover:border-on-surface-variant'}`}>
              {editAcctExclude && <span className="material-symbols-outlined text-on-primary text-xs font-black">check</span>}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant group-hover:text-on-surface transition-colors">Exclude from Global Total</span>
          </label>

          <button type="submit" className="w-full bg-primary text-on-primary py-5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
            Save Modifications
          </button>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <PageShell view="account_management" onRefresh={refreshData} isLoading={isLoading}>
      <div className="page-inner max-w-2xl mx-auto space-y-12 pb-32 pt-4 md:pt-0 px-6">
        <div className="flex items-center gap-5 px-2">
          <button className="w-12 h-12 rounded-2xl bg-surface-low border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.05] transition-all" onClick={() => setView('settings')}>
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h2 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase tracking-tight">Accounts</h2>
        </div>

        <div className="space-y-12 fade-in">
          <AcctGroup title="Cash & Bank" accts={accounts.filter(a => (a.type || 'asset') === 'asset')} accountBalances={accountBalances} currencySymbol={currencySymbol} currencyCode={currencyCode} transactions={transactions} onDelete={handleDeleteAccount} onEdit={openEditAccount} onSetDefault={handleSetDefaultAccount} defaultAccountId={defaultAccountId} />
          <AcctGroup title="Liabilities" accts={accounts.filter(a => a.type === 'liability')} accountBalances={accountBalances} currencySymbol={currencySymbol} currencyCode={currencyCode} transactions={transactions} onDelete={handleDeleteAccount} onEdit={openEditAccount} onSetDefault={handleSetDefaultAccount} defaultAccountId={defaultAccountId} />
          <AcctGroup title="Temporary" accts={accounts.filter(a => a.type === 'investment' || a.type === 'temp')} accountBalances={accountBalances} currencySymbol={currencySymbol} currencyCode={currencyCode} transactions={transactions} onDelete={handleDeleteAccount} onEdit={openEditAccount} onSetDefault={handleSetDefaultAccount} defaultAccountId={defaultAccountId} />
          
          <section className="space-y-6 pt-10">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">Provision New Account</p>
            <form onSubmit={handleCreateSubmit} className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant shadow-2xl space-y-10">
              <div className="space-y-4">
                <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Account Name</p>
                <input type="text" className="w-full bg-on-surface/[0.03] border border-outline-variant rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all font-bold outline-none" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} placeholder="e.g. Primary Checking" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Opening Balance</p>
                  <input type="number" step="0.01" className="w-full bg-on-surface/[0.03] border border-outline-variant rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all font-bold outline-none" value={newAccountBalance} onChange={e => setNewAccountBalance(e.target.value)} placeholder="0.00" required />
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Classification</p>
                  <select className="w-full bg-on-surface/[0.03] border border-outline-variant rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all font-bold outline-none appearance-none cursor-pointer" value={newAccountType} onChange={e => setNewAccountType(e.target.value)}>
                    <option value="asset">Cash / Asset</option>
                    <option value="liability">Liability / Debt</option>
                    <option value="temp">Temporary</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-4 px-2 cursor-pointer group">
                <input type="checkbox" checked={newAccountExclude} onChange={e => setNewAccountExclude(e.target.checked)} className="hidden" />
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${newAccountExclude ? 'bg-primary border-primary' : 'border-outline-variant group-hover:border-on-surface-variant'}`}>
                  {newAccountExclude && <span className="material-symbols-outlined text-on-primary text-xs font-black">check</span>}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant group-hover:text-on-surface transition-colors">Exclude from Aggregated Total</span>
              </label>
              <button type="submit" className="w-full bg-primary text-on-primary py-5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
                Initialize Account
              </button>
            </form>
          </section>
        </div>
      </div>
      {acctEditModal}
    </PageShell>
  );
}
