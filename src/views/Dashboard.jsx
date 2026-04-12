import React from 'react';
import { PageShell } from '../components/layout';
import TransactionItem from '../components/transactions/TransactionItem';
import { useAppDataContext } from '../hooks';

const ACCT_ICON  = { investment: 'trending_up', liability: 'credit_card', asset: 'account_balance' };
const ACCT_LABEL = { investment: 'Investment',  liability: 'Liability',    asset: 'Asset' };

const Eyebrow = ({ children, className = '' }) => (
  <p className={`text-[9px] font-bold uppercase tracking-[0.32em] text-on-surface-variant/50 ${className}`}>{children}</p>
);

const Dashboard = () => {
  const {
    currencySymbol, portfolioChange,
    totalIncome, totalExpense,
    dashTransactions, accounts, categories,
    smartInsights, accountBalances, topCategories,
    dashPeriod, isLoading,
    openEditTransaction, navToLedger, setView, navToAnalytics,
    resetFilters, updateFilter, refreshData,
  } = useAppDataContext();

  const handleNavToFilteredLedger = (type) => {
    resetFilters();
    updateFilter('type', type);
    updateFilter('preset', dashPeriod);
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    let start = '', end = '';
    if (dashPeriod === 'today') { start = end = fmt(today); }
    else if (dashPeriod === 'this_week') { const day = today.getDay() || 7; const mon = new Date(today); mon.setDate(today.getDate() - day + 1); start = fmt(mon); end = fmt(today); }
    else if (dashPeriod === 'this_month') { start = fmt(new Date(today.getFullYear(), today.getMonth(), 1)); end = fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)); }
    else if (dashPeriod === 'last_3m') { start = fmt(new Date(today.getFullYear(), today.getMonth() - 2, 1)); end = fmt(today); }
    if (start && end) updateFilter('dateRange', { start, end });
    setView('ledger');
  };

  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const includedAccounts  = accounts.filter(a => !a.exclude_from_total);
  const excludedCount     = accounts.length - includedAccounts.length;
  const netWorth          = includedAccounts.reduce((s, a) => { const b = accountBalances[a.id] || 0; return a.type === 'liability' ? s - b : s + b; }, 0);
  const assetTotal        = includedAccounts.filter(a => (a.type || 'asset') === 'asset').reduce((s, a) => s + (accountBalances[a.id] || 0), 0);
  const investTotal       = includedAccounts.filter(a => a.type === 'investment').reduce((s, a) => s + (accountBalances[a.id] || 0), 0);
  const liabTotal         = includedAccounts.filter(a => a.type === 'liability').reduce((s, a) => s + (accountBalances[a.id] || 0), 0);
  const maxBal            = Math.max(...includedAccounts.map(a => Math.abs(accountBalances[a.id] || 0)), 1);
  const netPeriod         = totalIncome - totalExpense;

  const kpis = [
    assetTotal  > 0 && { label: 'Cash & Assets',  value: assetTotal,  color: 'text-on-surface',         prefix: '' },
    investTotal > 0 && { label: 'Investments',     value: investTotal, color: 'text-primary',             prefix: '' },
    liabTotal   > 0 && { label: 'Liabilities',     value: liabTotal,   color: 'text-on-surface-variant',  prefix: '−' },
  ].filter(Boolean);

  return (
    <PageShell view="dashboard" onRefresh={refreshData} isLoading={isLoading}>
      <div className="page-inner max-w-6xl mx-auto px-4 md:px-8 pt-8 space-y-5">

        {/* ───────────────────────────────────────────────────────────
            NET WORTH STATEMENT CARD
        ─────────────────────────────────────────────────────────── */}
        <div className="bg-surface-lowest rounded-[1.75rem] overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 40px rgba(77,97,75,0.07)' }}>

          {/* ── Top: headline + actions ── */}
          <div className="px-8 md:px-10 pt-9 pb-7">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Eyebrow>Total Net Worth</Eyebrow>

                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-[2.2rem] sm:text-[2.6rem] md:text-[3.5rem] font-black tracking-tight leading-none text-on-surface tabular-nums">
                    {netWorth < 0 ? '−' : ''}{currencySymbol}{fmt(Math.abs(netWorth))}
                  </span>

                  {portfolioChange !== null && (
                    <span className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold mb-1 ${
                      portfolioChange >= 0
                        ? 'bg-primary/[0.08] text-primary'
                        : 'bg-error/[0.08] text-error'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {portfolioChange >= 0 ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                      {portfolioChange >= 0 ? '+' : ''}{portfolioChange}%
                    </span>
                  )}
                </div>

                <p className="text-xs text-on-surface-variant/50 font-medium">
                  {includedAccounts.length} account{includedAccounts.length !== 1 ? 's' : ''}
                  {excludedCount > 0 && <span className="opacity-60"> · {excludedCount} excluded</span>}
                </p>
              </div>

              <button
                onClick={() => setView('account_management')}
                className="mt-1 p-2.5 rounded-xl text-on-surface-variant/30 hover:text-on-surface hover:bg-surface-low transition-all"
                title="Manage accounts"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
              </button>
            </div>
          </div>

          {/* ── KPI strip ── */}
          {kpis.length > 0 && (
            <>
              <div className="h-px bg-outline-variant/10" />
              <div className={`grid divide-x divide-outline-variant/10`} style={{ gridTemplateColumns: `repeat(${kpis.length}, 1fr)` }}>
                {kpis.map(({ label, value, color, prefix }) => (
                  <div key={label} className="px-7 md:px-10 py-5">
                    <Eyebrow className="mb-2">{label}</Eyebrow>
                    <p className={`text-base md:text-lg font-bold tabular-nums ${color}`}>{prefix}{currencySymbol}{fmt(value)}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Account rows ── */}
          {includedAccounts.length > 0 && (
            <>
              <div className="h-px bg-outline-variant/10" />
              <div>
                {includedAccounts.map((a, i) => {
                  const bal     = accountBalances[a.id] || 0;
                  const barPct  = Math.min(Math.abs(bal) / maxBal * 100, 100);
                  const allocPct = netWorth !== 0 ? Math.abs(bal / netWorth * 100).toFixed(1) : '0.0';
                  const isLiab  = a.type === 'liability';
                  const typeKey = a.type || 'asset';

                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-4 px-8 md:px-10 py-4 hover:bg-surface-low/50 transition-colors ${
                        i > 0 ? 'border-t border-outline-variant/[0.07]' : ''
                      }`}
                    >
                      {/* icon */}
                      <div className="w-8 h-8 rounded-lg bg-primary-fixed/50 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[15px]">{ACCT_ICON[typeKey]}</span>
                      </div>

                      {/* body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-semibold text-on-surface truncate">{a.name}</span>
                            <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/30 shrink-0">
                              {ACCT_LABEL[typeKey]}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] font-semibold text-on-surface-variant/30 tabular-nums hidden sm:block">{allocPct}%</span>
                            <span className={`text-sm font-bold tabular-nums ${isLiab ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                              {isLiab ? '−' : ''}{currencySymbol}{fmt(Math.abs(bal))}
                            </span>
                          </div>
                        </div>
                        <div className="h-[2px] bg-surface-low rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${isLiab ? 'bg-outline-variant/50' : 'bg-primary'}`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Footer ── */}
          <div className="h-px bg-outline-variant/10" />
          <div className="flex items-center justify-between px-8 md:px-10 py-3.5 bg-surface-low/20">
            <p className="text-[9px] text-on-surface-variant/35 font-medium uppercase tracking-widest">Capital Assets</p>
            <button
              onClick={() => setView('account_management')}
              className="flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant/40 hover:text-primary transition-colors"
            >
              Manage <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────
            PERIOD FLOW — single card, 3 columns
        ─────────────────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-3 divide-x divide-outline-variant/10 bg-surface-lowest rounded-[1.5rem] overflow-hidden"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 20px rgba(77,97,75,0.06)' }}
        >
          <button
            className="text-left px-4 md:px-9 py-6 hover:bg-surface-low/60 transition-colors group"
            onClick={() => handleNavToFilteredLedger('income')}
          >
            <Eyebrow className="mb-2">Inflow</Eyebrow>
            <p className="text-lg md:text-2xl font-black text-primary tabular-nums tracking-tight">{currencySymbol}{fmt(totalIncome)}</p>
          </button>

          <button
            className="text-left px-4 md:px-9 py-6 hover:bg-surface-low/60 transition-colors group"
            onClick={() => handleNavToFilteredLedger('expense')}
          >
            <Eyebrow className="mb-2">Outflow</Eyebrow>
            <p className="text-lg md:text-2xl font-black text-on-surface tabular-nums tracking-tight">{currencySymbol}{fmt(totalExpense)}</p>
          </button>

          <div className="text-left px-4 md:px-9 py-6">
            <Eyebrow className="mb-2">Net</Eyebrow>
            <p className={`text-lg md:text-2xl font-black tabular-nums tracking-tight ${netPeriod >= 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
              {netPeriod < 0 ? '−' : '+'}{currencySymbol}{fmt(Math.abs(netPeriod))}
            </p>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────
            MAIN GRID
        ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Recent transactions ── */}
          <section className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <Eyebrow>Recent Transactions</Eyebrow>
              <button className="text-[10px] font-bold text-primary/70 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-widest" onClick={navToLedger}>
                All <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </button>
            </div>

            <div
              className="bg-surface-lowest rounded-[1.5rem] overflow-hidden"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 20px rgba(77,97,75,0.06)' }}
            >
              {dashTransactions.filter(t => !t.transfer_id).slice(0, 7).map(t => (
                <TransactionItem
                  key={t.id}
                  t={t}
                  onClick={openEditTransaction}
                  categories={categories}
                  accounts={accounts}
                  currencySymbol={currencySymbol}
                />
              ))}
              {dashTransactions.filter(t => !t.transfer_id).length === 0 && (
                <div className="py-20 flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-surface-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant/20 text-2xl">receipt_long</span>
                  </div>
                  <Eyebrow>No transactions this period</Eyebrow>
                </div>
              )}
            </div>
          </section>

          {/* ── Right column ── */}
          <div className="lg:col-span-4 space-y-5">

            {/* Spending breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <Eyebrow>Spending Breakdown</Eyebrow>
                <button className="text-[10px] font-bold text-primary/70 hover:text-primary transition-colors uppercase tracking-widest" onClick={navToAnalytics}>
                  Analytics
                </button>
              </div>

              <div
                className="bg-surface-lowest rounded-[1.5rem] overflow-hidden"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 20px rgba(77,97,75,0.06)' }}
              >
                {topCategories.length > 0 ? topCategories.slice(0, 5).map(({ name, amount }, i) => {
                  const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                  return (
                    <div
                      key={name}
                      className={`px-6 py-4 ${i > 0 ? 'border-t border-outline-variant/[0.07]' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-on-surface truncate max-w-[130px]">{name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-on-surface-variant/40 tabular-nums">{currencySymbol}{fmt(amount)}</span>
                          <span className="text-xs font-bold text-on-surface tabular-nums w-7 text-right">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1 bg-surface-low rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="px-6 py-12 text-center">
                    <Eyebrow>No spending data</Eyebrow>
                  </div>
                )}
              </div>
            </div>

            {/* Insight */}
            {smartInsights.length > 0 && (
              <div
                className="rounded-[1.5rem] overflow-hidden bg-surface-lowest"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 20px rgba(77,97,75,0.06)' }}
              >
                <div className="border-l-[3px] border-primary px-6 py-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <Eyebrow>Insight</Eyebrow>
                  </div>
                  <p className="text-sm font-bold text-on-surface mb-1">{smartInsights[0].title}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{smartInsights[0].text}</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </PageShell>
  );
};

export default Dashboard;
