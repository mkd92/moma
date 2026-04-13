import { useMemo } from 'react';

export function useAnalyticsData({
  transactions, categories, accounts,
  dashPeriod, dashDateRange,
  analyticsFilters,
  catBreakdownType, drillCategory,
  filterOptions, ledgerSort,
  currencySymbol
}) {
  const accountBalances = useMemo(() => {
    const balances = {};
    accounts.forEach(a => { balances[a.id] = parseFloat(a.initial_balance) || 0; });
    transactions.forEach(t => {
      if (t.account_id && balances[t.account_id] !== undefined) {
        if (t.type === 'income') balances[t.account_id] += parseFloat(t.amount);
        if (t.type === 'expense') balances[t.account_id] -= parseFloat(t.amount);
      }
    });
    return balances;
  }, [accounts, transactions]);

  const dashTransactions = useMemo(() => {
    const { start, end } = dashDateRange;
    return transactions.filter(t => {
      if (start && t.transaction_date < start) return false;
      if (end && t.transaction_date > end) return false;
      return true;
    });
  }, [transactions, dashDateRange]);

  const activeAccountIds = useMemo(() =>
    new Set(accounts.filter(a =>
      !a.exclude_from_total && (a.type || 'asset') === 'asset'
    ).map(a => a.id)),
    [accounts]);

  const dashActiveTransactions = useMemo(() => (
    dashTransactions.filter(t => !t.transfer_id && t.account_id && activeAccountIds.has(t.account_id))
  ), [dashTransactions, activeAccountIds]);

  const { balance, totalIncome, totalExpense } = useMemo(() => {
    let inc = 0, exp = 0;
    dashActiveTransactions.forEach(t => {
      if (t.type === 'income') inc += parseFloat(t.amount);
      if (t.type === 'expense') exp += parseFloat(t.amount);
    });
    const accInitial = accounts.filter(a => !a.exclude_from_total && (a.type || 'asset') === 'asset').reduce((s, a) => s + parseFloat(a.initial_balance || 0), 0);
    let allInc = 0, allExp = 0;
    transactions.forEach(t => {
      if (!t.account_id || !activeAccountIds.has(t.account_id)) return;
      if (t.type === 'income') allInc += parseFloat(t.amount);
      if (t.type === 'expense') allExp += parseFloat(t.amount);
    });
    return { balance: accInitial + allInc - allExp, totalIncome: inc, totalExpense: exp };
  }, [dashActiveTransactions, transactions, accounts, activeAccountIds]);

  const topCategories = useMemo(() => {
    const totals = {};
    dashActiveTransactions.filter(t => t.type === 'expense' && t.categories).forEach(t => {
      const { name, icon } = t.categories;
      if (!totals[name]) totals[name] = { amount: 0, icon: icon || '•' };
      totals[name].amount += parseFloat(t.amount);
    });
    return Object.entries(totals)
      .map(([name, { amount, icon }]) => ({ name, amount, icon }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [dashActiveTransactions]);

  const topExpenseCat = topCategories[0] || null;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : null;

  const burnRate = useMemo(() => {
    const { start, end } = dashDateRange;
    const ms = start && end ? new Date(end) - new Date(start) + 86400000 : 30 * 86400000;
    const days = Math.max(1, Math.round(ms / 86400000));
    const total = dashActiveTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
    return total / days;
  }, [dashActiveTransactions, dashDateRange]);

  const portfolioChange = useMemo(() => {
    const { start, end } = dashDateRange;
    if (!start || !end) return null;
    const duration = new Date(end) - new Date(start);
    const prevEnd = new Date(new Date(start).getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - duration);
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const ps = fmt(prevStart), pe = fmt(prevEnd);
    let curr = 0, prev = 0;
    transactions.forEach(t => {
      if (t.transfer_id) return;
      if (!t.account_id || !activeAccountIds.has(t.account_id)) return;
      const amt = parseFloat(t.amount) * (t.type === 'income' ? 1 : -1);
      if (t.transaction_date >= start && t.transaction_date <= end) curr += amt;
      if (t.transaction_date >= ps && t.transaction_date <= pe) prev += amt;
    });
    if (prev === 0) return curr > 0 ? 100 : (curr < 0 ? -100 : null);
    return Math.round(((curr - prev) / Math.abs(prev)) * 100);
  }, [transactions, dashDateRange, activeAccountIds]);

  const sparklineData = useMemo(() => {
    const pad = n => String(n).padStart(2, '0');
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i));
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      return transactions.filter(t => t.transaction_date === key && t.type === 'expense' && !t.transfer_id && t.account_id && activeAccountIds.has(t.account_id)).reduce((s, t) => s + parseFloat(t.amount), 0);
    });
  }, [transactions, activeAccountIds]);

  const smartInsights = useMemo(() => {
    const insights = [];
    if (topExpenseCat) {
      insights.push({ color: 'var(--primary)', title: 'Top Spending', text: `${topExpenseCat.name} is your biggest expense at ${currencySymbol}${topExpenseCat.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.` });
    }
    const partyCounts = {};
    dashTransactions.filter(t => t.type === 'expense' && !t.transfer_id && t.parties?.name).forEach(t => {
      partyCounts[t.parties.name] = (partyCounts[t.parties.name] || 0) + 1;
    });
    const recurring = Object.entries(partyCounts).filter(([, c]) => c >= 2).map(([n]) => n);
    if (recurring.length > 0) {
      insights.push({ color: 'var(--error)', title: 'Recurring Charges', text: `${recurring.slice(0, 3).join(', ')} appear multiple times this period.` });
    }
    if (savingsRate !== null && savingsRate < 0) {
      insights.push({ color: 'var(--error)', title: 'Overspending Alert', text: `Expenses exceed income by ${currencySymbol}${Math.abs(totalExpense - totalIncome).toLocaleString()} this period.` });
    } else if (savingsRate !== null && savingsRate >= 20) {
      insights.push({ color: 'var(--secondary)', title: 'Savings Opportunity', text: `You're saving ${savingsRate}% of income. Consider moving the surplus to a high-yield account.` });
    }
    if (insights.length === 0) {
      insights.push({ color: 'var(--on-surface-variant)', title: 'No Data', text: 'No transactions recorded in this period. Add a transaction to see insights.' });
    }
    return insights;
  }, [dashTransactions, topExpenseCat, savingsRate, totalIncome, totalExpense, currencySymbol]);

  const analyticsTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.transfer_id && t.account_id && !activeAccountIds.has(t.account_id)) return false;
      const { type, dateRange, categoryIds, tagIds, accountIds, searchTerm } = analyticsFilters;
      if (type !== 'all') {
        const isTx = !!t.transfer_id;
        if (type === 'transfer' && !isTx) return false;
        if (type !== 'transfer' && (isTx || t.type !== type)) return false;
      }
      if (dateRange.start && t.transaction_date < dateRange.start) return false;
      if (dateRange.end && t.transaction_date > dateRange.end) return false;
      if (categoryIds.length > 0) {
        const cat = categories.find(c => c.id === t.category_id);
        if (!categoryIds.includes(t.category_id) && (!cat?.parent_id || !categoryIds.includes(cat.parent_id))) return false;
      }
      if (tagIds.length > 0 && !t.transaction_tags?.some(tt => tagIds.includes(tt.tag_id))) return false;
      if (accountIds.length > 0 && !accountIds.includes(t.account_id)) return false;
      if (searchTerm) { const s = searchTerm.toLowerCase(); if (!(t.note || '').toLowerCase().includes(s) && !(t.parties?.name || '').toLowerCase().includes(s) && !(t.categories?.name || '').toLowerCase().includes(s)) return false; }
      return true;
    });
  }, [transactions, analyticsFilters, categories, activeAccountIds]);

  const prevAnalyticsTransactions = useMemo(() => {
    const { start, end } = analyticsFilters.dateRange;
    if (!start || !end) return [];
    const duration = new Date(end) - new Date(start);
    const prevEnd = new Date(new Date(start).getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - duration);
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const ps = fmt(prevStart), pe = fmt(prevEnd);
    return transactions.filter(t =>
      t.transaction_date >= ps && t.transaction_date <= pe &&
      (!t.account_id || t.transfer_id || activeAccountIds.has(t.account_id))
    );
  }, [transactions, analyticsFilters.dateRange, activeAccountIds]);

  const prevPeriodKPIs = useMemo(() => {
    let income = 0, expense = 0;
    prevAnalyticsTransactions.filter(t => !t.transfer_id).forEach(t => {
      if (t.type === 'income') income += parseFloat(t.amount);
      else expense += parseFloat(t.amount);
    });
    return { income, expense, net: income - expense };
  }, [prevAnalyticsTransactions]);

  const chartTimeSeries = useMemo(() => {
    const { start, end } = analyticsFilters.dateRange;
    if (!start) return [];
    const pad = n => String(n).padStart(2, '0');
    const startD = new Date(start + 'T00:00:00');
    const endD = end ? new Date(end + 'T00:00:00') : new Date();
    const dayCount = Math.ceil((endD - startD) / 86400000) + 1;

    if (dayCount > 180) {
      const data = {};
      analyticsTransactions.filter(t => !t.transfer_id && (!drillCategory || t.categories?.name === drillCategory || categories.find(c => c.id === t.category_id)?.parent_id === categories.find(c => c.name === drillCategory)?.id)).forEach(t => {
        const key = t.transaction_date.slice(0, 7);
        if (!data[key]) data[key] = { date: key, income: 0, expense: 0, label: new Date(key + '-01T12:00:00').toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) };
        if (t.type === 'income') data[key].income += parseFloat(t.amount);
        if (t.type === 'expense') data[key].expense += parseFloat(t.amount);
      });
      return Object.values(data).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({ ...d, net: d.income - d.expense }));
    } else {
      const data = {};
      for (let i = 0; i < dayCount; i++) {
        const d = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + i);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        data[key] = { date: key, income: 0, expense: 0, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
      }
      analyticsTransactions.filter(t => !t.transfer_id && (!drillCategory || t.categories?.name === drillCategory || categories.find(c => c.id === t.category_id)?.parent_id === categories.find(c => c.name === drillCategory)?.id)).forEach(t => {
        if (data[t.transaction_date]) {
          if (t.type === 'income') data[t.transaction_date].income += parseFloat(t.amount);
          if (t.type === 'expense') data[t.transaction_date].expense += parseFloat(t.amount);
        }
      });
      const result = Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
      return result.map((d, i, arr) => {
        const window = arr.slice(Math.max(0, i - 6), i + 1);
        const sum = window.reduce((s, x) => s + x.expense, 0);
        return { ...d, net: d.income - d.expense, expenseMA: sum / window.length };
      });
    }
  }, [analyticsTransactions, analyticsFilters.dateRange, drillCategory, categories]);

  const chartCategorical = useMemo(() => {
    const parentMap = {};
    analyticsTransactions.filter(t => t.type === catBreakdownType && !t.transfer_id && t.categories).forEach(t => {
      const cat = categories.find(c => c.id === t.category_id);
      const parentId = cat?.parent_id || t.category_id;
      const parent = categories.find(c => c.id === parentId);
      const parentName = parent?.name || cat?.name || 'Other';
      if (!parentMap[parentId]) parentMap[parentId] = { name: parentName, id: parentId, value: 0, subs: {} };
      parentMap[parentId].value += parseFloat(t.amount);
      if (cat?.parent_id) {
        const sk = cat.id;
        if (!parentMap[parentId].subs[sk]) parentMap[parentId].subs[sk] = { name: cat.name, id: cat.id, value: 0 };
        parentMap[parentId].subs[sk].value += parseFloat(t.amount);
      }
    });
    return Object.values(parentMap)
      .sort((a, b) => b.value - a.value)
      .map(p => ({
        ...p,
        value: Math.round(p.value * 100) / 100,
        subs: Object.values(p.subs).sort((a, b) => b.value - a.value).map(s => ({ ...s, value: Math.round(s.value * 100) / 100 })),
      }));
  }, [analyticsTransactions, categories, catBreakdownType]);

  const totalCatVal = useMemo(() => 
    chartCategorical.reduce((s, c) => s + c.value, 0),
  [chartCategorical]);

  const chartTags = useMemo(() => {
    const totals = {};
    analyticsTransactions.filter(t => !t.transfer_id && t.transaction_tags?.length > 0 && (!drillCategory || t.categories?.name === drillCategory || categories.find(c => c.id === t.category_id)?.parent_id === categories.find(c => c.name === drillCategory)?.id)).forEach(t => {
      t.transaction_tags.forEach(tt => {
        if (tt.tags?.name) totals[tt.tags.name] = (totals[tt.tags.name] || 0) + parseFloat(t.amount);
      });
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [analyticsTransactions, drillCategory, categories]);

  const analyticsKPIs = useMemo(() => {
    const { start, end } = analyticsFilters.dateRange;
    const ms = start && end ? new Date(end) - new Date(start) + 86400000 : 30 * 86400000;
    const days = Math.max(1, Math.round(ms / 86400000));
    let totalExpense = 0, totalIncome = 0;
    analyticsTransactions.filter(t => !t.transfer_id).forEach(t => {
      if (t.type === 'expense') totalExpense += parseFloat(t.amount);
      if (t.type === 'income') totalIncome += parseFloat(t.amount);
    });
    return { totalExpense, totalIncome, dailyBurn: totalExpense / days, net: totalIncome - totalExpense, txCount: analyticsTransactions.filter(t => !t.transfer_id).length };
  }, [analyticsTransactions, analyticsFilters.dateRange]);

  const topPayees = useMemo(() => {
    const totals = {};
    analyticsTransactions.filter(t => !t.transfer_id && t.parties?.name).forEach(t => {
      const name = t.parties.name;
      totals[name] = (totals[name] || 0) + parseFloat(t.amount);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [analyticsTransactions]);

  const filteredLedger = useMemo(() => {
    return transactions.filter(t => {
      const { type, dateRange, categoryIds, tagIds, accountIds, searchTerm } = filterOptions;
      if (type !== 'all') {
        const isTransfer = !!t.transfer_id;
        if (type === 'transfer' && !isTransfer) return false;
        if (type !== 'transfer' && (isTransfer || t.type !== type)) return false;
      }
      if (dateRange.start && t.transaction_date < dateRange.start) return false;
      if (dateRange.end && t.transaction_date > dateRange.end) return false;
      if (categoryIds.length > 0) {
        if (t.transfer_id) return false;
        const wantUncat = categoryIds.includes('__uncategorized__');
        if (!t.category_id) { if (!wantUncat) return false; }
        else {
          const cat = categories.find(c => c.id === t.category_id);
          if (!categoryIds.includes(t.category_id) && (!cat?.parent_id || !categoryIds.includes(cat.parent_id))) return false;
        }
      }
      if (tagIds.length > 0 && !t.transaction_tags?.some(tt => tagIds.includes(tt.tag_id))) return false;
      if (accountIds.length > 0 && !accountIds.includes(t.account_id)) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const amountStr = (parseFloat(t.amount) || 0).toFixed(2);
        if (
          !(t.note || '').toLowerCase().includes(s) &&
          !(t.parties?.name || '').toLowerCase().includes(s) &&
          !(t.categories?.name || '').toLowerCase().includes(s) &&
          !amountStr.includes(s)
        ) return false;
      }
      return true;
    });
  }, [transactions, filterOptions, categories]);

  const groupedLedger = useMemo(() => {
    const amtOf = t => parseFloat(t.amount) || 0;
    if (ledgerSort === 'amount_desc' || ledgerSort === 'amount_asc') {
      const dir = ledgerSort === 'amount_desc' ? -1 : 1;
      const sorted = [...filteredLedger].sort((a, b) => dir * (amtOf(a) - amtOf(b)));
      return sorted.length ? [['__flat__', sorted]] : [];
    }
    const groups = {};
    filteredLedger.forEach(t => {
      const d = t.transaction_date || t.created_at?.split('T')[0] || 'Unknown';
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });
    const dir = ledgerSort === 'date_asc' ? 1 : -1;
    return Object.entries(groups).sort(([a], [b]) => dir * a.localeCompare(b));
  }, [filteredLedger, ledgerSort]);

  // Net worth over the selected date range, per day (or per month for long ranges).
  // Uses the same formula as the dashboard: liability account balances are SUBTRACTED
  // from net worth (assets + investments − liabilities).
  const chartNetWorth = useMemo(() => {
    const { start, end } = analyticsFilters.dateRange;
    if (!start || !accounts.length) return [];

    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const startD = new Date(start + 'T00:00:00');
    const endD = end ? new Date(end + 'T00:00:00') : new Date();
    const dayCount = Math.ceil((endD - startD) / 86400000) + 1;
    const endStr = end || fmt(new Date());

    // Non-excluded accounts only; liability accounts contribute negatively to net worth
    const acctMap = {};
    accounts.forEach(a => { if (!a.exclude_from_total) acctMap[a.id] = a; });
    const nwSign = (a) => a.type === 'liability' ? -1 : 1;

    // Net worth at the day BEFORE start:
    //   seed each account's running balance from initial_balance, then apply all
    //   prior transactions (including transfers, which cancel across accounts).
    const baseDateStr = fmt(new Date(startD.getTime() - 86400000));
    const runningBal = {};
    Object.values(acctMap).forEach(a => { runningBal[a.id] = parseFloat(a.initial_balance) || 0; });
    transactions.forEach(t => {
      if (!t.account_id || !acctMap[t.account_id]) return;
      if (t.transaction_date <= baseDateStr) {
        runningBal[t.account_id] += (t.type === 'income' ? 1 : t.type === 'expense' ? -1 : 0) * (parseFloat(t.amount) || 0);
      }
    });
    let baseNW = Object.entries(runningBal).reduce((s, [id, bal]) => s + nwSign(acctMap[id]) * bal, 0);

    const useMonthly = dayCount > 180;

    // Build net-worth delta map (daily or monthly).
    // Apply nwSign so liability transactions flip sign, matching the dashboard formula.
    // Include transfers: they cancel across accounts when both sides are non-excluded.
    const deltas = {};
    transactions.forEach(t => {
      if (!t.account_id || !acctMap[t.account_id]) return;
      if (t.transaction_date < start || t.transaction_date > endStr) return;
      const key = useMonthly ? t.transaction_date.slice(0, 7) : t.transaction_date;
      const txDelta = (t.type === 'income' ? 1 : t.type === 'expense' ? -1 : 0) * (parseFloat(t.amount) || 0);
      deltas[key] = (deltas[key] || 0) + nwSign(acctMap[t.account_id]) * txDelta;
    });

    if (!useMonthly) {
      const result = [];
      let nw = baseNW;
      for (let i = 0; i < dayCount; i++) {
        const d = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + i);
        const key = fmt(d);
        nw += deltas[key] || 0;
        result.push({ date: key, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), netWorth: Math.round(nw * 100) / 100 });
      }
      return result;
    } else {
      const monthKeys = new Set();
      for (let i = 0; i < dayCount; i++) {
        const d = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + i);
        monthKeys.add(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
      }
      const result = [];
      let nw = baseNW;
      [...monthKeys].sort().forEach(key => {
        nw += deltas[key] || 0;
        result.push({ date: key, label: new Date(key + '-01T12:00:00').toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), netWorth: Math.round(nw * 100) / 100 });
      });
      return result;
    }
  }, [accounts, transactions, analyticsFilters.dateRange]);

  return {
    accountBalances, dashDateRange, dashTransactions, activeAccountIds, dashActiveTransactions,
    balance, totalIncome, totalExpense, topCategories, topExpenseCat, savingsRate, burnRate,
    portfolioChange, sparklineData, smartInsights, analyticsTransactions,
    prevAnalyticsTransactions, prevPeriodKPIs, chartTimeSeries, chartCategorical, chartTags,
    analyticsKPIs, filteredLedger, groupedLedger, totalCatVal, topPayees, chartNetWorth
  };
}
