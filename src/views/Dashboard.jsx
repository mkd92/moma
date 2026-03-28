import React from 'react';
import { PageShell } from '../components/layout';
import TransactionItem from '../components/transactions/TransactionItem';

const Dashboard = ({ 
  shellProps, 
  currencySymbol, 
  balance, 
  portfolioChange, 
  sparklineData, 
  totalIncome, 
  totalExpense, 
  dashTransactions, 
  openEditTransaction, 
  accounts, 
  categories, 
  navToLedger, 
  smartInsights, 
  accountBalances, 
  setView, 
  navToAnalytics, 
  topCategories 
}) => {
  return (
    <PageShell {...shellProps}>
      <div className="page-inner space-y-10 pb-32 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Stack */}
          <div className="lg:col-span-8 space-y-10">
            {/* Portfolio Hero - Unified Monochromatic */}
            <div className="relative overflow-hidden bg-on-surface p-10 md:p-14 rounded-[2.5rem] shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.3em] text-surface/50 uppercase mb-4">Total Net Worth</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-headline text-surface/80">{currencySymbol}</span>
                    <h1 className="text-7xl md:text-9xl font-extrabold font-headline text-surface tracking-tighter leading-none">
                      {Math.floor(balance).toLocaleString()}
                    </h1>
                    <span className="text-2xl font-bold text-surface/30 font-headline">
                      .{(balance % 1).toFixed(2).split('.')[1]}
                    </span>
                  </div>
                  {portfolioChange !== null && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface/5 rounded-full mt-10 border border-surface/5 backdrop-blur-sm">
                      <span className={`material-symbols-outlined text-sm ${portfolioChange >= 0 ? 'text-accent' : 'text-error'}`}>
                        {portfolioChange >= 0 ? 'trending_up' : 'trending_down'}
                      </span>
                      <span className="text-[10px] font-black text-surface/60 uppercase tracking-widest">{Math.abs(portfolioChange)}% vs last</span>
                    </div>
                  )}
                </div>
                {/* Modern Sparkline */}
                <div className="flex items-end gap-2 h-20">
                  {sparklineData.slice(-15).map((v, i) => {
                    const max = Math.max(...sparklineData, 1);
                    const h = Math.max(15, (v / max) * 100);
                    return <div key={i} className="w-2 bg-surface/10 rounded-full transition-all duration-500 hover:bg-surface/30" style={{ height: `${h}%` }}></div>;
                  })}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-transparent to-surface/5 pointer-events-none"></div>
            </div>

            {/* Quick Stats Grid - Minimalist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface-low p-10 rounded-[2.5rem] border border-outline-variant transition-all hover:bg-surface-high group">
                <p className="text-[10px] font-bold tracking-[0.3em] text-on-surface-variant uppercase mb-8">Inflow</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight">
                    {currencySymbol}{totalIncome.toLocaleString()}
                  </h2>
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center border border-outline-variant group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <span className="material-symbols-outlined text-sm">arrow_outward</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-low p-10 rounded-[2.5rem] border border-outline-variant transition-all hover:bg-surface-high group">
                <p className="text-[10px] font-bold tracking-[0.3em] text-on-surface-variant uppercase mb-8">Outflow</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight">
                    {currencySymbol}{totalExpense.toLocaleString()}
                  </h2>
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center border border-outline-variant group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <span className="material-symbols-outlined text-sm">south_east</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <section className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="font-headline text-2xl font-bold tracking-tight text-white">Recent Activity</h3>
                <button className="text-[10px] font-bold text-[#3fff8b] uppercase tracking-[0.2em]" onClick={navToLedger}>View All</button>
              </div>
              <div className="space-y-3">
                {dashTransactions.filter(t => !t.transfer_id).slice(0, 5).map(t => (
                  <TransactionItem 
                    key={t.id} 
                    t={t} 
                    onClick={openEditTransaction} 
                    accounts={accounts} 
                    categories={categories} 
                    currencySymbol={currencySymbol} 
                  />
                ))}
                {dashTransactions.filter(t => !t.transfer_id).length === 0 && (
                  <div className="bg-surface-low/50 rounded-[2.5rem] py-12 text-center border border-dashed border-outline-variant/10">
                    <p className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest">No entries found</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Content Stack */}
          <div className="lg:col-span-4 space-y-10">
            {/* AI Insights Card */}
            <section className="bg-surface-low p-8 rounded-[2.5rem] border-l-4 border-[#3fff8b] shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-[#3fff8b]/10 flex items-center justify-center border border-[#3fff8b]/10">
                  <span className="material-symbols-outlined text-[#3fff8b] text-sm">auto_awesome</span>
                </div>
                <h3 className="font-headline font-bold text-sm text-white uppercase tracking-widest">AI Insights</h3>
              </div>
              <div className="space-y-6">
                {smartInsights.map((ins, i) => (
                  <div key={i} className="group cursor-default">
                    <p className="text-xs text-zinc-400 leading-relaxed transition-colors group-hover:text-zinc-200">
                      <strong className="text-[#3fff8b] font-bold tracking-tight">{ins.title}:</strong> {ins.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Account Distribution */}
            <section className="bg-surface-low p-8 rounded-[2.5rem] border border-outline-variant/5 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-headline font-bold text-sm text-white uppercase tracking-widest">Accounts</h3>
                <button className="text-[10px] font-bold text-[#3fff8b] uppercase tracking-widest" onClick={() => setView('account_management')}>Manage</button>
              </div>
              <div className="space-y-4">
                {(() => {
                  const maxBal = Math.max(...accounts.map(a => Math.abs(accountBalances[a.id] || 0)), 1);
                  return accounts.map(a => {
                    const bal = accountBalances[a.id] || 0;
                    const pct = Math.min(Math.abs(bal) / maxBal * 100, 100);
                    return (
                      <div key={a.id} className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10 group hover:border-[#3fff8b]/20 transition-all">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-white tracking-tight">{a.name}</span>
                          <span className={`font-headline text-xs font-black ${bal < 0 ? 'text-[#ff716c]' : 'text-[#3fff8b]'}`}>
                            {currencySymbol}{bal.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1 bg-surface-lowest rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${bal < 0 ? 'bg-[#ff716c]' : 'bg-[#3fff8b]'}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </section>

            {/* Spending Breakdown */}
            <section className="bg-surface-low p-8 rounded-[2.5rem] border border-outline-variant/5 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-headline font-bold text-sm text-white uppercase tracking-widest">Spending</h3>
                <button className="text-[10px] font-bold text-[#3fff8b] uppercase tracking-widest" onClick={navToAnalytics}>Details</button>
              </div>
              <div className="space-y-6">
                {topCategories.length > 0 ? topCategories.slice(0, 4).map(({ name, amount }, i) => {
                  const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                  return (
                    <div key={name} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-zinc-400">{name}</span>
                        <span className="text-white">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-lowest rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-700 rounded-full group-hover:bg-[#3fff8b] transition-all" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                }) : <p className="text-[10px] text-zinc-600 font-bold uppercase text-center py-4">No data</p>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Dashboard;
