import React, { useState, useCallback, useMemo } from 'react';
import { PageShell } from '../components/layout';
import CustomDropdown from '../components/CustomDropdown';
import { CURRENCY_SYMBOLS } from '../constants';

import { useAppDataContext } from '../hooks';

const Settings = () => {
  const {
    currencyCode,
    currencySymbol,
    session,
    isLoading,
    setCurrencyCode,
    setView,
    shellProps,
    refreshData,
    transactions = [],
    accounts = [],
    categories = [],
    budgetProgress = [],
  } = useAppDataContext();

  const [exportMonth, setExportMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Compute account balances from initial_balance + transactions
  const accountBalances = useMemo(() => {
    const bal = {};
    accounts.forEach(a => { bal[a.id] = parseFloat(a.initial_balance) || 0; });
    transactions.forEach(t => {
      if (t.account_id && bal[t.account_id] !== undefined) {
        if (t.type === 'income')  bal[t.account_id] += parseFloat(t.amount);
        if (t.type === 'expense') bal[t.account_id] -= parseFloat(t.amount);
      }
    });
    return bal;
  }, [accounts, transactions]);

  const fmt = n => parseFloat(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sym = currencySymbol || '₹';

  const triggerDownload = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateMonthReport = useCallback(() => {
    const [year, month] = exportMonth.split('-');
    const monthLabel = new Date(+year, +month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const monthTx  = transactions.filter(t => t.transaction_date?.startsWith(exportMonth));
    const regularTx = monthTx.filter(t => !t.transfer_id);
    const transferTx = monthTx.filter(t => t.transfer_id);

    const catIncome = {};
    const catSpend  = {};
    regularTx.forEach(t => {
      const k = t.categories?.name || 'Uncategorised';
      if (t.type === 'income')  catIncome[k] = (catIncome[k] || 0) + parseFloat(t.amount);
      if (t.type === 'expense') catSpend[k]  = (catSpend[k]  || 0) + parseFloat(t.amount);
    });
    const totalIncome  = Object.values(catIncome).reduce((s, v) => s + v, 0);
    const totalExpense = Object.values(catSpend).reduce((s, v) => s + v, 0);

    let md = `# MOMA Monthly Report — ${monthLabel}\n`;
    md += `**Currency:** ${currencyCode} | **Generated:** ${new Date().toISOString().split('T')[0]}\n\n---\n\n`;
    md += `## Summary\n- **Total Income:** ${sym}${fmt(totalIncome)}\n- **Total Spending:** ${sym}${fmt(totalExpense)}\n- **Net:** ${sym}${fmt(totalIncome - totalExpense)}\n\n`;

    md += `## Income by Category\n`;
    if (Object.keys(catIncome).length === 0) { md += `No income this month.\n`; }
    else { Object.entries(catIncome).sort((a,b) => b[1]-a[1]).forEach(([name, amt]) => { md += `- **${name}:** ${sym}${fmt(amt)} (${totalIncome > 0 ? ((amt/totalIncome)*100).toFixed(1) : 0}%)\n`; }); }

    md += `\n## Spending by Category\n`;
    if (Object.keys(catSpend).length === 0) { md += `No expenses this month.\n`; }
    else { Object.entries(catSpend).sort((a,b) => b[1]-a[1]).forEach(([name, amt], i) => {
      const budget = budgetProgress.find(b => categories.find(c => c.id === b.category_id)?.name === name);
      const budgetNote = budget ? ` | budget ${sym}${fmt(budget.limit_amount)} — ${budget.status === 'over' ? 'OVER' : 'ok'}` : '';
      md += `${i+1}. **${name}:** ${sym}${fmt(amt)} (${totalExpense > 0 ? ((amt/totalExpense)*100).toFixed(1) : 0}%)${budgetNote}\n`;
    }); }

    md += `\n## All Transactions\n| Date | Description | Category | Account | Amount | Type |\n|------|-------------|----------|---------|--------|------|\n`;
    [...regularTx].sort((a,b) => (b.transaction_date||'').localeCompare(a.transaction_date||'')).forEach(t => {
      const desc = t.parties?.name || t.note || '-';
      const cat  = t.categories?.name || '-';
      const acct = accounts.find(a => a.id === t.account_id)?.name || '-';
      const sign = t.type === 'income' ? '+' : '-';
      md += `| ${t.transaction_date} | ${desc} | ${cat} | ${acct} | ${sign}${sym}${fmt(t.amount)} | ${t.type} |\n`;
    });

    if (transferTx.length > 0) {
      const seenIds = new Set();
      md += `\n## Transfers\n| Date | Note | From | To | Amount |\n|------|------|------|----|--------|\n`;
      transferTx.forEach(t => {
        if (seenIds.has(t.transfer_id)) return;
        seenIds.add(t.transfer_id);
        const expLeg = transferTx.find(x => x.transfer_id === t.transfer_id && x.type === 'expense');
        const incLeg = transferTx.find(x => x.transfer_id === t.transfer_id && x.type === 'income');
        const from = accounts.find(a => a.id === expLeg?.account_id)?.name || '-';
        const to   = accounts.find(a => a.id === incLeg?.account_id)?.name || '-';
        md += `| ${t.transaction_date} | ${t.note || '-'} | ${from} | ${to} | ${sym}${fmt(t.amount)} |\n`;
      });
    }

    md += `\n---\n*Generated by MOMA. Paste into Claude or Gemini for AI-powered financial advice.*\n`;
    triggerDownload(md, `moma-${exportMonth}.md`);
  }, [exportMonth, transactions, accounts, categories, budgetProgress, sym, currencyCode]);


  const handleLogout = shellProps.onLogout;

  const currencyOptions = Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => ({ 
    value: code, 
    label: code + ' (' + sym + ')',
    icon: 'payments'
  }));

  return (
    <PageShell view="settings" onRefresh={refreshData} isLoading={isLoading}>
      <div className="page-inner max-w-2xl mx-auto space-y-12 pb-32 pt-4 md:pt-0 px-6">
        <div className="flex justify-between items-center px-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Settings</h2>
        </div>

        <div className="space-y-12">
          {/* Preferences Section */}
          <section className="space-y-6">
            <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase px-1">Preferences</p>
            <div className="bg-surface-lowest rounded-[2rem] p-8 md:p-10 shadow-[0_8px_24px_rgba(77,97,75,0.08)] space-y-10">
              <CustomDropdown 
                label="Primary Currency" 
                options={currencyOptions} 
                value={currencyCode} 
                onChange={setCurrencyCode} 
              />
            </div>
          </section>

          {/* Management Section */}
          <section className="space-y-6">
            <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase px-1">Manage</p>
            <div className="bg-surface-lowest rounded-[2rem] overflow-hidden shadow-[0_8px_24px_rgba(77,97,75,0.08)]">
              {[
                { key: 'account_management', label: 'Accounts', icon: 'account_balance', desc: 'Banks, wallets, and assets' },
                { key: 'category_management', label: 'Categories', icon: 'category', desc: 'Spending and income classification' },
                { key: 'party_management', label: 'Payees', icon: 'storefront', desc: 'Merchants and sources' },
                { key: 'tag_management', label: 'Tags', icon: 'label', desc: 'Custom metadata labels' }
              ].map(item => (
                <button 
                  key={item.key}
                  className="w-full p-7 flex items-center justify-between group hover:bg-surface-low transition-all text-left border-b border-outline-variant/20 last:border-0"
                  onClick={() => setView(item.key)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-11 h-11 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                      <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">{item.label}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium mt-1 opacity-60">{item.desc}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface transition-all group-hover:translate-x-1 opacity-20">chevron_right</span>
                </button>
              ))}
            </div>
          </section>

          {/* Export Section */}
          <section className="space-y-6">
            <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase px-1">Export</p>
            <div className="bg-surface-lowest rounded-[2rem] p-8 shadow-[0_8px_24px_rgba(77,97,75,0.08)] space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface tracking-tight">Monthly Report</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-1 opacity-60">All transactions · income & spending by category · transfers</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="month"
                  value={exportMonth}
                  onChange={e => setExportMonth(e.target.value)}
                  className="flex-1 bg-surface-low border border-outline-variant/30 rounded-2xl px-4 py-3 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  onClick={generateMonthReport}
                  className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-2xl font-semibold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Export
                </button>
              </div>
            </div>
          </section>

          {/* Account/Security Section */}
          <section className="space-y-6">
            <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase px-1">Account</p>
            <div className="bg-surface-lowest rounded-[2rem] p-8 shadow-[0_8px_24px_rgba(77,97,75,0.08)] space-y-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20">
                  {session?.user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold text-on-surface leading-none">{session?.user?.email}</p>
                  <p className="text-xs text-primary font-medium mt-1">Active Session</p>
                </div>
              </div>
              <button
                className="w-full bg-surface-low text-on-surface hover:bg-error hover:text-on-primary py-4 rounded-full font-semibold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
};

export default Settings;
