import React from 'react';
import { PageShell } from '../components/layout';
import CustomDropdown from '../components/CustomDropdown';
import { getCategoryIcon } from '../utils/formatters';

const NewTransaction = ({ 
  shellProps, 
  txToEdit, 
  resetForm, 
  setView, 
  txType, 
  setTxType, 
  setSelectedCategory, 
  setSelectedSubcategory, 
  amount, 
  setAmount, 
  currencySymbol, 
  txDate, 
  setTxDate, 
  note, 
  setNote, 
  accounts, 
  selectedAccount, 
  setSelectedAccount,
  currentParents, 
  applicableSubs, 
  selectedCategory, 
  parties, 
  selectedParty, 
  setSelectedParty, 
  tags, 
  selectedTags, 
  setSelectedTags, 
  transferFromAccount, 
  setTransferFromAccount, 
  transferToAccount, 
  setTransferToAccount, 
  handleTransaction 
}) => {
  return (
    <PageShell {...shellProps}>
      <div className="page-inner max-w-2xl mx-auto space-y-8 pb-32" onKeyDown={(e) => { if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleTransaction(); } }}>
        <div className="flex justify-between items-center">
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#3fff8b]">{txToEdit ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button className="text-zinc-500 font-bold uppercase text-xs tracking-widest" onClick={() => { resetForm(); setView(txToEdit ? 'ledger' : 'dashboard'); }}>Cancel</button>
        </div>

        <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/10 space-y-10 shadow-2xl">
          {/* Type Selector */}
          <div className="flex bg-surface-container-lowest p-1.5 rounded-2xl gap-1">
            {['expense', 'income', 'transfer'].map(t => (
              <button 
                key={t}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${txType === t ? 'bg-[#3fff8b] text-[#005d2c] shadow-lg scale-105' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => { setTxType(t); setSelectedCategory(null); setSelectedSubcategory(null); }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Large Amount Input */}
          <div className="text-center space-y-2">
            <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase">Amount</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-extrabold font-['Manrope'] text-[#3fff8b]">{currencySymbol}</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00" 
                className="bg-transparent border-none text-6xl font-extrabold font-['Manrope'] text-white focus:ring-0 w-full max-w-[280px] text-center placeholder:text-zinc-800"
                autoFocus 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Date</p>
              <input 
                type="date" 
                value={txDate} 
                onChange={(e) => setTxDate(e.target.value)} 
                className="w-full bg-surface-container border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/20 transition-all text-sm font-medium" 
              />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Description</p>
              <input 
                type="text" 
                placeholder="What was this for?" 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                className="w-full bg-surface-container border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/20 transition-all text-sm font-medium placeholder:text-zinc-600" 
              />
            </div>
          </div>

          {txType !== 'transfer' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomDropdown 
                  label="Account" 
                  options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'account_balance' }))} 
                  value={selectedAccount} 
                  onChange={setSelectedAccount} 
                  placeholder="Select Account" 
                />
                <CustomDropdown 
                  label="Category" 
                  options={currentParents.flatMap(p => [{ value: p.id, label: p.name, icon: getCategoryIcon(p.name) }, ...applicableSubs.filter(s => s.parent_id === p.id).map(s => ({ value: s.id, label: s.name, icon: getCategoryIcon(s.name), indent: true }))])} 
                  value={selectedCategory} 
                  onChange={setSelectedCategory} 
                  placeholder="Select Category" 
                />
              </div>
              <CustomDropdown 
                label="Party" 
                options={[{ value: '', label: '— No Party —', icon: 'person_off' }, ...parties.map(p => ({ value: p.id, label: p.name, icon: 'storefront' }))]} 
                value={selectedParty || ''} 
                onChange={v => setSelectedParty(v || null)} 
                placeholder="Select Payee" 
                showSearch={true} 
              />
              
              {tags.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(t => (
                      <button 
                        key={t.id} 
                        type="button"
                        onClick={() => setSelectedTags(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedTags.includes(t.id) ? 'bg-[#3fff8b] text-[#005d2c] border-[#3fff8b]' : 'bg-surface-container text-zinc-500 border-outline-variant/10 hover:border-[#3fff8b]/30'}`}
                      >
                        #{t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomDropdown label="From Account" options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'logout' }))} value={transferFromAccount} onChange={setTransferFromAccount} placeholder="Source..." />
              <CustomDropdown label="To Account" options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'login' }))} value={transferToAccount} onChange={setTransferToAccount} placeholder="Destination..." />
            </div>
          )}

          <button 
            className="w-full bg-gradient-to-br from-[#3fff8b] to-[#13ea79] text-[#005d2c] py-5 rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all hover:brightness-110 disabled:opacity-50"
            onClick={handleTransaction}
          >
            {txToEdit ? 'Update Entry' : 'Post Transaction'}
          </button>
        </div>
      </div>
    </PageShell>
  );
};

export default NewTransaction;
