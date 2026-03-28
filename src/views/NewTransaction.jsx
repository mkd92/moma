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
  handleTransaction,
  onDelete 
}) => {
  const isEditing = !!txToEdit;

  const confirmDelete = () => {
    if (window.confirm("Are you sure you want to permanently delete this entry?")) {
      onDelete(txToEdit);
      resetForm();
      setView('ledger');
    }
  };

  return (
    <PageShell {...shellProps}>
      <div className="page-inner max-w-2xl mx-auto space-y-8 pb-32 px-6" onKeyDown={(e) => { if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleTransaction(); } }}>
        <div className="flex justify-between items-center px-2">
          <h2 className="font-headline text-3xl font-black tracking-tight text-on-surface uppercase">{isEditing ? 'Edit Entry' : 'New Entry'}</h2>
          <div className="flex items-center gap-4">
            {isEditing && (
              <button 
                className="text-error font-black uppercase text-[10px] tracking-[0.2em] px-5 py-2 rounded-full bg-error/5 border border-error/10 hover:bg-error hover:text-on-primary transition-all shadow-sm"
                onClick={confirmDelete}
              >
                Delete
              </button>
            )}
            <button className="text-on-surface-variant font-bold uppercase text-[10px] tracking-[0.2em] hover:text-on-surface transition-colors" onClick={() => { resetForm(); setView(isEditing ? 'ledger' : 'dashboard'); }}>Cancel</button>
          </div>
        </div>

        <div className="bg-surface-low p-8 md:p-12 rounded-[2.5rem] border border-outline-variant/10 space-y-12 shadow-2xl">
          {/* Type Selector - Themed */}
          <div className="flex bg-on-surface/[0.03] p-1.5 rounded-2xl gap-1 border border-outline-variant/5">
            {['expense', 'income', 'transfer'].map(t => (
              <button 
                key={t}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${txType === t ? 'bg-on-surface text-surface shadow-xl scale-[1.02]' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => { setTxType(t); setSelectedCategory(null); setSelectedSubcategory(null); }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Large Amount Input - Themed */}
          <div className="text-center space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase opacity-60">Entry Amount</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-extrabold font-headline text-on-surface opacity-30">{currencySymbol}</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00" 
                className="bg-transparent border-none text-6xl md:text-8xl font-black font-headline text-on-surface focus:ring-0 w-full max-w-[320px] text-center placeholder:text-on-surface/[0.05] outline-none"
                autoFocus 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Date</p>
              <input 
                type="date" 
                value={txDate} 
                onChange={(e) => setTxDate(e.target.value)} 
                className="w-full bg-on-surface/[0.03] border border-outline-variant/10 rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all text-sm font-bold uppercase tracking-wider outline-none" 
              />
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Annotation</p>
              <input 
                type="text" 
                placeholder="Add context..." 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                className="w-full bg-on-surface/[0.03] border border-outline-variant/10 rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all text-sm font-bold placeholder:text-on-surface-variant/30 outline-none" 
              />
            </div>
          </div>

          {txType !== 'transfer' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CustomDropdown 
                  label="Vault" 
                  options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'account_balance' }))} 
                  value={selectedAccount} 
                  onChange={setSelectedAccount} 
                  placeholder="Select Source" 
                />
                <CustomDropdown 
                  label="Category" 
                  options={currentParents.flatMap(p => [{ value: p.id, label: p.name, icon: getCategoryIcon(p.name) }, ...applicableSubs.filter(s => s.parent_id === p.id).map(s => ({ value: s.id, label: s.name, icon: getCategoryIcon(s.name), indent: true }))])} 
                  value={selectedCategory} 
                  onChange={setSelectedCategory} 
                  placeholder="Select Type" 
                />
              </div>
              <CustomDropdown 
                label="Target / Party" 
                options={[{ value: '', label: '— No Attribution —', icon: 'person_off' }, ...parties.map(p => ({ value: p.id, label: p.name, icon: 'storefront' }))]} 
                value={selectedParty || ''} 
                onChange={v => setSelectedParty(v || null)} 
                placeholder="Identify Payee" 
                showSearch={true} 
              />
              
              {tags.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(t => (
                      <button 
                        key={t.id} 
                        type="button"
                        onClick={() => setSelectedTags(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                        className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${selectedTags.includes(t.id) ? 'bg-on-surface text-surface border-on-surface' : 'bg-transparent text-on-surface-variant border-outline-variant/20 hover:border-on-surface-variant'}`}
                      >
                        #{t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CustomDropdown label="Source Vault" options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'logout' }))} value={transferFromAccount} onChange={setTransferFromAccount} placeholder="From..." />
              <CustomDropdown label="Destination Vault" options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'login' }))} value={transferToAccount} onChange={setTransferToAccount} placeholder="To..." />
            </div>
          )}

          <button 
            className="w-full bg-on-surface text-surface py-6 rounded-2xl font-black text-lg uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all hover:brightness-110 disabled:opacity-50"
            onClick={handleTransaction}
          >
            {isEditing ? 'Commit Changes' : 'Confirm Entry'}
          </button>
        </div>
      </div>
    </PageShell>
  );
};

export default NewTransaction;
