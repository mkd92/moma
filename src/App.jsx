import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from './supabaseClient';
import CustomDropdown from './components/CustomDropdown';
import './App.css';

// Constant outside component — not recreated on every render
const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };

// Module-level date formatter for transaction grouping
const formatGroupDate = (dateStr) => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

// Sidebar — desktop left-rail navigation
const Sidebar = ({ view, onDashboard, onLedger, onAnalytics, onBudgets, onNewTx, onSettings, session, onLogout }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand-wrapper">
        <div className="sidebar-brand">MOMA</div>
        <div className="sidebar-subtitle">THE DIGITAL LEDGER</div>
      </div>
      
      <nav className="sidebar-nav">
        <button className={`sidebar-item ${view === 'dashboard' ? 'active' : ''}`} onClick={onDashboard}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Portfolio
        </button>
        <button className={`sidebar-item ${view === 'ledger' ? 'active' : ''}`} onClick={onLedger}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
          </svg>
          Transactions
        </button>
        <button className={`sidebar-item ${view === 'budgets' ? 'active' : ''}`} onClick={onBudgets}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20v-6M6 20V10M18 20V4"/>
          </svg>
          Budgets
        </button>
        <button className={`sidebar-item ${view === 'analytics' ? 'active' : ''}`} onClick={onAnalytics}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"/>
          </svg>
          Analytics
        </button>
        <button className="sidebar-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Vault
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-new-tx-btn" onClick={onNewTx}>
          Add Transaction
        </button>
        <div className="sidebar-footer-item" onClick={onSettings}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Settings
        </div>
        <div className="sidebar-footer-item" onClick={onLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Logout
        </div>
      </div>
    </aside>
  );
};

