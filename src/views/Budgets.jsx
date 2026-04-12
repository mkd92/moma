import React from 'react';
import { PageShell } from '../components/layout';
import CustomDropdown from '../components/CustomDropdown';
import { getCategoryIcon } from '../utils/formatters';

import { useAppDataContext } from '../hooks';

const Budgets = () => {
  const { 
    showBudgetModal, 
    budgetForm, 
    categories, 
    budgetProgress, 
    currencySymbol,
    isLoading,
    setBudgetForm, 
    setShowBudgetModal, 
    handleSaveBudget,
    refreshData
  } = useAppDataContext();

  return (
    <PageShell view="budgets" onRefresh={refreshData} isLoading={isLoading}>
      <div className="page-inner space-y-8 px-4 md:px-8 pt-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Budgets</h2>
          <button
            className="bg-secondary-container text-on-secondary-container px-6 py-2.5 rounded-full font-semibold active:scale-95 transition-transform text-sm"
            onClick={() => { setBudgetForm({ id: null, category_id: '', amount_limit: '', period: 'monthly' }); setShowBudgetModal(true); }}
          >
            Add New
          </button>
        </div>

        {showBudgetModal && (
          <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
            <div className="bg-surface-high p-8 rounded-[2rem] border border-outline-variant/10 w-full max-w-md slide-up" onClick={e => e.stopPropagation()}>
              <h3 className="font-headline text-2xl font-bold text-on-surface mb-6">Manage Budget</h3>
              <form onSubmit={handleSaveBudget} className="space-y-6">
                <div>
                  <CustomDropdown 
                    label="Category" 
                    options={[{ value: '', label: '-- Global Budget --', icon: '🌍' }, ...categories.filter(c => !c.parent_id).map(c => ({ value: c.id, label: c.name, icon: getCategoryIcon(c.name) }))]} 
                    value={budgetForm.category_id} 
                    onChange={val => setBudgetForm({ ...budgetForm, category_id: val })} 
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Limit Amount</p>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full bg-surface-highest border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-accent/30 transition-all" 
                    value={budgetForm.amount_limit} 
                    onChange={e => setBudgetForm({ ...budgetForm, amount_limit: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <CustomDropdown 
                    label="Period" 
                    options={[{ value: 'monthly', label: 'Monthly' }, { value: 'weekly', label: 'Weekly' }, { value: 'quarterly', label: 'Quarterly' }]} 
                    value={budgetForm.period} 
                    onChange={val => setBudgetForm({ ...budgetForm, period: val })} 
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-primary text-on-primary py-4 rounded-xl font-bold active:scale-95 transition-transform">Save Budget</button>
                  <button type="button" className="px-6 text-zinc-500 font-bold" onClick={() => setShowBudgetModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetProgress.map(b => {
            const cat = categories.find(c => c.id === b.category_id);
            const statusColor = b.status === 'over' ? 'var(--error)' : b.status === 'warning' ? 'var(--tertiary)' : 'var(--primary)';
            const icon = cat ? getCategoryIcon(cat.name) : 'public';
            
            return (
              <div key={b.id} className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/5 flex flex-col justify-between group active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center border border-outline-variant/10 text-primary">
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">{cat?.name || 'Global Budget'}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{b.period}</p>
                    </div>
                  </div>
                  <button 
                    className="p-2 text-zinc-600 hover:text-primary transition-colors"
                    onClick={() => { setBudgetForm({ id: b.id, category_id: b.category_id || '', amount_limit: b.limit_amount.toString(), period: b.period }); setShowBudgetModal(true); }}
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Spent</p>
                      <p className="text-xl font-extrabold font-['Manrope'] text-on-surface">
                        {currencySymbol}{b.spent.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Limit</p>
                      <p className="text-sm font-bold text-zinc-400">
                        {currencySymbol}{b.limit_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ 
                          width: `${Math.max(0, Math.min(100, b.pct))}%`,
                          background: statusColor 
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${b.status === 'over' ? 'text-error' : 'text-zinc-500'}`}>
                      {b.status === 'over' ? 'Limit Exceeded' : 'On Track'}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">
                      {b.status === 'over' ? `-${currencySymbol}${Math.abs(b.remaining).toLocaleString()}` : `${currencySymbol}${b.remaining.toLocaleString()} left`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {budgetProgress.length === 0 && (
            <div className="col-span-full py-20 text-center bg-surface-container-low rounded-[2rem] border-2 border-dashed border-outline-variant/10">
              <span className="material-symbols-outlined text-zinc-700 text-5xl mb-4">account_balance_wallet</span>
              <p className="text-zinc-500 font-bold">No budgets set yet.</p>
              <button 
                className="mt-4 text-primary text-sm font-bold uppercase tracking-widest"
                onClick={() => setShowBudgetModal(true)}
              >
                Create your first budget
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default Budgets;
