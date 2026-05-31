import { useMemo } from 'react';

export function useAnalyticsData({
  transactions, categories, accounts,
  dashPeriod, dashDateRange,
  catBreakdownType, drillCategory,
  filterOptions, ledgerSort,
  currencySymbol
}) {
  // ─── O(1) lookup maps — built once, reused everywhere ────────────────────
  const categoryMap = useMemo(() => {
    const m = {};
    categories.forEach(c => { m[c.id] = c; });
    return m;
  }, [categories]);

  const accountMap = useMemo(() => {
    const m = {};
    accounts.forEach(a => { m[a.id] = a; });
    return m;
  }, [accounts]);

  // drillCategory name → id (avoids repeated find by name in chart loops)
  const drillCategoryId = useMemo(() =>
    drillCategory ? categories.find(c => c.name === drillCategory)?.id : null,
  [categories, drillCategory]);

  // ─── Pre-sort transactions chronologically (ASC) once ─────────────────────
  // Transactions arrive from Supabase DESC. Reversing first so that the stable
  // sort resolves ties (same date + same created_at) in ASC order.
  const txsAsc = useMemo(() =>
    [...transactions].reverse().sort((a, b) => {
      const d = (a.transaction_date || '').localeCompare(b.transaction_date || '');
      if (d !== 0) return d;
      return (a.created_at || '').localeCompare(b.created_at || '');
    }),
  [transactions]);

  // ─── Group sorted transactions by account (for running balance) ───────────
  const txsByAccount = useMemo(() => {
    const map = {};
    txsAsc.forEach(t => {
      if (!t.account_id) return;
      if (!map[t.account_id]) map[t.account_id] = [];
      map[t.account_id].push(t);
    });
    return map;
  }, [txsAsc]);

  // ─── Account balances ─────────────────────────────────────────────────────
  const accountBalances = useMemo(() => {
    const balances = {};
    accounts.forEach(a => {
      balances[a.id] = parseFloat(a.initial_balance) || 0;
    });
    transactions.forEach(t => {
      const aid = t.account_id;
      if (!aid || balances[aid] === undefined) return;
      const amt = parseFloat(t.amount) || 0;
      const isLiability = (accountMap[aid]?.type || 'asset') === 'liability';
      if (isLiability) {
        if (t.type === 'income') balances[aid] -= amt;
        else if (t.type === 'expense') balances[aid] += amt;
      } else {
        if (t.type === 'income') balances[aid] += amt;
        else if (t.type === 'expense') balances[aid] -= amt;
      }
    });
    return balances;
  }, [accounts, transactions, accountMap]);

  const dashTransactions = useMemo(() => {
    const { start, end } = dashDateRange;
    return transactions.filter(t => {
      if (start && t.transaction_date < start) return false;
      if (end && t.transaction_date > end) return false;
      return true;
    });
  }, [transactions, dashDateRange]);

  const activeAccountIds = useMemo(() =>
    new Set(accounts.filter(a => !a.exclude_from_total).map(a => a.id)),
    [accounts]);

  const dashActiveTransactions = useMemo(() => (
    dashTransactions.filter(t => !t.transfer_id && t.account_id && activeAccountIds.has(t.account_id))
  ), [dashTransactions, activeAccountIds]);

  const { balance, totalIncome, totalExpense, runningBalances } = useMemo(() => {
    let inc = 0, exp = 0;
    dashActiveTransactions.forEach(t => {
      if (t.type === 'income') inc += parseFloat(t.amount) || 0;
      if (t.type === 'expense') exp += parseFloat(t.amount) || 0;
    });

    // Running balance per account — uses pre-sorted, pre-grouped txsByAccount
    const runBalMap = {};
    Object.entries(txsByAccount).forEach(([aid, txs]) => {
      const account = accountMap[aid];
      const isLiab = (account?.type || 'asset') === 'liability';
      let bal = parseFloat(account?.initial_balance) || 0;
      txs.forEach(t => {
        const amt = parseFloat(t.amount) || 0;
        if (isLiab) {
          if (t.type === 'income') bal -= amt;
          else if (t.type === 'expense') bal += amt;
        } else {
          if (t.type === 'income') bal += amt;
          else if (t.type === 'expense') bal -= amt;
        }
        runBalMap[t.id] = Math.round(bal * 100) / 100;
      });
    });

    // Net Worth = sum(Assets) - sum(Liabilities)
    let netWorth = 0;
    accounts.forEach(a => {
      if (a.exclude_from_total) return;
      const bal = accountBalances[a.id] || 0;
      if (a.type === 'liability') netWorth -= bal;
      else netWorth += bal;
    });

    return { balance: netWorth, totalIncome: inc, totalExpense: exp, runningBalances: runBalMap };
  }, [dashActiveTransactions, txsByAccount, accountMap, accounts, accountBalances]);

  const topCategories = useMemo(() => {
    const totals = {};
    dashActiveTransactions.forEach(t => {
      if (t.type !== 'expense' || !t.categories) return;
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
    const total = dashActiveTransactions.reduce((s, t) => t.type === 'expense' ? s + parseFloat(t.amount) : s, 0);
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
      if (t.transfer_id || !t.account_id || !activeAccountIds.has(t.account_id)) return;
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
    // Build a map of date → expense total for the last 7 days
    const dayMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i));
      dayMap[`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`] = 0;
    }
    transactions.forEach(t => {
      if (t.type !== 'expense' || t.transfer_id || !t.account_id || !activeAccountIds.has(t.account_id)) return;
      if (dayMap[t.transaction_date] !== undefined) {
        dayMap[t.transaction_date] += parseFloat(t.amount);
      }
    });
    return Object.values(dayMap);
  }, [transactions, activeAccountIds]);

  const smartInsights = useMemo(() => {
    const insights = [];
    if (topExpenseCat) {
      insights.push({ color: 'var(--primary)', title: 'Top Spending', text: `${topExpenseCat.name} is your biggest expense at ${currencySymbol}${topExpenseCat.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.` });
    }
    const partyCounts = {};
    dashTransactions.forEach(t => {
      if (t.type === 'expense' && !t.transfer_id && t.parties?.name) {
        partyCounts[t.parties.name] = (partyCounts[t.parties.name] || 0) + 1;
      }
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
      const { type, dateRange, categoryIds, tagIds, accountIds, searchTerm } = filterOptions;
      if (type !== 'all') {
        const isTx = !!t.transfer_id;
        if (type === 'transfer' && !isTx) return false;
        if (type !== 'transfer' && (isTx || t.type !== type)) return false;
      }
      if (dateRange.start && t.transaction_date < dateRange.start) return false;
      if (dateRange.end && t.transaction_date > dateRange.end) return false;
      if (categoryIds.length > 0) {
        const cat = categoryMap[t.category_id];
        if (!categoryIds.includes(t.category_id) && (!cat?.parent_id || !categoryIds.includes(cat.parent_id))) return false;
      }
      if (tagIds.length > 0 && !t.transaction_tags?.some(tt => tagIds.includes(tt.tag_id))) return false;
      if (accountIds.length > 0 && !accountIds.includes(t.account_id)) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!(t.note || '').toLowerCase().includes(s) && !(t.parties?.name || '').toLowerCase().includes(s) && !(t.categories?.name || '').toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [transactions, filterOptions, categoryMap, activeAccountIds]);

  const prevAnalyticsTransactions = useMemo(() => {
    const { start, end } = filterOptions.dateRange;
    if (!start || !end) return [];
    const duration = new Date(end) - new Date(start);
    const prevEnd = new Date(new Date(start).getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - duration);
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const ps = fmt(prevStart), pe = fmt(prevEnd);
    return transactions.filter(t =>
      t.transaction_date >= ps && t.transaction_date <= pe &&
      (t.transfer_id || (t.account_id && activeAccountIds.has(t.account_id)))
    );
  }, [transactions, filterOptions.dateRange, activeAccountIds]);

  const prevPeriodKPIs = useMemo(() => {
    let income = 0, expense = 0;
    prevAnalyticsTransactions.forEach(t => {
      if (t.transfer_id) return;
      if (t.type === 'income') income += parseFloat(t.amount);
      else expense += parseFloat(t.amount);
    });
    return { income, expense, net: income - expense };
  }, [prevAnalyticsTransactions]);

  const chartTimeSeries = useMemo(() => {
    let { start, end } = filterOptions.dateRange;
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (!start) {
      const dates = analyticsTransactions.map(t => t.transaction_date).filter(Boolean).sort();
      if (!dates.length) return [];
      start = dates[0];
      end = end || fmt(new Date());
    }
    const startD = new Date(start + 'T00:00:00');
    const endD = end ? new Date(end + 'T00:00:00') : new Date();
    const dayCount = Math.ceil((endD - startD) / 86400000) + 1;

    // Reusable drill filter using pre-computed drillCategoryId
    const matchesDrill = t => !drillCategory || t.categories?.name === drillCategory || categoryMap[t.category_id]?.parent_id === drillCategoryId;

    if (dayCount > 180) {
      const data = {};
      analyticsTransactions.forEach(t => {
        if (t.transfer_id || !matchesDrill(t)) return;
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
      analyticsTransactions.forEach(t => {
        if (t.transfer_id || !matchesDrill(t) || !data[t.transaction_date]) return;
        if (t.type === 'income') data[t.transaction_date].income += parseFloat(t.amount);
        if (t.type === 'expense') data[t.transaction_date].expense += parseFloat(t.amount);
      });
      const result = Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
      return result.map((d, i, arr) => {
        const window = arr.slice(Math.max(0, i - 6), i + 1);
        const sum = window.reduce((s, x) => s + x.expense, 0);
        return { ...d, net: d.income - d.expense, expenseMA: sum / window.length };
      });
    }
  }, [analyticsTransactions, filterOptions.dateRange, drillCategory, drillCategoryId, categoryMap]);

  const chartCategorical = useMemo(() => {
    const parentMap = {};
    analyticsTransactions.forEach(t => {
      if (t.type !== catBreakdownType || t.transfer_id || !t.categories) return;
      const cat = categoryMap[t.category_id];
      const parentId = cat?.parent_id || t.category_id;
      const parent = categoryMap[parentId];
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
  }, [analyticsTransactions, categoryMap, catBreakdownType]);

  const totalCatVal = useMemo(() =>
    chartCategorical.reduce((s, c) => s + c.value, 0),
  [chartCategorical]);

  const chartTags = useMemo(() => {
    const totals = {};
    analyticsTransactions.forEach(t => {
      if (t.transfer_id || !t.transaction_tags?.length) return;
      if (drillCategory && t.categories?.name !== drillCategory && categoryMap[t.category_id]?.parent_id !== drillCategoryId) return;
      t.transaction_tags.forEach(tt => {
        if (tt.tags?.name) totals[tt.tags.name] = (totals[tt.tags.name] || 0) + parseFloat(t.amount);
      });
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [analyticsTransactions, drillCategory, drillCategoryId, categoryMap]);

  const analyticsKPIs = useMemo(() => {
    const { start, end } = filterOptions.dateRange;
    const ms = start && end ? new Date(end) - new Date(start) + 86400000 : 30 * 86400000;
    const days = Math.max(1, Math.round(ms / 86400000));
    let totalExpense = 0, totalIncome = 0, txCount = 0;
    analyticsTransactions.forEach(t => {
      if (t.transfer_id) return;
      txCount++;
      if (t.type === 'expense') totalExpense += parseFloat(t.amount);
      if (t.type === 'income') totalIncome += parseFloat(t.amount);
    });
    return { totalExpense, totalIncome, dailyBurn: totalExpense / days, net: totalIncome - totalExpense, txCount };
  }, [analyticsTransactions, filterOptions.dateRange]);

  const topPayees = useMemo(() => {
    const totals = {};
    analyticsTransactions.forEach(t => {
      if (t.transfer_id || !t.parties?.name) return;
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
          const cat = categoryMap[t.category_id];
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
  }, [transactions, filterOptions, categoryMap]);

  const groupedLedger = useMemo(() => {
    const amtOf = t => parseFloat(t.amount) || 0;
    if (ledgerSort === 'amount_desc' || ledgerSort === 'amount_asc') {
      const dir = ledgerSort === 'amount_desc' ? -1 : 1;
      const sorted = [...filteredLedger].sort((a, b) => dir * (amtOf(a) - amtOf(b)));
      return sorted.length ? [['__flat__', sorted]] : [];
    }

    // Group by transaction_date
    const groups = {};
    filteredLedger.forEach(t => {
      const d = t.transaction_date || t.created_at?.split('T')[0] || 'Unknown';
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });

    // Within each date group: most recently CREATED transaction first
    Object.values(groups).forEach(txs =>
      txs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    );

    // Sort date groups by transaction_date (desc by default, asc if requested)
    const dir = ledgerSort === 'date_asc' ? 1 : -1;
    return Object.entries(groups).sort(([a], [b]) => dir * a.localeCompare(b));
  }, [filteredLedger, ledgerSort]);

  // Balance over the selected date range, per day (or per month for long ranges).
  const chartNetWorth = useMemo(() => {
    let { start, end } = filterOptions.dateRange;
    const { accountIds } = filterOptions;
    if (!accounts.length) return [];

    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (!start) {
      const dates = transactions.map(t => t.transaction_date).filter(Boolean).sort();
      if (!dates.length) return [];
      start = dates[0];
      end = end || fmt(new Date());
    }
    const startD = new Date(start + 'T00:00:00');
    const endD = end ? new Date(end + 'T00:00:00') : new Date();
    const dayCount = Math.ceil((endD - startD) / 86400000) + 1;
    const endStr = end || fmt(new Date());

    const acctMap = {};
    accounts.forEach(a => {
      if (a.exclude_from_total) return;
      if (accountIds.length > 0 && !accountIds.includes(a.id)) return;
      acctMap[a.id] = a;
    });
    const nwSign = (a) => a.type === 'liability' ? -1 : 1;

    const baseDateStr = fmt(new Date(startD.getTime() - 86400000));
    const perAcctBal = {};
    Object.values(acctMap).forEach(a => { perAcctBal[a.id] = parseFloat(a.initial_balance) || 0; });
    transactions.forEach(t => {
      if (!t.account_id || !acctMap[t.account_id]) return;
      if (t.transaction_date <= baseDateStr) {
        const isLiab = acctMap[t.account_id].type === 'liability';
        const amt = parseFloat(t.amount) || 0;
        if (isLiab) {
          if (t.type === 'income') perAcctBal[t.account_id] -= amt;
          else if (t.type === 'expense') perAcctBal[t.account_id] += amt;
        } else {
          if (t.type === 'income') perAcctBal[t.account_id] += amt;
          else if (t.type === 'expense') perAcctBal[t.account_id] -= amt;
        }
      }
    });

    const useMonthly = dayCount > 180;

    const acctDeltas = {};
    Object.keys(acctMap).forEach(id => { acctDeltas[id] = {}; });
    transactions.forEach(t => {
      if (!t.account_id || !acctMap[t.account_id]) return;
      if (t.transaction_date < start || t.transaction_date > endStr) return;
      const key = useMonthly ? t.transaction_date.slice(0, 7) : t.transaction_date;
      const isLiab = acctMap[t.account_id].type === 'liability';
      const amt = parseFloat(t.amount) || 0;
      const delta = isLiab
        ? (t.type === 'expense' ? 1 : t.type === 'income' ? -1 : 0) * amt
        : (t.type === 'income' ? 1 : t.type === 'expense' ? -1 : 0) * amt;
      acctDeltas[t.account_id][key] = (acctDeltas[t.account_id][key] || 0) + delta;
    });

    const makePoint = (key, label) => {
      Object.keys(acctMap).forEach(id => {
        perAcctBal[id] += acctDeltas[id][key] || 0;
      });
      const accountBreakdown = {};
      let nw = 0;
      Object.entries(acctMap).forEach(([id, a]) => {
        const bal = Math.round(perAcctBal[id] * 100) / 100;
        accountBreakdown[a.name] = nwSign(a) * bal;
        nw += nwSign(a) * bal;
      });
      return { date: key, label, netWorth: Math.round(nw * 100) / 100, accounts: accountBreakdown };
    };

    if (!useMonthly) {
      const result = [];
      for (let i = 0; i < dayCount; i++) {
        const d = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + i);
        result.push(makePoint(fmt(d), d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })));
      }
      return result;
    } else {
      const monthKeys = new Set();
      for (let i = 0; i < dayCount; i++) {
        const d = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + i);
        monthKeys.add(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
      }
      return [...monthKeys].sort().map(key =>
        makePoint(key, new Date(key + '-01T12:00:00').toLocaleDateString(undefined, { month: 'short', year: '2-digit' }))
      );
    }
  }, [accounts, transactions, filterOptions.dateRange, filterOptions.accountIds]);

  return {
    accountBalances, dashDateRange, dashTransactions, activeAccountIds, dashActiveTransactions,
    balance, totalIncome, totalExpense, topCategories, topExpenseCat, savingsRate, burnRate,
    portfolioChange, sparklineData, smartInsights, analyticsTransactions,
    prevAnalyticsTransactions, prevPeriodKPIs, chartTimeSeries, chartCategorical, chartTags,
    analyticsKPIs, filteredLedger, groupedLedger, totalCatVal, topPayees, chartNetWorth, runningBalances
  };
}
