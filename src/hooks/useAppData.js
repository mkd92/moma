import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { cacheGet, cacheSet } from '../cache';
import { CURRENCY_SYMBOLS } from '../constants';

export function useAppData(session, navigate, pathname) {
  const userIdRef = useRef(null);
  // Data State
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parties, setParties] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tags, setTags] = useState([]);
  const [budgets, setBudgets] = useState([]);

  // Profile State
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [defaultAccountId, setDefaultAccountId] = useState(null);

  // Filter States
  const [dashPeriod, setDashPeriod] = useState('this_month');
  const [analyticsFilters, setAnalyticsFilters] = useState(() => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return {
      type: 'all',
      dateRange: {
        start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0))
      },
      categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'this_month'
    };
  });
  const [filterOptions, setFilterOptions] = useState({
    type: 'all', dateRange: { start: '', end: '' },
    categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'all'
  });
  const [ledgerSort, setLedgerSort] = useState('date_desc');
  const [drillCategory, setDrillCategory] = useState(null);
  const [catBreakdownType, setCatBreakdownType] = useState('expense');
  const [settingsType, setSettingsType] = useState('expense');

  // Bulk selection state (ledger)
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState(null);

  // Advanced Filters Visibility
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAnalyticsFilters, setShowAnalyticsFilters] = useState(false);

  // Fetch functions
  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) { 
      setCategories(data); 
      if (userIdRef.current) cacheSet(userIdRef.current, 'categories', data); 
    }
  }, []);

  const fetchParties = useCallback(async () => {
    const { data } = await supabase.from('parties').select('*').order('name');
    if (data) { 
      setParties(data); 
      if (userIdRef.current) cacheSet(userIdRef.current, 'parties', data); 
    }
  }, []);

  const fetchTags = useCallback(async () => {
    const { data } = await supabase.from('tags').select('*').order('name');
    if (data) { 
      setTags(data); 
      if (userIdRef.current) cacheSet(userIdRef.current, 'tags', data); 
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    const { data } = await supabase.from('accounts').select('*').order('name');
    if (data) { 
      setAccounts(data); 
      if (userIdRef.current) cacheSet(userIdRef.current, 'accounts', data); 
    }
  }, []);

  const fetchBudgets = useCallback(async () => {
    const { data } = await supabase.from('budgets').select('*').order('created_at');
    if (data) setBudgets(data);
  }, []);

  const fetchProfile = useCallback(async (activeSession) => {
    if (!activeSession) return;
    const { data } = await supabase.from('profiles').select('currency_preference, default_account_id').eq('id', activeSession.user.id).maybeSingle();
    if (data?.currency_preference) {
      setCurrencyCode(data.currency_preference);
      setCurrencySymbol(CURRENCY_SYMBOLS[data.currency_preference] || '$');
    }
    if (data?.default_account_id) setDefaultAccountId(data.default_account_id);
  }, []);

  const fetchTransactions = useCallback(async () => {
    let { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name, icon, type), parties(name), accounts(name), transaction_tags(tag_id, tags(id, name))')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error && error.code === 'PGRST200') {
      ({ data, error } = await supabase
        .from('transactions')
        .select('*, categories(name, icon, type), parties(name), accounts(name)')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }));
    }

    if (error) return console.error('Error fetching transactions:', error);
    const txData = data || [];
    setTransactions(txData);
    if (userIdRef.current) cacheSet(userIdRef.current, 'transactions', txData);
  }, []);

  const fetchInitialData = useCallback(async (activeSession) => {
    const uid = activeSession?.user?.id;
    userIdRef.current = uid;

    if (uid) {
      const cached = {
        categories: cacheGet(uid, 'categories'),
        parties: cacheGet(uid, 'parties'),
        tags: cacheGet(uid, 'tags'),
        accounts: cacheGet(uid, 'accounts'),
        transactions: cacheGet(uid, 'transactions'),
      };
      if (cached.categories) setCategories(cached.categories);
      if (cached.parties) setParties(cached.parties);
      if (cached.tags) setTags(cached.tags);
      if (cached.accounts) setAccounts(cached.accounts);
      if (cached.transactions) setTransactions(cached.transactions);
    }

    await fetchProfile(activeSession);
    await Promise.all([
      fetchCategories(), 
      fetchParties(), 
      fetchAccounts(), 
      fetchTags(), 
      fetchTransactions(), 
      fetchBudgets()
    ]);
  }, [fetchProfile, fetchCategories, fetchParties, fetchAccounts, fetchTags, fetchTransactions, fetchBudgets]);

  const refreshData = useCallback(() => {
    if (session) fetchInitialData(session);
  }, [session, fetchInitialData]);

  useEffect(() => {
    if (session) {
      if (pathname === '/' || pathname === '/auth') navigate('/dashboard');
      fetchInitialData(session);
    } else {
      if (pathname !== '/' && pathname !== '/auth') navigate('/');
    }
  }, [session, pathname, navigate, fetchInitialData]);

  // Derived State
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

  const dashDateRange = useMemo(() => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (dashPeriod === 'this_month') return { start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), end: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)) };
    if (dashPeriod === 'last_month') return { start: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)), end: fmt(new Date(today.getFullYear(), today.getMonth(), 0)) };
    if (dashPeriod === 'last_3m') return { start: fmt(new Date(today.getFullYear(), today.getMonth() - 2, 1)), end: fmt(today) };
    if (dashPeriod === 'this_year') return { start: `${today.getFullYear()}-01-01`, end: `${today.getFullYear()}-12-31` };
    return { start: null, end: null };
  }, [dashPeriod]);

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

  const isWithinBudgetPeriod = (dateStr, period) => {
    const today = new Date();
    const d = new Date(dateStr + 'T12:00:00');
    if (period === 'monthly') return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
    if (period === 'weekly') {
      const dayN = today.getDay() || 7;
      const mon = new Date(today); mon.setDate(today.getDate() - dayN + 1); mon.setHours(0, 0, 0, 0);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999);
      return d >= mon && d <= sun;
    }
    return false;
  };

  const budgetProgress = useMemo(() => {
    return budgets.map(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && !t.transfer_id && isWithinBudgetPeriod(t.transaction_date, b.period) &&
          (!b.category_id || t.category_id === b.category_id || categories.find(c => c.id === t.category_id)?.parent_id === b.category_id))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const rawPct = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0;
      return { ...b, spent, rawPct, pct: Math.min(rawPct, 100), remaining: Math.max(0, b.limit_amount - spent), status: rawPct >= 100 ? 'over' : rawPct >= 80 ? 'warning' : 'ok' };
    });
  }, [budgets, transactions, categories]);

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

  // Management Actions
  const handleCreateCategory = useCallback(async (payload, editingId = null) => {
    if (!session) return;
    let error;
    if (editingId) {
      ({ error } = await supabase.from('categories').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('categories').insert([{ ...payload, user_id: session.user.id }]));
    }
    if (!error) fetchCategories();
    return error;
  }, [session, fetchCategories]);

  const handleDeleteCategory = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  }, [session, fetchCategories]);

  const handleCreateParty = useCallback(async (name) => {
    if (!session || !name.trim()) return;
    const { error } = await supabase.from('parties').insert([{ user_id: session.user.id, name: name.trim() }]);
    if (!error) fetchParties();
    return error;
  }, [session, fetchParties]);

  const handleDeleteParty = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('parties').delete().eq('id', id);
    fetchParties();
  }, [session, fetchParties]);

  const handleDeleteTransaction = useCallback(async (t) => {
    if (!session) return;
    if (t.transfer_id) {
      await supabase.from('transactions').delete().eq('transfer_id', t.transfer_id);
    } else {
      await supabase.from('transaction_tags').delete().eq('transaction_id', t.id);
      await supabase.from('transactions').delete().eq('id', t.id);
    }
    fetchTransactions();
    fetchAccounts();
  }, [session, fetchTransactions, fetchAccounts]);

  const handleCreateTag = useCallback(async (name) => {
    if (!session || !name.trim()) return;
    const { error } = await supabase.from('tags').insert([{ user_id: session.user.id, name: name.trim().toLowerCase() }]);
    if (!error) fetchTags();
    return error;
  }, [session, fetchTags]);

  const handleDeleteTag = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('tags').delete().eq('id', id);
    fetchTags();
  }, [session, fetchTags]);

  const handleCreateAccount = useCallback(async (payload) => {
    if (!session) return;
    const base = { ...payload, user_id: session.user.id };
    let { error } = await supabase.from('accounts').insert([base]);
    if (error?.code === '42703') {
      const { type, exclude_from_total, ...legacyBase } = base;
      ({ error } = await supabase.from('accounts').insert([legacyBase]));
    }
    if (!error) fetchAccounts();
    return error;
  }, [session, fetchAccounts]);

  const handleDeleteAccount = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('accounts').delete().eq('id', id);
    fetchAccounts();
  }, [session, fetchAccounts]);

  const handleUpdateAccount = useCallback(async (id, payload) => {
    if (!session) return;
    const { error } = await supabase.from('accounts').update(payload).eq('id', id);
    if (!error) fetchAccounts();
    return error;
  }, [session, fetchAccounts]);

  const handleSetDefaultAccount = useCallback(async (accountId) => {
    if (!session) return;
    const { error } = await supabase.from('profiles')
      .update({ default_account_id: accountId }).eq('id', session.user.id);
    if (!error) setDefaultAccountId(accountId);
    return error;
  }, [session]);

  const handleBulkAssignCategory = useCallback(async (category_id, txIds) => {
    if (!session || !txIds || txIds.size === 0 || !category_id) return;
    await Promise.all([...txIds].map(id =>
      supabase.from("transactions").update({ category_id }).eq("id", id)
    ));
    fetchTransactions();
  }, [session, fetchTransactions]);

  const handleSaveBudget = useCallback(async (payload, budgetId = null) => {
    if (!session) return;
    let error;
    if (budgetId) {
      ({ error } = await supabase.from('budgets').update(payload).eq('id', budgetId));
    } else {
      ({ error } = await supabase.from('budgets').insert([{ ...payload, user_id: session.user.id }]));
    }
    if (!error) fetchBudgets();
    return error;
  }, [session, fetchBudgets]);

  const updateFilter = useCallback((k, v) => setFilterOptions(p => ({ ...p, [k]: v })), []);
  const resetFilters = useCallback(() => setFilterOptions({ type: 'all', dateRange: { start: '', end: '' }, categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'all' }), []);
  const applyDatePreset = useCallback((preset) => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    let start = '', end = '';
    if (preset === 'today') { start = end = fmt(today); }
    else if (preset === 'this_week') { const day = today.getDay() || 7; const mon = new Date(today); mon.setDate(today.getDate() - day + 1); start = fmt(mon); end = fmt(today); }
    else if (preset === 'this_month') { start = fmt(new Date(today.getFullYear(), today.getMonth(), 1)); end = fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)); }
    else if (preset === 'last_3m') { start = fmt(new Date(today.getFullYear(), today.getMonth() - 2, 1)); end = fmt(today); }
    setFilterOptions(prev => ({ ...prev, preset, dateRange: { start, end } }));
  }, []);

  const updateAnalyticsFilter = useCallback((key, value) => {
    setAnalyticsFilters(prev => ({ ...prev, [key]: value, preset: key === 'preset' ? value : 'custom' }));
  }, []);

  const resetAnalyticsFilters = useCallback(() => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    setAnalyticsFilters({ type: 'all', dateRange: { start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), end: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)) }, categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'this_month' });
  }, []);

  const applyAnalyticsPreset = useCallback((preset) => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    let start = '', end = '';
    if (preset === 'today') { start = end = fmt(today); }
    else if (preset === 'this_week') { const day = today.getDay() || 7; const mon = new Date(today); mon.setDate(today.getDate() - day + 1); start = fmt(mon); end = fmt(today); }
    else if (preset === 'this_month') { start = fmt(new Date(today.getFullYear(), today.getMonth(), 1)); end = fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)); }
    else if (preset === 'last_3m') { start = fmt(new Date(today.getFullYear(), today.getMonth() - 2, 1)); end = fmt(today); }
    else if (preset === 'this_year') { start = `${today.getFullYear()}-01-01`; end = `${today.getFullYear()}-12-31`; }
    setAnalyticsFilters(prev => ({ ...prev, preset, dateRange: { start, end } }));
  }, []);

  const navToLedgerByCategory = useCallback((catId, type) => {
    resetFilters();
    updateFilter('categoryIds', [catId]);
    updateFilter('type', type);
    navigate('/ledger');
  }, [resetFilters, updateFilter, navigate]);

  return {
    transactions, categories, parties, accounts, tags, budgets,
    currencySymbol, setCurrencySymbol, currencyCode, setCurrencyCode, defaultAccountId, setDefaultAccountId,
    dashPeriod, setDashPeriod, analyticsFilters, setAnalyticsFilters, filterOptions, setFilterOptions,
    ledgerSort, setLedgerSort, drillCategory, setDrillCategory, catBreakdownType, setCatBreakdownType,
    settingsType, setSettingsType,
    bulkSelectMode, setBulkSelectMode, selectedTxIds, setSelectedTxIds, bulkCategory, setBulkCategory,
    showAdvancedFilters, setShowAdvancedFilters, showAnalyticsFilters, setShowAnalyticsFilters,
    accountBalances, dashDateRange, dashTransactions, activeAccountIds, dashActiveTransactions,
    balance, totalIncome, totalExpense, topCategories, topExpenseCat, savingsRate, burnRate,
    portfolioChange, sparklineData, smartInsights, budgetProgress, analyticsTransactions,
    prevAnalyticsTransactions, prevPeriodKPIs, chartTimeSeries, chartCategorical, chartTags,
    analyticsKPIs, filteredLedger, groupedLedger, totalCatVal, topPayees,
    fetchCategories, fetchParties, fetchTags, fetchAccounts, fetchBudgets, fetchTransactions, fetchInitialData, refreshData,
    handleCreateCategory, handleDeleteCategory, handleCreateParty, handleDeleteParty,
    handleDeleteTransaction, handleCreateTag, handleDeleteTag, handleCreateAccount,
    handleDeleteAccount, handleUpdateAccount, handleSetDefaultAccount,
    handleBulkAssignCategory, handleSaveBudget,
    updateFilter, resetFilters, applyDatePreset,
    updateAnalyticsFilter, resetAnalyticsFilters, applyAnalyticsPreset, navToLedgerByCategory
  };
}
