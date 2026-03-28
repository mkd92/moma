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
            {/* Portfolio Hero - Modern Architectural */}
            <div className="relative overflow-hidden bg-surface-low p-6 md:p-14 rounded-[2.5rem] md:rounded-[3rem] border border-outline-variant/10 shadow-sm">
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
                <div>
                  <p className="text-[9px] md:text-[10px] font-bold tracking-[0.3em] md:tracking-[0.4em] text-on-surface-variant uppercase mb-4 md:mb-6 opacity-60">Total Net Worth</p>
                  <div className="flex items-baseline gap-1 md:gap-2 flex-wrap">
                    <span className="text-xl md:text-3xl font-extrabold font-headline text-on-surface opacity-40">{currencySymbol}</span>
                    <h1 className="text-5xl md:text-9xl font-black font-headline text-on-surface tracking-[-0.04em] leading-none">
                      {Math.floor(balance).toLocaleString()}
                    </h1>
                    <span className="text-lg md:text-2xl font-bold text-on-surface-variant opacity-30 font-headline">
                      .{(balance % 1).toFixed(2).split('.')[1]}
                    </span>
                  </div>
                  {portfolioChange !== null && (
                    <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-on-surface/[0.03] rounded-xl md:rounded-2xl mt-6 md:mt-10 border border-outline-variant/10">
                      <span className={`material-symbols-outlined text-[12px] md:text-[14px] ${portfolioChange >= 0 ? 'text-accent' : 'text-error'}`}>
                        {portfolioChange >= 0 ? 'trending_up' : 'trending_down'}
                      </span>
                      <span className="text-[10px] md:text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">{Math.abs(portfolioChange)}% vs last</span>
                    </div>
                  )}
                </div>
                {/* Refined Minimalist Bars - Hidden or smaller on mobile to save space */}
                <div className="flex items-end gap-1 md:gap-1.5 h-16 md:h-24 pb-1 md:pb-2 opacity-20 overflow-hidden">
                  {sparklineData.slice(-12).map((v, i) => {
                    const max = Math.max(...sparklineData, 1);
                    const h = Math.max(8, (v / max) * 100);
                    return <div key={i} className="w-1 md:w-1.5 bg-on-surface rounded-full transition-all duration-700" style={{ height: `${h}%` }}></div>;
                  })}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid - Minimalist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="bg-surface-low p-6 md:p-10 rounded-[2.5rem] border border-outline-variant transition-all hover:bg-surface-high group">
                <p className="text-[9px] md:text-[10px] font-bold tracking-[0.3em] text-on-surface-variant uppercase mb-4 md:mb-8">Inflow</p>
                <div className="flex justify-between items-end gap-4">
                  <h2 className="text-2xl md:text-4xl font-extrabold font-headline text-on-surface tracking-tight break-all">
                    {currencySymbol}{totalIncome.toLocaleString()}
                  </h2>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/5 flex items-center justify-center border border-outline-variant group-hover:bg-primary group-hover:text-on-primary transition-all shrink-0">
                    <span className="material-symbols-outlined text-sm">arrow_outward</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-low p-6 md:p-10 rounded-[2.5rem] border border-outline-variant transition-all hover:bg-surface-high group">
                <p className="text-[9px] md:text-[10px] font-bold tracking-[0.3em] text-on-surface-variant uppercase mb-4 md:mb-8">Outflow</p>
                <div className="flex justify-between items-end gap-4">
                  <h2 className="text-2xl md:text-4xl font-extrabold font-headline text-on-surface tracking-tight break-all">
                    {currencySymbol}{totalExpense.toLocaleString()}
                  </h2>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/5 flex items-center justify-center border border-outline-variant group-hover:bg-primary group-hover:text-on-primary transition-all shrink-0">
                    <span className="material-symbols-outlined text-sm">south_east</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <section className="space-y-8">
              <div className="flex justify-between items-center px-4">
                <h3 className="font-headline text-xs font-black tracking-[0.3em] text-on-surface uppercase">Recent Entries</h3>
                <button className="text-[9px] font-black text-on-surface-variant hover:text-primary uppercase tracking-[0.2em] transition-all" onClick={navToLedger}>View All</button>
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
          <div className="lg:col-span-4 space-y-8">
            {/* AI Insights Card - Simplified */}
            <section className="bg-surface-low p-10 rounded-[2.5rem] border border-outline-variant shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                <h3 className="font-headline font-black text-xs text-on-surface uppercase tracking-[0.3em]">Vault Intelligence</h3>
              </div>
              <div className="space-y-8">
                {smartInsights.map((ins, i) => (
                  <div key={i} className="space-y-2 group">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">{ins.title}</p>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {ins.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Account Distribution - Monochromatic */}
            <section className="bg-surface-low p-10 rounded-[2.5rem] border border-outline-variant shadow-sm space-y-10">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-headline font-black text-xs text-on-surface uppercase tracking-[0.3em]">Assets</h3>
                <button className="text-[9px] font-black text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors" onClick={() => setView('account_management')}>Manage</button>
              </div>
              <div className="space-y-1">
                {(() => {
                  const maxBal = Math.max(...accounts.map(a => Math.abs(accountBalances[a.id] || 0)), 1);
                  return accounts.map(a => {
                    const bal = accountBalances[a.id] || 0;
                    const pct = Math.min(Math.abs(bal) / maxBal * 100, 100);
                    return (
                      <div key={a.id} className="py-6 px-2 group cursor-default">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">{a.name}</span>
                          <span className={`font-headline text-sm font-black ${bal < 0 ? 'text-error' : 'text-on-surface'}`}>
                            {currencySymbol}{bal.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1 bg-on-surface/[0.03] rounded-full overflow-hidden">
                          <div className="h-full bg-on-surface transition-all duration-1000 origin-left" style={{ width: `${pct}%`, opacity: 0.15 + (pct/200) }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </section>

            {/* Spending Breakdown - Architectural */}
            <section className="bg-surface-low p-10 rounded-[2.5rem] border border-outline-variant shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="font-headline font-black text-xs text-on-surface uppercase tracking-[0.3em]">Distribution</h3>
                <button className="text-[9px] font-bold text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors" onClick={navToAnalytics}>Details</button>
              </div>
              <div className="space-y-8">
                {topCategories.length > 0 ? topCategories.slice(0, 4).map(({ name, amount }, i) => {
                  const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                  return (
                    <div key={name} className="space-y-3 group">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
                        <span className="text-on-surface-variant group-hover:text-on-surface transition-colors">{name}</span>
                        <span className="text-on-surface opacity-40">{pct}%</span>
                      </div>
                      <div className="h-1 bg-on-surface/[0.03] rounded-full overflow-hidden">
                        <div className="h-full bg-on-surface transition-all duration-700" style={{ width: `${pct}%`, opacity: 0.1 + (pct/150) }}></div>
                      </div>
                    </div>
                  );
                }) : <p className="text-[10px] text-on-surface-variant font-bold uppercase text-center py-4">No data</p>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Dashboard;
