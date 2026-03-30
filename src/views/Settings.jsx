import React, { useCallback } from 'react';
import { PageShell } from '../components/layout';
import CustomDropdown from '../components/CustomDropdown';
import { CURRENCY_SYMBOLS } from '../constants';

const Settings = ({
  shellProps,
  currencyCode,
  setCurrencyCode,
  theme,
  toggleTheme,
  setView,
  session,
  handleLogout,
  transactions = [],
  accounts = [],
  categories = [],
  budgets = [],
  accountBalances = {},
  budgetProgress = [],
  currencySymbol = '$',
}) => {
  const generateAIReport = useCallback(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const monthLabel = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const currentMonth = today.toISOString().slice(0, 7);
    const fmt = n => parseFloat(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const netWorth = Object.values(accountBalances).reduce((s, v) => s + v, 0);

    const currentMonthTx = transactions.filter(t => t.transaction_date?.startsWith(currentMonth) && !t.transfer_id);
    const currentIncome = currentMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const currentExpense = currentMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

    const catSpend = {};
    currentMonthTx.filter(t => t.type === 'expense' && t.categories).forEach(t => { const k = t.categories.name; catSpend[k] = (catSpend[k] || 0) + parseFloat(t.amount); });
    const topCats = Object.entries(catSpend).sort((a, b) => b[1] - a[1]);

    const monthlyTotals = {};
    transactions.filter(t => !t.transfer_id).forEach(t => { const m = t.transaction_date?.slice(0, 7); if (!m) return; if (!monthlyTotals[m]) monthlyTotals[m] = { income: 0, expense: 0 }; if (t.type === 'income') monthlyTotals[m].income += parseFloat(t.amount); else monthlyTotals[m].expense += parseFloat(t.amount); });
    const last3Months = Object.entries(monthlyTotals).sort(([a], [b]) => b.localeCompare(a)).slice(0, 3);

    const recentTx = transactions.filter(t => !t.transfer_id).slice(0, 20);

    let md = `# MOMA Financial Context\n**Generated:** ${dateStr} | **Currency:** ${currencyCode}\n\n---\n\n`;
    md += `## Financial Snapshot\n- **Net Worth:** ${currencySymbol}${fmt(netWorth)}\n- **This Month (${monthLabel}):** Income ${currencySymbol}${fmt(currentIncome)} | Expenses ${currencySymbol}${fmt(currentExpense)}\n\n`;
    md += `## Account Balances\n${accounts.map(a => `- ${a.name}: ${currencySymbol}${fmt(accountBalances[a.id] || 0)}`).join('\n')}\n\n`;
    md += `## Spending by Category (${monthLabel})\n`;
    if (topCats.length === 0) { md += `No expense transactions this month.\n`; }
    else { topCats.forEach(([name, amt], i) => { const b = budgetProgress.find(b => categories.find(c => c.id === b.category_id)?.name === name); const budgetNote = b ? ` (budget: ${currencySymbol}${fmt(b.limit_amount)} — ${b.status === 'over' ? 'OVER BUDGET' : 'ok'})` : ''; md += `${i + 1}. ${name}: ${currencySymbol}${fmt(amt)}${budgetNote}\n`; }); }
    md += `\n## Budget Status\n`;
    if (budgetProgress.length === 0) { md += `No budgets configured.\n`; }
    else { budgetProgress.forEach(b => { const cat = categories.find(c => c.id === b.category_id); md += `- ${cat?.name || 'Global'}: ${currencySymbol}${fmt(b.spent)} / ${currencySymbol}${fmt(b.limit_amount)} ${b.status === 'over' ? '[OVER]' : '[ok]'}\n`; }); }
    md += `\n## Monthly Trends (Last 3 Months)\n`;
    last3Months.forEach(([month, t]) => { md += `- ${month}: Income ${currencySymbol}${fmt(t.income)} | Expenses ${currencySymbol}${fmt(t.expense)} | Net ${currencySymbol}${fmt(t.income - t.expense)}\n`; });
    md += `\n## Recent Transactions (Last 20)\n| Date | Description | Category | Amount | Type |\n|------|-------------|----------|--------|------|\n`;
    recentTx.forEach(t => { const desc = t.parties?.name || t.note || '-'; const cat = t.categories?.name || '-'; const sign = t.type === 'income' ? '+' : '-'; md += `| ${t.transaction_date} | ${desc} | ${cat} | ${sign}${currencySymbol}${fmt(t.amount)} | ${t.type} |\n`; });
    md += `\n---\n*Paste this report into Claude or Gemini for AI-powered financial advice.*\n`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moma-context-${dateStr}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transactions, accounts, categories, budgets, accountBalances, budgetProgress, currencySymbol, currencyCode]);
  const currencyOptions = Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => ({ 
    value: code, 
    label: code + ' (' + sym + ')',
    icon: 'payments'
  }));

  return (
    <PageShell {...shellProps}>
      <div className="page-inner max-w-2xl mx-auto space-y-12 pb-32 pt-4 md:pt-0 px-6">
        <div className="flex justify-between items-center px-4">
          <h2 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase">Vault Core</h2>
        </div>

        <div className="space-y-12">
          {/* Preferences Section */}
          <section className="space-y-6">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">System Config</p>
            <div className="bg-surface-low rounded-[2.5rem] border border-outline-variant/10 overflow-hidden divide-y divide-outline-variant/5 shadow-2xl">
              <div className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-on-surface/[0.02] transition-colors group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[22px]">currency_exchange</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Base Currency</p>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">Primary display unit</p>
                  </div>
                </div>
                <div className="w-full sm:w-56">
                  <CustomDropdown options={currencyOptions} value={currencyCode} onChange={setCurrencyCode} showSearch={true} />
                </div>
              </div>
            </div>
          </section>

          {/* Management Section */}
          <section className="space-y-6">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">Hierarchy Engine</p>
            <div className="bg-surface-low rounded-[2.5rem] border border-outline-variant/10 overflow-hidden divide-y divide-outline-variant/5 shadow-2xl">
              {[
                { key: 'account_management', label: 'Vault Entities', icon: 'account_balance', desc: 'Accounts, banks, and assets' },
                { key: 'category_management', label: 'Taxonomy', icon: 'category', desc: 'Transaction classifications' },
                { key: 'party_management', label: 'Nodes', icon: 'storefront', desc: 'Frequent payees and sources' },
                { key: 'tag_management', label: 'Metadata', icon: 'label', desc: 'Granular analytical labels' }
              ].map(item => (
                <button 
                  key={item.key}
                  className="w-full p-8 flex items-center justify-between group hover:bg-on-surface/[0.02] transition-all text-left"
                  onClick={() => setView(item.key)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors border border-outline-variant/5">
                      <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{item.label}</p>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">{item.desc}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-all group-hover:translate-x-1 opacity-40">chevron_right</span>
                </button>
              ))}
            </div>
          </section>

          {/* AI Integration Section */}
          <section className="space-y-6">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">Intelligence</p>
            <div className="bg-surface-low rounded-[2.5rem] border border-outline-variant/10 overflow-hidden shadow-2xl">
              <button
                className="w-full p-8 flex items-center justify-between group hover:bg-on-surface/[0.02] transition-all text-left"
                onClick={generateAIReport}
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors border border-outline-variant/5">
                    <span className="material-symbols-outlined text-[22px]">model_training</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Export for AI</p>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">Download report for Claude or Gemini</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-all opacity-40">download</span>
              </button>
            </div>
          </section>

          {/* User Section */}
          <section className="space-y-6">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">Access Control</p>
            <div className="bg-surface-low p-10 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl space-y-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-on-surface text-surface flex items-center justify-center font-black text-2xl shadow-xl">
                  {session?.user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-black text-on-surface tracking-tight leading-none">{session?.user?.email}</p>
                  <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mt-2">Vault Protocol Active</p>
                </div>
              </div>
              <button 
                className="w-full bg-on-surface/[0.03] text-on-surface hover:bg-error hover:text-on-primary py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 border border-outline-variant/10 transition-all active:scale-[0.98] group"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">power_settings_new</span>
                De-Authorize Vault
              </button>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
};

export default Settings;