const TopHeader = ({ session, onLogout }) => (
  <header className="top-header">
    <div className="search-container">
      <svg className="search-icon-top" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" placeholder="Search accounts, tags, or dates..." className="search-input-top" />
    </div>
    <div className="top-actions">
      <svg className="icon-action" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <svg className="icon-action" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
      <div className="user-profile-sm">
        <div style={{ background: 'var(--primary)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
          {session?.user?.email?.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  </header>
);

// Advanced Filter Panel Component
const FilterPanel = ({
  categories,
  tags,
  accounts,
  filterOptions,
  onUpdateFilter,
  onResetFilters
}) => {
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubs = (pid) => categories.filter(c => c.parent_id === pid);

  const toggleCategory = (id) => {
    const next = filterOptions.categoryIds.includes(id)
      ? filterOptions.categoryIds.filter(x => x !== id)
      : [...filterOptions.categoryIds, id];
    onUpdateFilter('categoryIds', next);
  };

  const toggleTag = (id) => {
    const next = filterOptions.tagIds.includes(id)
      ? filterOptions.tagIds.filter(x => x !== id)
      : [...filterOptions.tagIds, id];
    onUpdateFilter('tagIds', next);
  };

  const toggleAccount = (id) => {
    const next = filterOptions.accountIds.includes(id)
      ? filterOptions.accountIds.filter(x => x !== id)
      : [...filterOptions.accountIds, id];
    onUpdateFilter('accountIds', next);
  };

  return (
    <div className="advanced-filters slide-up" style={{ marginTop: '1.5rem', background: 'var(--surface-container-low)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
        
        {/* Type Section */}
        <div className="filter-section">
          <p className="label-sm" style={{ marginBottom: '1rem' }}>Transaction Type</p>
          <div className="type-toggle-bar" style={{ background: 'var(--surface-container-lowest)' }}>
            {['all', 'income', 'expense', 'transfer'].map(t => (
              <button
                key={t}
                className={`type-btn ${filterOptions.type === t ? (t === 'all' ? 'active-transfer' : `active-${t}`) : ''}`}
                onClick={() => onUpdateFilter('type', t)}
                style={{ textTransform: 'capitalize' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Section */}
        <div className="filter-section">
          <p className="label-sm" style={{ marginBottom: '1rem' }}>Custom Date Range</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="date"
              className="text-input"
              style={{ background: 'var(--surface-container-lowest)', fontSize: '0.8125rem' }}
              value={filterOptions.dateRange.start || ''}
              onChange={(e) => onUpdateFilter('dateRange', { ...filterOptions.dateRange, start: e.target.value })}
            />
            <input
              type="date"
              className="text-input"
              style={{ background: 'var(--surface-container-lowest)', fontSize: '0.8125rem' }}
              value={filterOptions.dateRange.end || ''}
              onChange={(e) => onUpdateFilter('dateRange', { ...filterOptions.dateRange, end: e.target.value })}
            />
          </div>
        </div>

        {/* Accounts Section */}
        <div className="filter-section">
          <p className="label-sm" style={{ marginBottom: '1rem' }}>Accounts</p>
          <div className="filter-chips">
            {accounts.map(acc => (
              <button
                key={acc.id}
                className={`filter-chip ${filterOptions.accountIds.includes(acc.id) ? 'active' : ''}`}
                onClick={() => toggleAccount(acc.id)}
                style={{ background: filterOptions.accountIds.includes(acc.id) ? 'var(--primary-light)' : 'var(--surface-container-lowest)' }}
              >
                {acc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="filter-section" style={{ gridColumn: 'span 2' }}>
          <p className="label-sm" style={{ marginBottom: '1rem' }}>Hierarchical Categories</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '1rem' }}>
            {parentCategories.map(parent => (
              <div key={parent.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label className="filter-chip" style={{ cursor: 'pointer', justifyContent: 'flex-start', gap: '0.5rem', background: filterOptions.categoryIds.includes(parent.id) ? 'var(--primary-light)' : 'var(--surface-container-lowest)', borderColor: filterOptions.categoryIds.includes(parent.id) ? 'var(--primary)' : 'var(--ghost-border)' }}>
                  <input type="checkbox" checked={filterOptions.categoryIds.includes(parent.id)} onChange={() => toggleCategory(parent.id)} style={{ display: 'none' }} />
                  <span>{parent.icon}</span>
                  <span style={{ fontWeight: 700 }}>{parent.name}</span>
                </label>
                {getSubs(parent.id).map(sub => (
                  <label key={sub.id} className="filter-chip filter-chip-sub" style={{ cursor: 'pointer', marginLeft: '1.5rem', justifyContent: 'flex-start', gap: '0.5rem', background: filterOptions.categoryIds.includes(sub.id) ? 'var(--primary-light)' : 'transparent', borderColor: filterOptions.categoryIds.includes(sub.id) ? 'var(--primary)' : 'var(--ghost-border)', opacity: filterOptions.categoryIds.includes(sub.id) ? 1 : 0.6 }}>
                    <input type="checkbox" checked={filterOptions.categoryIds.includes(sub.id)} onChange={() => toggleCategory(sub.id)} style={{ display: 'none' }} />
                    <span>{sub.icon}</span>
                    <span>{sub.name}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        <div className="filter-section" style={{ gridColumn: '1 / -1' }}>
          <p className="label-sm" style={{ marginBottom: '1rem' }}>Tags</p>
          <div className="filter-chips">
            {tags.map(tag => (
              <button
                key={tag.id}
                className={`filter-chip ${filterOptions.tagIds.includes(tag.id) ? 'active' : ''}`}
                onClick={() => toggleTag(tag.id)}
                style={{ background: filterOptions.tagIds.includes(tag.id) ? 'var(--primary-light)' : 'var(--surface-container-lowest)' }}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--ghost-border)', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="section-action-link" onClick={onResetFilters} style={{ color: 'var(--tertiary-fixed-variant)' }}>Reset All Filters</button>
      </div>
    </div>
  );
};

function App() {
  const [view, setView] = useState('landing');
  const [session, setSession] = useState(null);

  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

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

  // Transaction Form State
  const [txToEdit, setTxToEdit] = useState(null);
  const [txType, setTxType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [note, setNote] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [transferFromAccount, setTransferFromAccount] = useState(null);
  const [transferToAccount, setTransferToAccount] = useState(null);

  // Budget Form State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ id: null, category_id: null, amount_limit: '', period: 'monthly' });

  // Filter State
  const [showAdvancedFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    type: 'all', dateRange: { start: '', end: '' },
    categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'all'
  });

  // Dashboard period filter
  const [dashPeriod, setDashPeriod] = useState('this_month');

  // Analytics filter state — initialised to this month
  const [analyticsFilters, setAnalyticsFilters] = useState(() => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    return {
      type: 'all',
      dateRange: {
        start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      },
      categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'this_month',
    };
  });
  const [showAnalyticsFilters, setShowAnalyticsFilters] = useState(false);

  const updateFilter = useCallback((key, value) => {
    setFilterOptions(prev => ({ ...prev, [key]: value, preset: key === 'preset' ? value : 'custom' }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterOptions({
      type: 'all', dateRange: { start: '', end: '' },
      categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'all'
    });
  }, []);

  const applyDatePreset = useCallback((preset) => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    let start = '', end = '';
    if (preset === 'today') { start = end = fmt(today); }
    else if (preset === 'this_week') { const day = today.getDay() || 7; const mon = new Date(today); mon.setDate(today.getDate() - day + 1); start = fmt(mon); end = fmt(today); }
    else if (preset === 'this_month') { start = fmt(new Date(today.getFullYear(), today.getMonth(), 1)); end = fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)); }
    else if (preset === 'last_3m') { start = fmt(new Date(today.getFullYear(), today.getMonth() - 2, 1)); end = fmt(today); }
    setFilterOptions(prev => ({ ...prev, preset, dateRange: { start, end } }));
  }, []);

  const dashDateRange = useMemo(() => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
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

  const { balance, totalIncome, totalExpense } = useMemo(() => {
    let inc = 0, exp = 0;
    dashTransactions.forEach(t => {
      if (t.transfer_id) return;
      if (t.type === 'income') inc += parseFloat(t.amount);
      if (t.type === 'expense') exp += parseFloat(t.amount);
    });
    let accInitial = accounts.reduce((s, a) => s + parseFloat(a.initial_balance || 0), 0);
    let allInc = 0, allExp = 0;
    transactions.forEach(t => {
      if (t.transfer_id) return;
      if (t.type === 'income') allInc += parseFloat(t.amount);
      if (t.type === 'expense') allExp += parseFloat(t.amount);
    });
    return { balance: accInitial + allInc - allExp, totalIncome: inc, totalExpense: exp };
  }, [dashTransactions, transactions, accounts]);

  const topCategories = useMemo(() => {
    const totals = {};
    dashTransactions.filter(t => t.type === 'expense' && !t.transfer_id && t.categories).forEach(t => {
      const key = t.categories.name;
      totals[key] = (totals[key] || 0) + parseFloat(t.amount);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [dashTransactions]);

  const topExpenseCat = topCategories[0] || null;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : null;

  const burnRate = useMemo(() => {
    const { start, end } = dashDateRange;
    const ms = start && end ? new Date(end) - new Date(start) + 86400000 : 30 * 86400000;
    const days = Math.max(1, Math.round(ms / 86400000));
    const total = dashTransactions.filter(t => t.type === 'expense' && !t.transfer_id).reduce((s, t) => s + parseFloat(t.amount), 0);
    return total / days;
  }, [dashTransactions, dashDateRange]);

  const portfolioChange = useMemo(() => {
    const { start, end } = dashDateRange;
    if (!start || !end) return null;
    const duration = new Date(end) - new Date(start);
    const prevEnd = new Date(new Date(start).getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - duration);
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const ps = fmt(prevStart), pe = fmt(prevEnd);
    let curr = 0, prev = 0;
    transactions.forEach(t => {
      if (t.transfer_id) return;
      const amt = parseFloat(t.amount) * (t.type === 'income' ? 1 : -1);
      if (t.transaction_date >= start && t.transaction_date <= end) curr += amt;
      if (t.transaction_date >= ps && t.transaction_date <= pe) prev += amt;
    });
    if (prev === 0) return curr > 0 ? 100 : (curr < 0 ? -100 : null);
    return Math.round(((curr - prev) / Math.abs(prev)) * 100);
  }, [transactions, dashDateRange]);

  const sparklineData = useMemo(() => {
    const pad = n => String(n).padStart(2, '0');
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i));
      const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      return transactions.filter(t => t.transaction_date === key && t.type === 'expense' && !t.transfer_id).reduce((s, t) => s + parseFloat(t.amount), 0);
    });
  }, [transactions]);

  const smartInsights = useMemo(() => {
    const insights = [];
    if (topExpenseCat) {
      insights.push({ color: 'var(--primary)', title: 'Top Spending', text: `${topExpenseCat[0]} is your biggest expense at ${currencySymbol}${topExpenseCat[1].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.` });
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setView('dashboard');
        fetchInitialData(session);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN') {
        setView('dashboard');
        fetchInitialData(session);
      } else if (event === 'SIGNED_OUT') {
        setView('landing');
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchInitialData = async (activeSession) => {
    await fetchProfile(activeSession);
    await Promise.all([fetchCategories(), fetchParties(), fetchAccounts(), fetchTags(), fetchTransactions(), fetchBudgets()]);
  };

  const fetchProfile = async (activeSession) => {
    if (!activeSession) return;
    const { data } = await supabase.from('profiles').select('currency_preference, default_account_id').eq('id', activeSession.user.id).maybeSingle();
    if (data?.currency_preference) {
      setCurrencyCode(data.currency_preference);
      setCurrencySymbol(CURRENCY_SYMBOLS[data.currency_preference] || '$');
    }
    if (data?.default_account_id) setDefaultAccountId(data.default_account_id);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const fetchParties = async () => {
    const { data } = await supabase.from('parties').select('*').order('name');
    if (data) setParties(data);
  };

  const fetchTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('name');
    if (data) setTags(data);
  };

  const fetchAccounts = async () => {
    const { data } = await supabase.from('accounts').select('*').order('name');
    if (data) setAccounts(data);
  };

  const fetchBudgets = async () => {
    const { data } = await supabase.from('budgets').select('*').order('created_at');
    if (data) setBudgets(data);
  };

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

  const fetchTransactions = async () => {
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

    if (error) return console.error('Error fetching:', error);
    setTransactions(data || []);
  };

  const isWithinBudgetPeriod = (dateStr, period) => {
    const today = new Date();
    const d = new Date(dateStr + 'T12:00:00');
    if (period === 'monthly') return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
    if (period === 'weekly') {
      const dayN = today.getDay() || 7;
      const mon = new Date(today); mon.setDate(today.getDate() - dayN + 1); mon.setHours(0,0,0,0);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
      return d >= mon && d <= sun;
    }
    if (period === 'quarterly') {
      const q = Math.floor(today.getMonth() / 3);
      const qStart = new Date(today.getFullYear(), q * 3, 1);
      const qEnd = new Date(today.getFullYear(), q * 3 + 3, 0);
      return d >= qStart && d <= qEnd;
    }
    return true;
  };

  const getBudgetPeriodInfo = (period) => {
    const today = new Date();
    if (period === 'monthly') return { elapsed: today.getDate(), total: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() };
    if (period === 'weekly') return { elapsed: today.getDay() || 7, total: 7 };
    if (period === 'quarterly') {
      const q = Math.floor(today.getMonth() / 3);
      const qStart = new Date(today.getFullYear(), q * 3, 1);
      const qEnd = new Date(today.getFullYear(), q * 3 + 3, 0);
      const total = Math.ceil((qEnd - qStart) / 86400000) + 1;
      const elapsed = Math.max(1, Math.ceil((today - qStart) / 86400000) + 1);
      return { elapsed, total };
    }
    return { elapsed: 1, total: 1 };
  };

  const budgetProgress = useMemo(() => {
    return budgets.map(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && !t.transfer_id && isWithinBudgetPeriod(t.transaction_date, b.period) &&
          (!b.category_id || t.category_id === b.category_id || categories.find(c => c.id === t.category_id)?.parent_id === b.category_id))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const { elapsed, total } = getBudgetPeriodInfo(b.period);
      const projected = elapsed > 0 ? (spent / elapsed) * total : 0;
      const rawPct = b.amount_limit > 0 ? (spent / b.amount_limit) * 100 : 0;
      return { ...b, spent, projected, rawPct, pct: Math.min(rawPct, 100), remaining: Math.max(0, b.amount_limit - spent), status: rawPct >= 100 ? 'over' : rawPct >= 80 ? 'warning' : 'ok' };
    });
  }, [budgets, transactions, categories]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const { error } = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) setAuthError(error.message);
    else if (authMode === 'signup') setAuthError('Check your email to verify your account.');
    setAuthLoading(false);
  };

  const handleLogout = useCallback(async () => supabase.auth.signOut(), []);

  const handleGoogleSignIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  }, []);

  const resetForm = useCallback(() => {
    setTxToEdit(null);
    setAmount('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedParty(null);
    setSelectedAccount(defaultAccountId);
    setNote('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setSelectedTags([]);
    setTransferFromAccount(null);
    setTransferToAccount(null);
  }, [defaultAccountId]);

  const openEditTransaction = useCallback((t) => {
    setTxToEdit(t);
    setAmount(t.amount ? t.amount.toString() : '');
    setNote(t.note || '');
    setTxDate(t.transaction_date || (t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0]));
    
    if (t.transfer_id) {
      const pair = transactions.find(tx => tx.transfer_id === t.transfer_id && tx.id !== t.id);
      const expenseLeg = t.type === 'expense' ? t : pair;
      const incomeLeg = t.type === 'income' ? t : pair;
      setTxType('transfer');
      setTransferFromAccount(expenseLeg?.account_id || null);
      setTransferToAccount(incomeLeg?.account_id || null);
    } else {
      setTxType(t.type || 'expense');
      setSelectedCategory(t.category_id || null);
      setSelectedParty(t.party_id || null);
      setSelectedAccount(t.account_id || (accounts.length > 0 ? accounts[0].id : null));
      setSelectedTags((t.transaction_tags || []).map(tt => tt.tag_id));
    }
    setView('new_transaction');
  }, [transactions, accounts]);

  const handleTransaction = useCallback(async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || !session) return;

    if (txType === 'transfer') {
      if (!transferFromAccount || !transferToAccount || transferFromAccount === transferToAccount) return;
      const base = { amount: val, note: note.trim() || null, transaction_date: txDate };
      if (txToEdit?.transfer_id) {
        await supabase.from('transactions').update({ ...base, account_id: transferFromAccount }).eq('transfer_id', txToEdit.transfer_id).eq('type', 'expense');
        await supabase.from('transactions').update({ ...base, account_id: transferToAccount }).eq('transfer_id', txToEdit.transfer_id).eq('type', 'income');
      } else {
        const transferId = crypto.randomUUID();
        await supabase.from('transactions').insert([
          { ...base, type: 'expense', account_id: transferFromAccount, user_id: session.user.id, transfer_id: transferId },
          { ...base, type: 'income',  account_id: transferToAccount,   user_id: session.user.id, transfer_id: transferId },
        ]);
      }
    } else {
      const payload = { 
        amount: val, 
        type: txType, 
        category_id: selectedSubcategory || selectedCategory || null, 
        party_id: selectedParty || null, 
        account_id: selectedAccount || (accounts.length > 0 ? accounts[0].id : null), 
        note: note.trim() || null, 
        transaction_date: txDate 
      };
      
      let transactionId;
      if (txToEdit && txToEdit.id) {
        const { error } = await supabase.from('transactions').update(payload).eq('id', txToEdit.id);
        if (error) { console.error('Update error:', error); return; }
        transactionId = txToEdit.id;
      } else {
        payload.user_id = session.user.id;
        const { data, error } = await supabase.from('transactions').insert([payload]).select('id').single();
        if (error) { console.error('Insert error:', error); return; }
        transactionId = data.id;
      }
      
      if (transactionId) {
        await supabase.from('transaction_tags').delete().eq('transaction_id', transactionId);
        if (selectedTags.length > 0) {
          await supabase.from('transaction_tags').insert(selectedTags.map(tagId => ({ transaction_id: transactionId, tag_id: tagId })));
        }
      }
    }
    fetchTransactions();
    resetForm();
    setView('ledger');
  }, [amount, selectedSubcategory, selectedCategory, txType, selectedParty, selectedAccount, note, txDate, session, txToEdit, selectedTags, transferFromAccount, transferToAccount, resetForm, accounts]);

  const updateAnalyticsFilter = useCallback((key, value) => {
    setAnalyticsFilters(prev => ({ ...prev, [key]: value, preset: key === 'preset' ? value : 'custom' }));
  }, []);

  const resetAnalyticsFilters = useCallback(() => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    setAnalyticsFilters({ type: 'all', dateRange: { start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), end: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)) }, categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'this_month' });
  }, []);

  const applyAnalyticsPreset = useCallback((preset) => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    let start = '', end = '';
    if (preset === 'today') { start = end = fmt(today); }
    else if (preset === 'this_week') { const day = today.getDay() || 7; const mon = new Date(today); mon.setDate(today.getDate() - day + 1); start = fmt(mon); end = fmt(today); }
    else if (preset === 'this_month') { start = fmt(new Date(today.getFullYear(), today.getMonth(), 1)); end = fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)); }
    else if (preset === 'last_3m') { start = fmt(new Date(today.getFullYear(), today.getMonth() - 2, 1)); end = fmt(today); }
    else if (preset === 'this_year') { start = `${today.getFullYear()}-01-01`; end = `${today.getFullYear()}-12-31`; }
    setAnalyticsFilters(prev => ({ ...prev, preset, dateRange: { start, end } }));
  }, []);

  const analyticsTransactions = useMemo(() => {
    return transactions.filter(t => {
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
      if (searchTerm) { const s = searchTerm.toLowerCase(); if (!(t.note||'').toLowerCase().includes(s) && !(t.parties?.name||'').toLowerCase().includes(s) && !(t.categories?.name||'').toLowerCase().includes(s)) return false; }
      return true;
    });
  }, [transactions, analyticsFilters, categories]);

  const chartTimeSeries = useMemo(() => {
    const { start, end } = analyticsFilters.dateRange;
    if (!start) return [];
    const pad = n => String(n).padStart(2, '0');
    const startD = new Date(start + 'T00:00:00');
    const endD = end ? new Date(end + 'T00:00:00') : new Date();
    const dayCount = Math.ceil((endD - startD) / 86400000) + 1;

    if (dayCount > 180) {
      const data = {};
      analyticsTransactions.filter(t => !t.transfer_id).forEach(t => {
        const key = t.transaction_date.slice(0, 7);
        if (!data[key]) data[key] = { date: key, income: 0, expense: 0, label: new Date(key + '-01T12:00:00').toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) };
        if (t.type === 'income') data[key].income += parseFloat(t.amount);
        if (t.type === 'expense') data[key].expense += parseFloat(t.amount);
      });
      return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
    } else if (dayCount > 60) {
      const data = {};
      analyticsTransactions.filter(t => !t.transfer_id).forEach(t => {
        const d = new Date(t.transaction_date + 'T12:00:00');
        const day = d.getDay() || 7;
        const mon = new Date(d); mon.setDate(d.getDate() - day + 1);
        const key = `${mon.getFullYear()}-${pad(mon.getMonth()+1)}-${pad(mon.getDate())}`;
        if (!data[key]) data[key] = { date: key, income: 0, expense: 0, label: mon.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
        if (t.type === 'income') data[key].income += parseFloat(t.amount);
        if (t.type === 'expense') data[key].expense += parseFloat(t.amount);
      });
      return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
    } else {
      const data = {};
      for (let i = 0; i < dayCount; i++) {
        const d = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + i);
        const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
        data[key] = { date: key, income: 0, expense: 0, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
      }
      analyticsTransactions.filter(t => !t.transfer_id).forEach(t => {
        if (data[t.transaction_date]) {
          if (t.type === 'income') data[t.transaction_date].income += parseFloat(t.amount);
          if (t.type === 'expense') data[t.transaction_date].expense += parseFloat(t.amount);
        }
      });
      return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
    }
  }, [analyticsTransactions, analyticsFilters.dateRange]);

  const chartCategorical = useMemo(() => {
    const totals = {};
    analyticsTransactions.filter(t => t.type === 'expense' && !t.transfer_id && t.categories).forEach(t => {
      const cat = categories.find(c => c.id === t.category_id);
      const parentId = cat?.parent_id || t.category_id;
      const parent = categories.find(c => c.id === parentId);
      const name = parent?.name || cat?.name || 'Other';
      totals[name] = (totals[name] || 0) + parseFloat(t.amount);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [analyticsTransactions, categories]);

  const chartTags = useMemo(() => {
    const totals = {};
    analyticsTransactions.filter(t => !t.transfer_id && t.transaction_tags?.length > 0).forEach(t => {
      t.transaction_tags.forEach(tt => {
        if (tt.tags?.name) totals[tt.tags.name] = (totals[tt.tags.name] || 0) + parseFloat(t.amount);
      });
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [analyticsTransactions]);

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
        const cat = categories.find(c => c.id === t.category_id);
        if (!categoryIds.includes(t.category_id) && (!cat?.parent_id || !categoryIds.includes(cat.parent_id))) return false;
      }
      if (tagIds.length > 0 && !t.transaction_tags?.some(tt => tagIds.includes(tt.tag_id))) return false;
      if (accountIds.length > 0 && !accountIds.includes(t.account_id)) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!(t.note||'').toLowerCase().includes(s) && !(t.parties?.name||'').toLowerCase().includes(s) && !(t.categories?.name||'').toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [transactions, filterOptions, categories]);

  const groupedLedger = useMemo(() => {
    const groups = {};
    filteredLedger.forEach(t => {
      const d = t.transaction_date || t.created_at.split('T')[0];
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredLedger]);

  const navToDashboard = useCallback(() => setView('dashboard'), []);
  const navToLedger = useCallback(() => { resetForm(); setView('ledger'); }, [resetForm]);
  const navToAnalytics = useCallback(() => setView('analytics'), []);
  const navToBudgets = useCallback(() => setView('budgets'), []);
  const navToSettings = useCallback(() => setView('settings'), []);

  const handleCreateCategory = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !newCatName.trim()) return;
    const { error } = await supabase.from('categories').insert([{ user_id: session.user.id, name: newCatName.trim(), type: settingsType, icon: newCatIcon, is_system: false, parent_id: newCatParent || null }]);
    if (!error) { setNewCatName(''); setNewCatParent(''); setNewCatIcon('🔖'); fetchCategories(); }
  }, [session, newCatName, settingsType, newCatIcon, newCatParent]);

  const handleDeleteCategory = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  }, [session]);

  const handleCreateAccount = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !newAccountName.trim()) return;
    const { error } = await supabase.from('accounts').insert([{ user_id: session.user.id, name: newAccountName.trim(), initial_balance: parseFloat(newAccountBalance) || 0 }]);
    if (!error) { setNewAccountName(''); setNewAccountBalance(''); fetchAccounts(); }
  }, [session, newAccountName, newAccountBalance]);

  const handleDeleteAccount = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('accounts').delete().eq('id', id);
    fetchAccounts();
  }, [session]);

  const handleSaveBudget = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !budgetForm.amount_limit) return;
    const pad = n => String(n).padStart(2, '0');
    const today = new Date();
    const month_year = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
    const payload = { user_id: session.user.id, category_id: budgetForm.category_id, limit_amount: parseFloat(budgetForm.amount_limit), month_year };
    if (budgetForm.id) await supabase.from('budgets').update(payload).eq('id', budgetForm.id);
    else await supabase.from('budgets').insert([payload]);
    setShowBudgetModal(false);
    fetchBudgets();
  }, [session, budgetForm]);

  const PageShell = ({ children }) => (
    <div className="app-shell">
      <Sidebar view={view} onDashboard={navToDashboard} onLedger={navToLedger} onAnalytics={navToAnalytics} onBudgets={navToBudgets} onNewTx={navToNewTx} onSettings={navToSettings} session={session} onLogout={handleLogout} />
      <div className="page-content">
        <TopHeader session={session} onLogout={handleLogout} />
        {children}
      </div>
    </div>
  );

  const shellProps = { view, onDashboard: navToDashboard, onLedger: navToLedger, onAnalytics: navToAnalytics, onBudgets: navToBudgets, onNewTx: navToNewTx, onSettings: navToSettings, session, onLogout: handleLogout };

  if (view === 'landing') return (
    <div className="landing-container fade-in">
      <svg className="landing-graphic" viewBox="0 0 200 200" fill="none"><rect x="20" y="100" width="24" height="80" rx="4" stroke="#000666" strokeWidth="1.5"/><rect x="56" y="60" width="24" height="120" rx="4" stroke="#000666" strokeWidth="1.5"/><rect x="92" y="40" width="24" height="140" rx="4" stroke="#000666" strokeWidth="1.5"/><rect x="128" y="75" width="24" height="105" rx="4" stroke="#000666" strokeWidth="1.5"/><rect x="164" y="55" width="24" height="125" rx="4" stroke="#000666" strokeWidth="1.5"/><line x1="10" y1="190" x2="195" y2="190" stroke="#000666" strokeWidth="1.5"/></svg>
      <p className="landing-eyebrow">The Digital Ledger</p>
      <h1 className="hero-title">Architectural Clarity<br />for Your Wealth.</h1>
      <button className="launch-btn" onClick={() => session ? setView('dashboard') : setView('auth')}>Get Started</button>
    </div>
  );

  if (view === 'auth') return (
    <div className="auth-view fade-in">
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><button className="icon-btn-text" onClick={() => setView('landing')}>← Back</button><h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Manrope' }}>MOMA</h2></div>
        <div className="auth-box">
          <div className="auth-tabs"><button className={`auth-tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => { setAuthMode('login'); setAuthError(''); }}>Log In</button><button className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`} onClick={() => { setAuthMode('signup'); setAuthError(''); }}>Sign Up</button></div>
          <form onSubmit={handleAuth} className="auth-form"><input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required /><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />{authError && <p className="auth-error">{authError}</p>}<button type="submit" className="auth-submit-btn" disabled={authLoading}>{authLoading ? 'Authenticating...' : authMode === 'login' ? 'Enter Vault' : 'Create Account'}</button></form>
          <div className="auth-divider"><span>or continue with</span></div>
          <div className="auth-social-btns"><button type="button" className="auth-social-btn" onClick={handleGoogleSignIn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Google</button></div>
        </div>
      </div>
    </div>
  );

  if (view === 'settings' || view === 'account_management' || view === 'category_management') {
    let settingsContent;
    if (view === 'settings') settingsContent = (
      <div className="page-inner fade-in">
        <div className="section-header-row"><h2 className="section-title-editorial">Settings</h2></div>
        <div className="settings-panel"><div className="settings-section"><p className="label-sm">Preferences</p><div className="settings-group"><div className="settings-card"><span className="sc-text">Currency</span><div style={{ width: '180px' }}><CustomDropdown options={Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => ({ value: code, label: `${code} (${sym})` }))} value={currencyCode} onChange={setCurrencyCode} showSearch={false} /></div></div></div></div><div className="settings-section"><p className="label-sm">Manage</p><div className="settings-group"><button className="settings-nav-btn" onClick={() => setView('account_management')}>Accounts <span className="arrow">›</span></button><button className="settings-nav-btn" onClick={() => setView('category_management')}>Categories <span className="arrow">›</span></button></div></div></div>
      </div>
    );
    else if (view === 'account_management') settingsContent = (
      <div className="page-inner slide-up">
        <div className="page-header"><button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button><h2 className="section-title-editorial">Accounts</h2></div>
        <div className="settings-controls fade-in">
          <div className="category-manager">{accounts.map(acc => (<div key={acc.id} className="editorial-item"><div className="editorial-icon">🏦</div><div className="editorial-info"><div className="editorial-title">{acc.name}</div><div className="editorial-meta">Balance: {currencySymbol}{(accountBalances[acc.id]||0).toFixed(2)}</div></div><button className="delete-btn" onClick={() => handleDeleteAccount(acc.id)}>✕</button></div>))}</div>
          <form onSubmit={handleCreateAccount} className="add-category-form"><p className="label-sm">Add Account</p><input type="text" placeholder="Account Name" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} required /><input type="number" step="0.01" placeholder="Initial Balance" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} required /><button type="submit" className="add-cat-btn">Add Account</button></form>
        </div>
      </div>
    );
    else if (view === 'category_management') {
      const parents = categories.filter(c => !c.parent_id && c.type === settingsType);
      settingsContent = (
        <div className="page-inner slide-up">
          <div className="page-header"><button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button><h2 className="section-title-editorial">Categories</h2></div>
          <div className="type-toggle-bar" style={{ margin: '1.5rem 0' }}><button className={`type-btn ${settingsType === 'expense' ? 'active-expense' : ''}`} onClick={() => setSettingsType('expense')}>Expense</button><button className={`type-btn ${settingsType === 'income' ? 'active-income' : ''}`} onClick={() => setSettingsType('income')}>Income</button></div>
          <div className="category-manager" style={{ marginBottom: '2rem' }}>{categories.filter(c => c.type === settingsType).map(c => (<div key={c.id} className="editorial-item"><div className="editorial-icon">{c.icon}</div><div className="editorial-info"><div className="editorial-title">{c.name}</div><div className="editorial-meta">{c.parent_id ? 'Subcategory' : 'Root'}</div></div>{!c.is_system && <button className="delete-btn" onClick={() => handleDeleteCategory(c.id)}>✕</button>}</div>))}</div>
          <form onSubmit={handleCreateCategory} className="add-category-form">
            <h3>Add Custom Category</h3>
            <div style={{ display: 'flex', gap: '1rem' }}><input type="text" maxLength="2" placeholder="🔖" value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} style={{ width: '60px', textAlign: 'center' }} required /><input type="text" placeholder="Category Name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} style={{ flex: 1 }} required /></div>
            <CustomDropdown label="Parent Category (Optional)" options={[{ value: '', label: '-- Root Category --' }, ...parents.map(p => ({ value: p.id, label: p.name, icon: p.icon }))]} value={newCatParent} onChange={setNewCatParent} />
            <button type="submit" className="add-cat-btn" style={{ width: '100%' }}>Save Category</button>
          </form>
        </div>
      );
    }
    return <PageShell>{settingsContent}</PageShell>;
  }

  if (view === 'new_transaction') {
    const currentParents = categories.filter(c => c.type === txType && !c.parent_id);
    const applicableSubs = categories.filter(sub => currentParents.some(p => p.id === sub.parent_id));
    return (
      <PageShell>
        <div className="page-inner slide-up" style={{ maxWidth: '640px' }}>
          <div className="section-header-row"><h2 className="section-title-editorial">{txToEdit ? 'Edit Transaction' : 'New Transaction'}</h2><button className="section-action-link" onClick={() => { resetForm(); setView(txToEdit ? 'ledger' : 'dashboard'); }}>Cancel</button></div>
          <div className="fluid-input-area fade-in">
            <div className="type-toggle-bar"><button className={`type-btn ${txType === 'expense' ? 'active-expense' : ''}`} onClick={() => setTxType('expense')}>Expense</button><button className={`type-btn ${txType === 'income' ? 'active-income' : ''}`} onClick={() => setTxType('income')}>Income</button><button className={`type-btn ${txType === 'transfer' ? 'active-transfer' : ''}`} onClick={() => setTxType('transfer')}>Transfer</button></div>
            <div className="amount-input-wrapper"><span className="currency-prefix">{currencySymbol}</span><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="amount-input" autoFocus /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}><div className="category-selection-area"><p className="label-sm">Date</p><input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="text-input" /></div><div className="category-selection-area"><p className="label-sm">Note</p><input type="text" placeholder="Description" value={note} onChange={(e) => setNote(e.target.value)} className="text-input" /></div></div>
            {txType !== 'transfer' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <CustomDropdown label="Account" options={accounts.map(a => ({ value: a.id, label: a.name, icon: '🏦' }))} value={selectedAccount} onChange={setSelectedAccount} placeholder="Select Account" />
                <CustomDropdown label="Category" options={[...currentParents, ...applicableSubs].map(c => ({ value: c.id, label: c.name, icon: c.icon }))} value={selectedCategory} onChange={setSelectedCategory} placeholder="Select Category" />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <CustomDropdown label="From Account" options={accounts.map(a => ({ value: a.id, label: a.name, icon: '📤' }))} value={transferFromAccount} onChange={setTransferFromAccount} placeholder="From..." />
                <CustomDropdown label="To Account" options={accounts.map(a => ({ value: a.id, label: a.name, icon: '📥' }))} value={transferToAccount} onChange={setTransferToAccount} placeholder="To..." />
              </div>
            )}
            <button className={`submit-tx-btn bg-${txType}`} onClick={handleTransaction}>{txToEdit ? 'Update' : 'Save'}</button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (view === 'ledger') {
    const activeFiltersCount = (filterOptions.type !== 'all' ? 1 : 0) + (filterOptions.dateRange.start ? 1 : 0) + (filterOptions.dateRange.end ? 1 : 0) + filterOptions.categoryIds.length + filterOptions.tagIds.length;
    return (
      <PageShell>
        <div className="page-inner fade-in">
          <div className="section-header-row"><h2 className="section-title-editorial">Transactions</h2><div style={{ display: 'flex', gap: '1rem' }}><button className={`filter-toggle-btn ${showAdvancedFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showAdvancedFilters)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>{showAdvancedFilters ? 'Hide Filters' : 'Deep Filter'}{activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}</button><button className="section-action-link" onClick={navToDashboard}>Dashboard</button></div></div>
          <div className="ledger-search-row" style={{ marginTop: '1.5rem' }}><div className="ledger-search-wrap" style={{ background: 'var(--surface-container-low)', borderRadius: 'var(--radius-full)', padding: '0.25rem' }}><input type="text" placeholder="Search transactions..." className="ledger-search-input" style={{ background: 'transparent', border: 'none', padding: '0.75rem 1rem 0.75rem 3rem' }} value={filterOptions.searchTerm} onChange={(e) => updateFilter('searchTerm', e.target.value)} /><svg className="search-icon" style={{ left: '1.25rem' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div></div>
          <div className="filter-pills" style={{ marginTop: '1rem' }}>{['all', 'today', 'this_week', 'this_month', 'last_3m'].map(p => (<button key={p} className={`filter-pill ${filterOptions.preset === p ? 'active-pill' : ''}`} onClick={() => applyDatePreset(p)} style={{ textTransform: 'capitalize' }}>{p.replace('_', ' ')}</button>))}</div>
          {activeFiltersCount > 0 && !showAdvancedFilters && (<div className="filter-active-summary slide-up"><span className="label-sm" style={{ marginRight: '0.5rem' }}>Active:</span>{filterOptions.type !== 'all' && <span className="active-filter-tag">{filterOptions.type} <span className="active-filter-remove" onClick={() => updateFilter('type', 'all')}>✕</span></span>}{filterOptions.categoryIds.map(id => { const c = categories.find(x => x.id === id); return c ? <span key={id} className="active-filter-tag">{c.icon} {c.name} <span className="active-filter-remove" onClick={() => updateFilter('categoryIds', filterOptions.categoryIds.filter(x => x !== id))}>✕</span></span> : null; })}{filterOptions.tagIds.map(id => { const t = tags.find(x => x.id === id); return t ? <span key={id} className="active-filter-tag">#{t.name} <span className="active-filter-remove" onClick={() => updateFilter('tagIds', filterOptions.tagIds.filter(x => x !== id))}>✕</span></span> : null; })}<button className="section-action-link" style={{ marginLeft: 'auto', fontSize: '0.7rem' }} onClick={resetFilters}>Clear All</button></div>)}
          {showAdvancedFilters && (<FilterPanel categories={categories} tags={tags} accounts={accounts} filterOptions={filterOptions} onUpdateFilter={updateFilter} onResetFilters={resetFilters} />)}
          <div className="editorial-list" style={{ marginTop: '1rem' }}>{groupedLedger.map(([date, txs]) => (<div key={date} className="ledger-date-group"><div className="ledger-date-header"><span className="ledger-date-text">{formatGroupDate(date)}</span></div><div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>{txs.map(t => { const cat = t.categories || { icon: '•', name: 'Uncategorized' }; return (<div key={t.id} className="editorial-item" onClick={() => openEditTransaction(t)}><div className="editorial-icon">{cat.icon}</div><div className="editorial-info"><div className="editorial-title">{t.parties?.name || cat.name}</div><div className="editorial-meta">{cat.name} · {t.accounts?.name || 'Cash'}{t.transaction_tags?.length > 0 && (<span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>{t.transaction_tags.map(tt => `#${tt.tags?.name}`).filter(Boolean).join(' ')}</span>)}</div></div><div className="editorial-amount-wrap"><div className={`editorial-amount ${t.type}`}>{t.transfer_id ? '⇄' : t.type === 'income' ? '+' : '-'}{currencySymbol}{parseFloat(t.amount).toFixed(2)}</div><div className="editorial-status">{t.transfer_id ? 'TRANSFER' : 'CLEARED'}</div></div></div>); })}</div></div>))}</div>
        </div>
      </PageShell>
    );
  }

  // --- ANALYTICS VIEW ---
  if (view === 'analytics') {
    const totalSpentFiltered = analyticsTransactions.filter(t => t.type === 'expense' && !t.transfer_id).reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalIncomeFiltered = analyticsTransactions.filter(t => t.type === 'income' && !t.transfer_id).reduce((s, t) => s + parseFloat(t.amount), 0);
    return (
      <PageShell>
        <div className="page-inner fade-in">
          <div className="section-header-row"><h2 className="section-title-editorial">Analytics</h2><button className={`filter-toggle-btn ${showAnalyticsFilters ? 'active' : ''}`} onClick={() => setShowAnalyticsFilters(!showAnalyticsFilters)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>Filters</button></div>
          {showAnalyticsFilters && (<div className="advanced-filters slide-up" style={{ marginTop: '1.5rem', background: 'var(--surface-container-low)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}><div className="filter-section"><p className="label-sm">Time Period</p><div className="filter-pills" style={{ marginTop: '0.5rem' }}>{['today', 'this_week', 'this_month', 'last_3m', 'this_year'].map(p => (<button key={p} className={`filter-pill ${analyticsFilters.preset === p ? 'active-pill' : ''}`} onClick={() => applyAnalyticsPreset(p)} style={{ textTransform: 'capitalize' }}>{p.replace('_', ' ')}</button>))}</div></div><div className="filter-section"><p className="label-sm">Transaction Type</p><div className="type-toggle-bar" style={{ marginTop: '0.5rem', background: 'var(--surface-container-lowest)' }}>{['all', 'income', 'expense', 'transfer'].map(t => (<button key={t} className={`type-btn ${analyticsFilters.type === t ? (t === 'all' ? 'active-transfer' : `active-${t}`) : ''}`} onClick={() => updateAnalyticsFilter('type', t)} style={{ textTransform: 'capitalize' }}>{t}</button>))}</div></div></div><div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}><button className="section-action-link" onClick={resetAnalyticsFilters}>Reset Analytics Filters</button></div></div>)}
          <div className="summary-cards-grid" style={{ marginTop: '2rem' }}><div className="summary-card income"><p className="summary-label">Income</p><h3 className="summary-value">{currencySymbol}{totalIncomeFiltered.toLocaleString()}</h3></div><div className="summary-card expense"><p className="summary-label">Expenses</p><h3 className="summary-value">{currencySymbol}{totalSpentFiltered.toLocaleString()}</h3></div><div className="summary-card burn"><p className="summary-label">Net Cash Flow</p><h3 className={`summary-value ${(totalIncomeFiltered - totalSpentFiltered) < 0 ? 'expense' : 'income'}`}>{currencySymbol}{(totalIncomeFiltered - totalSpentFiltered).toLocaleString()}</h3></div><div className="summary-card burn"><p className="summary-label">Daily Average</p><h3 className="summary-value">{currencySymbol}{analyticsKPIs.dailyBurn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3></div></div>
          <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '2rem' }}>
            <div className="analytics-card-sm" style={{ minHeight: '400px' }}><p className="analytics-title-sm">Cash Flow Velocity</p><ResponsiveContainer width="100%" height={320}><AreaChart data={chartTimeSeries}><defs><linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/></linearGradient><linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--tertiary-fixed-variant)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--tertiary-fixed-variant)" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--on-surface-variant)' }} minTickGap={30} /><YAxis hide /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-ambient)' }} /><Area type="monotone" dataKey="income" stroke="var(--secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" /><Area type="monotone" dataKey="expense" stroke="var(--tertiary-fixed-variant)" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" /></AreaChart></ResponsiveContainer></div>
            <div className="analytics-card-sm"><p className="analytics-title-sm">Category Breakdown</p><ResponsiveContainer width="100%" height={320}><PieChart><Pie data={chartCategorical} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value"><Cell fill="var(--primary)" /><Cell fill="var(--secondary)" /><Cell fill="var(--primary-container)" /><Cell fill="var(--tertiary-fixed-variant)" /><Cell fill="var(--on-surface-variant)" /></Pie><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-ambient)' }} /></PieChart></ResponsiveContainer></div>
            <div className="analytics-card-sm" style={{ gridColumn: 'span 2' }}><p className="analytics-title-sm">Tag Density</p><ResponsiveContainer width="100%" height={300}><BarChart data={chartTags} layout="vertical" margin={{ left: 40, right: 40 }}><XAxis type="number" hide /><YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 600 }} /><Tooltip cursor={{ fill: 'var(--surface-container-low)' }} contentStyle={{ borderRadius: '12px', border: 'none' }} /><Bar dataKey="value" fill="var(--primary-container)" radius={[0, 6, 6, 0]} barSize={24} /></BarChart></ResponsiveContainer></div>
          </div>
        </div>
      </PageShell>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <PageShell>
      <div className="page-inner fade-in">
        <div className="dashboard-layout">
          <div className="dashboard-main-stack">
            <div className="portfolio-hero">
              <div className="portfolio-info">
                <p className="portfolio-label">Net Worth</p>
                <h1 className="portfolio-value">{currencySymbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h1>
                {portfolioChange !== null && <div className={`portfolio-trend-chip${portfolioChange < 0 ? ' negative' : ''}`}>{portfolioChange >= 0 ? '+' : ''}{portfolioChange}% vs prev period</div>}
              </div>
              <div className="portfolio-chart-preview">
                {(() => {
                  const max = Math.max(...sparklineData, 1);
                  return sparklineData.map((val, i) => (
                    <div key={i} className={`chart-bar${i === sparklineData.length - 1 ? ' active' : ''}`} style={{ height: `${Math.max(8, Math.round((val / max) * 100))}%` }} />
                  ));
                })()}
              </div>
            </div>

            <div className="dash-period-bar">
              {[{ key: 'this_month', label: 'This Month' }, { key: 'last_month', label: 'Last Month' }, { key: 'last_3m', label: '3 Months' }, { key: 'this_year', label: 'This Year' }, { key: 'all', label: 'All Time' }].map(p => (
                <button key={p.key} className={`dash-period-btn${dashPeriod === p.key ? ' active' : ''}`} onClick={() => setDashPeriod(p.key)}>{p.label}</button>
              ))}
            </div>

            <div className="summary-cards-grid">
              <div className="summary-card income"><div className="summary-icon-box">💵</div><p className="summary-label">Income</p><h3 className="summary-value">{currencySymbol}{totalIncome.toLocaleString()}</h3></div>
              <div className="summary-card expense"><div className="summary-icon-box">🛍️</div><p className="summary-label">Expenses</p><h3 className="summary-value">{currencySymbol}{totalExpense.toLocaleString()}</h3></div>
              <div className={`summary-card savings${savingsRate !== null && savingsRate < 0 ? ' negative' : ''}`}><div className="summary-icon-box">📈</div><p className="summary-label">Savings Rate</p><h3 className="summary-value">{savingsRate !== null ? `${savingsRate}%` : '—'}</h3></div>
              <div className="summary-card burn"><div className="summary-icon-box">🔥</div><p className="summary-label">Daily Burn</p><h3 className="summary-value">{currencySymbol}{burnRate.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3></div>
            </div>

            <div className="content-section">
              <div className="section-header-row"><h2 className="section-title-editorial">Recent Activity</h2><button className="section-action-link" onClick={navToLedger}>View All</button></div>
              <div className="editorial-list">
                {dashTransactions.filter(t => !t.transfer_id).slice(0, 5).map(t => {
                  const cat = t.categories || { icon: '•', name: 'Uncategorized' };
                  return (
                    <div key={t.id} className="editorial-item" onClick={() => openEditTransaction(t)}>
                      <div className="editorial-icon">{cat.icon}</div>
                      <div className="editorial-info"><div className="editorial-title">{t.parties?.name || cat.name}</div><div className="editorial-meta">{cat.name}{t.accounts?.name ? ` · ${t.accounts.name}` : ''}{` · ${formatGroupDate(t.transaction_date)}`}</div></div>
                      <div className="editorial-amount-wrap"><div className={`editorial-amount ${t.type}`}>{t.type === 'income' ? '+' : '-'}{currencySymbol}{parseFloat(t.amount).toFixed(2)}</div><div className="editorial-status">CLEARED</div></div>
                    </div>
                  );
                })}
                {dashTransactions.filter(t => !t.transfer_id).length === 0 && <p className="body-md" style={{ padding: '1rem 0', textAlign: 'center' }}>No transactions in this period.</p>}
              </div>
            </div>

            <div className="analytics-card-sm">
              <p className="analytics-title-sm">Top Expense Categories</p>
              {topCategories.length > 0 ? (() => {
                const maxVal = topCategories[0][1];
                return (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>{topCategories.map(([name, amount]) => (<div key={name}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}><span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>{name}</span><span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>{currencySymbol}{amount.toLocaleString()}</span></div><div className="cat-bar-track"><div className="cat-bar-fill" style={{ width: `${Math.round((amount / maxVal) * 100)}%` }} /></div></div>))}</div>);
              })() : <p className="body-md" style={{ opacity: 0.6 }}>No expense data for this period.</p>}
            </div>
          </div>

          <div className="dashboard-side-stack">
            <div className="smart-insight-card">
              <div className="insight-header"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>Smart Insights</div>
              <div className="insight-list">{smartInsights.map((ins, i) => (<div key={i} className="insight-item"><div className="insight-dot" style={{ background: ins.color }} /><p className="insight-content"><strong>{ins.title}:</strong> {ins.text}</p></div>))}</div>
            </div>
            <div className="analytics-card-sm">
              <p className="analytics-title-sm">Account Balances</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {accounts.map(a => {
                  const bal = accountBalances[a.id] || 0;
                  return (<div key={a.id} className="acct-balance-row"><span className="acct-balance-name">{a.name}</span><span className={`acct-balance-val${bal < 0 ? ' neg' : ''}`}>{currencySymbol}{bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>);
                })}
                {accounts.length === 0 && <p className="body-md" style={{ opacity: 0.6 }}>No accounts yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default App;
