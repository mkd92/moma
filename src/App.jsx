import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from './supabaseClient';
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

// Chart palette + empty state
const CHART_COLORS = ['#000666', '#2e7d32', '#93000a', '#e65100', '#6200ea', '#00695c', '#1565c0', '#4a148c', '#880e4f', '#bf360c'];
const emptyChartStyle = { height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', color: 'var(--on-surface-variant)', opacity: 0.5 };

const ChartTooltip = ({ active, payload, label, currencySymbol = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--outline-variant)', borderRadius: '0.75rem', padding: '0.75rem 1rem', boxShadow: '0 8px 24px rgba(28,27,27,0.1)', fontFamily: 'Inter,sans-serif', minWidth: 160 }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', marginBottom: '0.4rem' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', fontSize: '0.875rem', fontWeight: 600, color: p.color }}>
          <span>{p.name}</span>
          <span style={{ color: 'var(--on-surface)', fontFamily: 'Manrope,sans-serif' }}>{currencySymbol}{typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CashFlowChart = ({ data, currencySymbol }) => {
  if (!data.length) return <div style={emptyChartStyle}>No data for this period</div>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.18}/>
            <stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#93000a" stopOpacity={0.18}/>
            <stop offset="95%" stopColor="#93000a" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#454652', fontFamily: 'Inter' }} interval="preserveStartEnd" />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#454652', fontFamily: 'Inter' }} tickFormatter={v => v === 0 ? '0' : `${currencySymbol}${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} width={58} />
        <Tooltip content={<ChartTooltip currencySymbol={currencySymbol} />} />
        <Area type="monotone" dataKey="income" name="Income" stroke="#2e7d32" strokeWidth={2} fill="url(#incGrad)" dot={false} activeDot={{ r: 4, fill: '#2e7d32' }} />
        <Area type="monotone" dataKey="expense" name="Expense" stroke="#93000a" strokeWidth={2} fill="url(#expGrad)" dot={false} activeDot={{ r: 4, fill: '#93000a' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const CategoryDonutChart = ({ data, currencySymbol }) => {
  if (!data.length) return <div style={emptyChartStyle}>No expense data</div>;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={88} dataKey="value" paddingAngle={2} startAngle={90} endAngle={450}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />)}
          </Pie>
          <Tooltip formatter={(v) => [`${currencySymbol}${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, '']} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {data.slice(0, 6).map((d, i) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--on-surface)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
            <span style={{ color: 'var(--on-surface-variant)', fontFamily: 'Manrope,sans-serif', fontWeight: 600, flexShrink: 0 }}>{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TagBarChart = ({ data, currencySymbol }) => {
  if (!data.length) return <div style={emptyChartStyle}>No tagged transactions</div>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#454652', fontFamily: 'Inter' }} tickFormatter={v => `${currencySymbol}${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1c1b1b', fontFamily: 'Inter', fontWeight: 500 }} width={85} />
        <Tooltip content={<ChartTooltip currencySymbol={currencySymbol} />} />
        <Bar dataKey="value" name="Amount" fill="#000666" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Filter Panel Component
const FilterPanel = ({ categories, tags, accounts, filterOptions, onUpdateFilter, onResetFilters }) => {
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubs = (pid) => categories.filter(c => c.parent_id === pid);

  const toggle = (key, id) => {
    const arr = filterOptions[key];
    onUpdateFilter(key, arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  };

  return (
    <div className="filter-panel slide-up">
      <div className="filter-panel-grid">

        {/* Date Range */}
        <div className="filter-section">
          <p className="label-sm">Custom Date Range</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="date"
              className="text-input filter-date-input"
              value={filterOptions.dateRange.start || ''}
              onChange={(e) => onUpdateFilter('dateRange', { ...filterOptions.dateRange, start: e.target.value })}
            />
            <input
              type="date"
              className="text-input filter-date-input"
              value={filterOptions.dateRange.end || ''}
              onChange={(e) => onUpdateFilter('dateRange', { ...filterOptions.dateRange, end: e.target.value })}
            />
          </div>
        </div>

        {/* Accounts */}
        {accounts.length > 0 && (
          <div className="filter-section">
            <p className="label-sm">Accounts</p>
            <div className="filter-chips">
              {accounts.map(a => (
                <button
                  key={a.id}
                  className={`filter-chip${filterOptions.accountIds.includes(a.id) ? ' active' : ''}`}
                  onClick={() => toggle('accountIds', a.id)}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="filter-section filter-section-full">
          <p className="label-sm">Categories</p>
          <div className="filter-chips">
            {parentCategories.flatMap(parent => [
              <button
                key={parent.id}
                className={`filter-chip${filterOptions.categoryIds.includes(parent.id) ? ' active' : ''}`}
                onClick={() => toggle('categoryIds', parent.id)}
              >
                {parent.icon} {parent.name}
              </button>,
              ...getSubs(parent.id).map(sub => (
                <button
                  key={sub.id}
                  className={`filter-chip filter-chip-sub${filterOptions.categoryIds.includes(sub.id) ? ' active' : ''}`}
                  onClick={() => toggle('categoryIds', sub.id)}
                >
                  {sub.icon} {sub.name}
                </button>
              ))
            ])}
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="filter-section filter-section-full">
            <p className="label-sm">Tags</p>
            <div className="filter-chips">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  className={`filter-chip${filterOptions.tagIds.includes(tag.id) ? ' active' : ''}`}
                  onClick={() => toggle('tagIds', tag.id)}
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="filter-panel-footer">
        <button className="filter-reset-btn" onClick={onResetFilters}>Reset All Filters</button>
      </div>
    </div>
  );
};

const PageShell = ({ children, view, onDashboard, onLedger, onAnalytics, onBudgets, onNewTx, onSettings, session, onLogout }) => (
  <div className="app-shell">
    <Sidebar view={view} onDashboard={onDashboard} onLedger={onLedger} onAnalytics={onAnalytics} onBudgets={onBudgets} onNewTx={onNewTx} onSettings={onSettings} session={session} onLogout={onLogout} />
    <div className="page-content">
      <TopHeader session={session} onLogout={onLogout} />
      {children}
    </div>
  </div>
);

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

  // Budget UI State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ category_id: '', amount_limit: '', period: 'monthly', name: '' });

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
  const [catSearch, setCatSearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [transferFromAccount, setTransferFromAccount] = useState(null);
  const [transferToAccount, setTransferToAccount] = useState(null);

  // New Filter Architecture
  const [showAdvancedFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    type: 'all',
    dateRange: { start: '', end: '' },
    categoryIds: [],
    tagIds: [],
    accountIds: [],
    searchTerm: '',
    preset: 'all'
  });

  // Dashboard period filter
  const [dashPeriod, setDashPeriod] = useState('this_month');

  // Settings / Category Manager State
  const [settingsType, setSettingsType] = useState('expense');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🔖');
  const [newCatParent, setNewCatParent] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');
  const [editCatParent, setEditCatParent] = useState('');

  // Party / Tag Manager State
  const [newPartyName, setNewPartyName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Account Manager State
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editBalanceMode, setEditBalanceMode] = useState('initial');
  const [editBalanceValue, setEditBalanceValue] = useState('');

  // Currency Dropdown State
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const currencyDropdownRef = useRef(null);

  // Transaction Form Dropdown State
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [partyFocusedIndex, setPartyFocusedIndex] = useState(-1);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [catFocusedIndex, setCatFocusedIndex] = useState(-1);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [accountFocusedIndex, setAccountFocusedIndex] = useState(-1);
  const [tagSearch, setTagSearch] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagFocusedIndex, setTagFocusedIndex] = useState(-1);
  const [transferFromSearch, setTransferFromSearch] = useState('');
  const [transferToSearch, setTransferToSearch] = useState('');
  const [showTransferFromDropdown, setShowTransferFromDropdown] = useState(false);
  const [showTransferToDropdown, setShowTransferToDropdown] = useState(false);
  const [transferFromFocusedIndex, setTransferFromFocusedIndex] = useState(-1);
  const [transferToFocusedIndex, setTransferToFocusedIndex] = useState(-1);

  // Dropdown Refs
  const catMenuRef = useRef(null);
  const partyMenuRef = useRef(null);
  const accountMenuRef = useRef(null);
  const tagMenuRef = useRef(null);
  const transferFromMenuRef = useRef(null);
  const transferToMenuRef = useRef(null);

  const updateFilter = useCallback((key, value) => {
    setFilterOptions(prev => ({ ...prev, [key]: value, preset: key === 'preset' ? value : 'custom' }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterOptions({
      type: 'all',
      dateRange: { start: '', end: '' },
      categoryIds: [],
      tagIds: [],
      accountIds: [],
      searchTerm: '',
      preset: 'all'
    });
  }, []);

  const applyDatePreset = useCallback((preset) => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    
    let start = '', end = '';
    if (preset === 'today') {
      start = end = fmt(today);
    } else if (preset === 'this_week') {
      const day = today.getDay() || 7;
      const monday = new Date(today);
      monday.setDate(today.getDate() - day + 1);
      start = fmt(monday);
      end = fmt(today);
    } else if (preset === 'this_month') {
      start = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
      end = fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0));
    } else if (preset === 'last_3m') {
      start = fmt(new Date(today.getFullYear(), today.getMonth() - 2, 1));
      end = fmt(today);
    }

    setFilterOptions(prev => ({
      ...prev,
      preset,
      dateRange: { start, end }
    }));
  }, []);

  const dashDateRange = useMemo(() => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    if (dashPeriod === 'this_month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    if (dashPeriod === 'last_month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: fmt(start), end: fmt(end) };
    }
    if (dashPeriod === 'last_3m') {
      const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return { start: fmt(start), end: fmt(today) };
    }
    if (dashPeriod === 'this_year') {
      return { start: `${today.getFullYear()}-01-01`, end: `${today.getFullYear()}-12-31` };
    }
    return { start: null, end: null }; // all time
  }, [dashPeriod]);

  const dashTransactions = useMemo(() => {
    const { start, end } = dashDateRange;
    return transactions.filter(t => {
      if (start && t.transaction_date < start) return false;
      if (end && t.transaction_date > end) return false;
      return true;
    });
  }, [transactions, dashDateRange]);

  // Derived financials
  const { balance, totalIncome, totalExpense } = useMemo(() => {
    let inc = 0, exp = 0;
    dashTransactions.forEach(t => {
      if (t.transfer_id) return;
      if (t.type === 'income') inc += parseFloat(t.amount);
      if (t.type === 'expense') exp += parseFloat(t.amount);
    });
    let accInitial = 0;
    accounts.forEach(a => accInitial += parseFloat(a.initial_balance || 0));
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
    const total = dashTransactions.filter(t => t.type === 'expense' && !t.transfer_id)
      .reduce((s, t) => s + parseFloat(t.amount), 0);
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
      return transactions.filter(t => t.transaction_date === key && t.type === 'expense' && !t.transfer_id)
        .reduce((s, t) => s + parseFloat(t.amount), 0);
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

  // --- Budget helpers ---
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

  // Auto-suggestion for budget creation
  const budgetSuggestion = useMemo(() => {
    if (!budgetForm.category_id) return null;
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const start = `${new Date(today.getFullYear(), today.getMonth() - 2, 1).getFullYear()}-${pad(new Date(today.getFullYear(), today.getMonth() - 2, 1).getMonth()+1)}-01`;
    const total = transactions
      .filter(t => t.type === 'expense' && t.transaction_date >= start &&
        (t.category_id === budgetForm.category_id || categories.find(c => c.id === t.category_id)?.parent_id === budgetForm.category_id))
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    return Math.round(total / 3);
  }, [budgetForm.category_id, transactions, categories]);

  const handleSaveBudget = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !budgetForm.amount_limit) return;
    const payload = {
      user_id: session.user.id,
      category_id: budgetForm.category_id || null,
      name: budgetForm.name.trim() || null,
      amount_limit: parseFloat(budgetForm.amount_limit),
      period: budgetForm.period,
    };
    if (editingBudget) {
      await supabase.from('budgets').update(payload).eq('id', editingBudget.id);
    } else {
      await supabase.from('budgets').insert([payload]);
    }
    setShowBudgetModal(false);
    setEditingBudget(null);
    fetchBudgets();
  }, [session, budgetForm, editingBudget]);

  const handleDeleteBudget = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('budgets').delete().eq('id', id);
    setShowBudgetModal(false);
    setEditingBudget(null);
    fetchBudgets();
  }, [session]);

  const openNewBudget = useCallback(() => {
    setBudgetForm({ category_id: '', amount_limit: '', period: 'monthly', name: '' });
    setEditingBudget(null);
    setShowBudgetModal(true);
  }, []);

  const openEditBudget = useCallback((b) => {
    setBudgetForm({ category_id: b.category_id || '', amount_limit: String(b.amount_limit), period: b.period, name: b.name || '' });
    setEditingBudget(b);
    setShowBudgetModal(true);
  }, []);

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

  const handleDeleteTransaction = useCallback(async () => {
    if (!session || !txToEdit) return;
    if (txToEdit.transfer_id) {
      await supabase.from('transactions').delete().eq('transfer_id', txToEdit.transfer_id);
    } else {
      await supabase.from('transactions').delete().eq('id', txToEdit.id);
    }
    fetchTransactions();
    resetForm();
    setView('ledger');
  }, [session, txToEdit, resetForm]);

  const handleCreateCategory = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !newCatName.trim() || !newCatIcon.trim()) return;
    const { error } = await supabase.from('categories').insert([{ user_id: session.user.id, name: newCatName.trim(), icon: newCatIcon.trim(), type: settingsType, parent_id: newCatParent || null, is_system: false }]);
    if (!error) { setNewCatName(''); setNewCatIcon('🔖'); setNewCatParent(''); fetchCategories(); }
  }, [session, newCatName, newCatIcon, settingsType, newCatParent]);

  const handleDeleteCategory = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  }, [session]);

  const handleUpdateCategory = useCallback(async (id, updates) => {
    if (!session) return;
    await supabase.from('categories').update(updates).eq('id', id);
    setEditingCatId(null);
    fetchCategories();
  }, [session]);

  const handleCreateParty = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !newPartyName.trim()) return;
    const { error } = await supabase.from('parties').insert([{ user_id: session.user.id, name: newPartyName.trim() }]);
    if (!error) { setNewPartyName(''); fetchParties(); }
    else if (error.code === '23505') alert('A party with that name already exists.');
  }, [session, newPartyName]);

  const handleDeleteParty = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('parties').delete().eq('id', id);
    fetchParties();
  }, [session]);

  const handleCreateAndSelectParty = useCallback(async (name) => {
    if (!session || !name.trim()) return;
    const { data, error } = await supabase.from('parties').insert([{ user_id: session.user.id, name: name.trim() }]).select('id').single();
    if (!error && data) { await fetchParties(); setSelectedParty(data.id); setPartySearch(''); setShowPartyDropdown(false); setPartyFocusedIndex(-1); }
  }, [session]);

  const handleCreateTag = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !newTagName.trim()) return;
    const { error } = await supabase.from('tags').insert([{ user_id: session.user.id, name: newTagName.trim() }]);
    if (!error) { setNewTagName(''); fetchTags(); }
    else if (error.code === '23505') alert('A tag with that name already exists.');
  }, [session, newTagName]);

  const handleDeleteTag = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('tags').delete().eq('id', id);
    fetchTags();
  }, [session]);

  const handleToggleTag = useCallback((tagId) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  }, []);

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

  const handleUpdateAccount = useCallback(async (id, { name, initial_balance }) => {
    if (!session) return;
    await supabase.from('accounts').update({ name, initial_balance }).eq('id', id);
    setEditingAccountId(null);
    fetchAccounts();
  }, [session]);

  const handleSetDefaultAccount = useCallback(async (id) => {
    if (!session) return;
    const newDefault = defaultAccountId === id ? null : id;
    setDefaultAccountId(newDefault);
    await supabase.from('profiles').update({ default_account_id: newDefault }).eq('id', session.user.id);
  }, [session, defaultAccountId]);

  const handleCurrencyChange = useCallback(async (newCur) => {
    setCurrencyCode(newCur);
    setCurrencySymbol(CURRENCY_SYMBOLS[newCur] || '$');
    setCurrencyDropdownOpen(false);
    await supabase.from('profiles').update({ currency_preference: newCur }).eq('id', session.user.id);
  }, [session]);

  // Close currency dropdown on outside click
  useEffect(() => {
    if (!currencyDropdownOpen) return;
    const handler = (e) => { if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target)) setCurrencyDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [currencyDropdownOpen]);

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

  // Filtered transactions for analytics
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

  // Time-series chart data
  const chartTimeSeries = useMemo(() => {
    const { start, end } = analyticsFilters.dateRange;
    if (!start) return [];
    const pad = n => String(n).padStart(2, '0');
    const startD = new Date(start + 'T00:00:00');
    const endD = end ? new Date(end + 'T00:00:00') : new Date();
    const dayCount = Math.ceil((endD - startD) / 86400000) + 1;

    if (dayCount > 180) {
      // Monthly
      const data = {};
      analyticsTransactions.filter(t => !t.transfer_id).forEach(t => {
        const key = t.transaction_date.slice(0, 7);
        if (!data[key]) data[key] = { date: key, income: 0, expense: 0, label: new Date(key + '-01T12:00:00').toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) };
        if (t.type === 'income') data[key].income += parseFloat(t.amount);
        if (t.type === 'expense') data[key].expense += parseFloat(t.amount);
      });
      return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
    } else if (dayCount > 60) {
      // Weekly
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
      // Daily
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

  // Category donut data
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

  // Tag bar data
  const chartTags = useMemo(() => {
    const totals = {};
    analyticsTransactions.filter(t => !t.transfer_id && t.transaction_tags?.length > 0).forEach(t => {
      t.transaction_tags.forEach(tt => {
        if (tt.tags?.name) totals[tt.tags.name] = (totals[tt.tags.name] || 0) + parseFloat(t.amount);
      });
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [analyticsTransactions]);

  // KPI summary
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
      if (tagIds.length > 0) {
        if (!t.transaction_tags?.some(tt => tagIds.includes(tt.tag_id))) return false;
      }
      if (accountIds.length > 0 && !accountIds.includes(t.account_id)) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const matchesNote = (t.note || '').toLowerCase().includes(s);
        const matchesParty = (t.parties?.name || '').toLowerCase().includes(s);
        const matchesCat = (t.categories?.name || '').toLowerCase().includes(s);
        if (!matchesNote && !matchesParty && !matchesCat) return false;
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

  const parentCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const subCategories = useMemo(() => categories.filter(c => c.parent_id), [categories]);

  const navToDashboard = useCallback(() => setView('dashboard'), []);
  const navToLedger = useCallback(() => { resetForm(); setView('ledger'); }, [resetForm]);
  const navToNewTx = useCallback(() => { resetForm(); setView('new_transaction'); }, [resetForm]);
  const navToSettings = useCallback(() => setView('settings'), []);
  const navToAnalytics = useCallback(() => setView('analytics'), []);
  const navToBudgets = useCallback(() => setView('budgets'), []);

  const shellProps = { view, onDashboard: navToDashboard, onLedger: navToLedger, onAnalytics: navToAnalytics, onBudgets: navToBudgets, onNewTx: navToNewTx, onSettings: navToSettings, session, onLogout: handleLogout };

  if (view === 'landing') {
    return (
      <div className="landing-container fade-in">
        <svg className="landing-graphic" viewBox="0 0 200 200" fill="none"><rect x="20" y="100" width="24" height="80" rx="4" stroke="#000666" strokeWidth="1.5"/><rect x="56" y="60" width="24" height="120" rx="4" stroke="#000666" strokeWidth="1.5"/><rect x="92" y="40" width="24" height="140" rx="4" stroke="#000666" strokeWidth="1.5"/><rect x="128" y="75" width="24" height="105" rx="4" stroke="#000666" strokeWidth="1.5"/><rect x="164" y="55" width="24" height="125" rx="4" stroke="#000666" strokeWidth="1.5"/><line x1="10" y1="190" x2="195" y2="190" stroke="#000666" strokeWidth="1.5"/></svg>
        <p className="landing-eyebrow">The Digital Ledger</p>
        <h1 className="hero-title">Architectural Clarity<br />for Your Wealth.</h1>
        <button className="launch-btn" onClick={() => session ? setView('dashboard') : setView('auth')}>Get Started</button>
      </div>
    );
  }

  if (view === 'auth') {
    return (
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
  }

  if (view === 'settings') {
    return (
      <PageShell {...shellProps}>
        <div className="page-inner fade-in">
          <div className="page-header">
            <h2 className="page-title">Settings</h2>
          </div>
          <div className="settings-panel">
            <div className="settings-section">
              <p className="settings-label">Preferences</p>
              <div className="settings-group">
                <div className="settings-card">
                  <span className="sc-text">Currency</span>
                  <div className="currency-dropdown" ref={currencyDropdownRef}>
                    <button className="currency-dropdown-trigger" onClick={() => setCurrencyDropdownOpen(o => !o)}>
                      {currencyCode} ({CURRENCY_SYMBOLS[currencyCode]})
                      <span className="currency-dropdown-arrow">{currencyDropdownOpen ? '▲' : '▼'}</span>
                    </button>
                    {currencyDropdownOpen && (
                      <ul className="currency-dropdown-menu">
                        {Object.keys(CURRENCY_SYMBOLS).map(code => (
                          <li key={code}>
                            <button className={`currency-dropdown-item${code === currencyCode ? ' active' : ''}`} onClick={() => handleCurrencyChange(code)}>
                              {code} ({CURRENCY_SYMBOLS[code]})
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="settings-section">
              <p className="settings-label">Manage</p>
              <div className="settings-group">
                <button className="settings-nav-btn" onClick={() => setView('account_management')}>Accounts <span className="arrow">›</span></button>
                <button className="settings-nav-btn" onClick={() => setView('category_management')}>Categories <span className="arrow">›</span></button>
                <button className="settings-nav-btn" onClick={() => setView('party_management')}>Parties <span className="arrow">›</span></button>
                <button className="settings-nav-btn" onClick={() => setView('tag_management')}>Tags <span className="arrow">›</span></button>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (view === 'account_management') {
    return (
      <PageShell {...shellProps}>
        <div className="page-inner slide-up">
          <div className="page-header">
            <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
            <h2 className="page-title">Accounts</h2>
          </div>
          <div className="settings-controls fade-in">
            <div className="category-manager">
              {accounts.length === 0 ? (
                <div className="empty-state"><p>No accounts added yet.</p></div>
              ) : (
                accounts.map(acc => {
                  const currentBal = accountBalances[acc.id] || 0;
                  const netTx = currentBal - parseFloat(acc.initial_balance || 0);
                  const isEditing = editingAccountId === acc.id;
                  if (isEditing) {
                    const resolvedInitial = editBalanceMode === 'initial' ? parseFloat(editBalanceValue) || 0 : (parseFloat(editBalanceValue) || 0) - netTx;
                    return (
                      <div key={acc.id} className="settings-cat-block" style={{ flexDirection: 'column', padding: '1rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text)' }}>Edit Account</div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Account Name</label>
                        <input type="text" className="text-input" value={editAccountName} onChange={(e) => setEditAccountName(e.target.value)} style={{ marginBottom: '0.75rem' }} />
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Balance Mode</label>
                        <div className="type-toggle-bar" style={{ marginBottom: '0.5rem' }}>
                          <button type="button" className={`type-btn ${editBalanceMode === 'initial' ? 'active-income' : ''}`} onClick={() => setEditBalanceMode('initial')}>Set Initial</button>
                          <button type="button" className={`type-btn ${editBalanceMode === 'current' ? 'active-income' : ''}`} onClick={() => setEditBalanceMode('current')}>Set Current</button>
                        </div>
                        <input type="number" step="0.01" className="text-input" placeholder={editBalanceMode === 'initial' ? 'Initial Balance' : 'Desired Current Balance'} value={editBalanceValue} onChange={(e) => setEditBalanceValue(e.target.value)} style={{ marginBottom: '0.25rem' }} />
                        {editBalanceMode === 'current' && editBalanceValue !== '' && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>→ Initial balance will be set to {currencySymbol}{resolvedInitial.toFixed(2)}</p>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button className="add-cat-btn" style={{ flex: 1 }} onClick={() => handleUpdateAccount(acc.id, { name: editAccountName.trim() || acc.name, initial_balance: resolvedInitial })}>Save</button>
                          <button className="settings-logout-btn" style={{ flex: 1, marginTop: 0 }} onClick={() => setEditingAccountId(null)}>Cancel</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={acc.id} className="settings-cat-block">
                      <div className="settings-cat-parent">
                        <span className="cat-icon">🏦</span>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span className="cat-name">{acc.name}{defaultAccountId === acc.id && <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', borderRadius: '10px', padding: '0.1rem 0.45rem' }}>default</span>}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current: {currencySymbol}{currentBal.toFixed(2)} | Initial: {currencySymbol}{parseFloat(acc.initial_balance).toFixed(2)}</span>
                        </div>
                        <button className="icon-btn-text" style={{ padding: '0 0.5rem', fontSize: '1rem', color: defaultAccountId === acc.id ? 'var(--primary)' : 'var(--text-muted)', marginRight: '0.25rem' }} onClick={() => handleSetDefaultAccount(acc.id)}>★</button>
                        <button className="icon-btn-text" style={{ padding: '0 0.5rem', color: 'var(--primary)', marginRight: '0.5rem' }} onClick={() => { setEditingAccountId(acc.id); setEditAccountName(acc.name); setEditBalanceMode('initial'); setEditBalanceValue(acc.initial_balance.toString()); }}>✎</button>
                        <button className="delete-btn" onClick={() => handleDeleteAccount(acc.id)}>✕</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={handleCreateAccount} className="add-category-form">
              <h3>Add Account</h3>
              <div className="form-row">
                <input type="text" placeholder="Account Name (e.g. Checking)" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} required style={{ flex: 1 }} />
              </div>
              <div className="form-row" style={{ marginTop: '0.5rem' }}>
                <input type="number" step="0.01" placeholder="Initial Balance" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} required style={{ flex: 1 }} />
              </div>
              <button type="submit" className="add-cat-btn" style={{ marginTop: '1rem' }}>Add Account</button>
            </form>
          </div>
        </div>
      </PageShell>
    );
  }

  if (view === 'party_management') {
    return (
      <PageShell {...shellProps}>
        <div className="page-inner slide-up">
          <div className="page-header">
            <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
            <h2 className="page-title">Parties</h2>
          </div>
          <div className="settings-controls fade-in">
            <div className="category-manager">
              {parties.length === 0 ? (
                <div className="empty-state"><p>No parties added yet.</p></div>
              ) : (
                parties.map(party => (
                  <div key={party.id} className="settings-cat-block">
                    <div className="settings-cat-parent">
                      <span className="cat-icon">👥</span>
                      <span className="cat-name">{party.name}</span>
                      <button className="delete-btn" onClick={() => handleDeleteParty(party.id)}>✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleCreateParty} className="add-category-form">
              <h3>Add Counterparty</h3>
              <div className="form-row">
                <input type="text" placeholder="Party Name (e.g. Amazon, Landlord)" value={newPartyName} onChange={(e) => setNewPartyName(e.target.value)} required style={{ flex: 1 }} />
              </div>
              <button type="submit" className="add-cat-btn">Add Party</button>
            </form>
          </div>
        </div>
      </PageShell>
    );
  }

  if (view === 'tag_management') {
    return (
      <PageShell {...shellProps}>
        <div className="page-inner slide-up">
          <div className="page-header">
            <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
            <h2 className="page-title">Tags</h2>
          </div>
          <div className="settings-controls fade-in">
            <div className="category-manager">
              {tags.length === 0 ? (
                <div className="empty-state"><p>No tags added yet.</p></div>
              ) : (
                tags.map(tag => (
                  <div key={tag.id} className="settings-cat-block">
                    <div className="settings-cat-parent">
                      <span className="cat-name">{tag.name}</span>
                      <button className="delete-btn" onClick={() => handleDeleteTag(tag.id)}>✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleCreateTag} className="add-category-form">
              <h3>Add Tag</h3>
              <div className="form-row">
                <input type="text" placeholder="Tag Name (e.g. Vacation, Reimbursable)" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} required style={{ flex: 1 }} />
              </div>
              <button type="submit" className="add-cat-btn">Add Tag</button>
            </form>
          </div>
        </div>
      </PageShell>
    );
  }

  if (view === 'category_management') {
    const parents = parentCategories.filter(c => c.type === settingsType);
    return (
      <PageShell {...shellProps}>
        <div className="page-inner slide-up">
          <div className="page-header">
            <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
            <h2 className="page-title">Categories</h2>
          </div>
          <div className="settings-controls fade-in">
            <div className="type-toggle-bar">
              <button className={`type-btn ${settingsType === 'expense' ? 'active-expense' : ''}`} onClick={() => { setSettingsType('expense'); setNewCatParent(''); }}>Expense</button>
              <button className={`type-btn ${settingsType === 'income' ? 'active-income' : ''}`} onClick={() => { setSettingsType('income'); setNewCatParent(''); }}>Income</button>
            </div>
            <div className="category-manager">
              {parents.length === 0 ? (
                <div className="empty-state"><p>No {settingsType} categories found.</p></div>
              ) : (
                parents.map(parent => (
                  <div key={parent.id} className="settings-cat-block">
                    {editingCatId === parent.id ? (
                      <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input type="text" maxLength="2" value={editCatIcon} onChange={(e) => setEditCatIcon(e.target.value)} className="icon-input" style={{ flexShrink: 0 }} />
                          <input type="text" value={editCatName} onChange={(e) => setEditCatName(e.target.value)} className="text-input" style={{ flex: 1 }} autoFocus />
                        </div>
                        <select value={editCatParent} onChange={(e) => setEditCatParent(e.target.value)} className="text-input" style={{ fontSize: '0.875rem' }}>
                          <option value="">— Root Category (no parent) —</option>
                          {parents.filter(p => p.id !== parent.id).map(p => (<option key={p.id} value={p.id}>Subcategory of: {p.icon} {p.name}</option>))}
                        </select>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="add-cat-btn" style={{ padding: '0.5rem 0.875rem' }} onClick={() => handleUpdateCategory(parent.id, { name: editCatName.trim() || parent.name, icon: editCatIcon || parent.icon, parent_id: editCatParent || null })}>Save</button>
                          <button className="icon-btn-text" onClick={() => setEditingCatId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="settings-cat-parent">
                        <span className="cat-icon">{parent.icon}</span>
                        <span className="cat-name">{parent.name}</span>
                        {!parent.is_system && (
                          <>
                            <button className="icon-btn-text" style={{ padding: '0 0.5rem', color: 'var(--primary)', marginRight: '0.25rem' }} onClick={() => { setEditingCatId(parent.id); setEditCatName(parent.name); setEditCatIcon(parent.icon); setEditCatParent(parent.parent_id || ''); }}>✎</button>
                            <button className="delete-btn" onClick={() => handleDeleteCategory(parent.id)}>✕</button>
                          </>
                        )}
                      </div>
                    )}
                    {subCategories.filter(sub => sub.parent_id === parent.id).length > 0 && (
                      <div className="settings-cat-children">
                        {subCategories.filter(sub => sub.parent_id === parent.id).map(sub => (
                          <div key={sub.id}>
                            {editingCatId === sub.id ? (
                              <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <input type="text" maxLength="2" value={editCatIcon} onChange={(e) => setEditCatIcon(e.target.value)} className="icon-input" style={{ flexShrink: 0 }} />
                                  <input type="text" value={editCatName} onChange={(e) => setEditCatName(e.target.value)} className="text-input" style={{ flex: 1 }} autoFocus />
                                </div>
                                <select value={editCatParent} onChange={(e) => setEditCatParent(e.target.value)} className="text-input" style={{ fontSize: '0.875rem' }}>
                                  <option value="">— Root Category (no parent) —</option>
                                  {parents.filter(p => p.id !== sub.id).map(p => (<option key={p.id} value={p.id}>Subcategory of: {p.icon} {p.name}</option>))}
                                </select>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button className="add-cat-btn" style={{ padding: '0.5rem 0.875rem' }} onClick={() => handleUpdateCategory(sub.id, { name: editCatName.trim() || sub.name, icon: editCatIcon || sub.icon, parent_id: editCatParent || null })}>Save</button>
                                  <button className="icon-btn-text" onClick={() => setEditingCatId(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="settings-cat-child">
                                <span className="cat-icon">{sub.icon}</span>
                                <span className="cat-name">{sub.name}</span>
                                <button className="icon-btn-text" style={{ padding: '0 0.5rem', color: 'var(--primary)', marginRight: '0.25rem' }} onClick={() => { setEditingCatId(sub.id); setEditCatName(sub.name); setEditCatIcon(sub.icon); setEditCatParent(sub.parent_id || ''); }}>✎</button>
                                <button className="delete-btn" onClick={() => handleDeleteCategory(sub.id)}>✕</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleCreateCategory} className="add-category-form">
              <h3>Add Custom Category</h3>
              <div className="form-row">
                <input type="text" maxLength="2" placeholder="💰" value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} className="icon-input" required />
                <input type="text" placeholder="Category Name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required style={{ flex: 1 }} />
              </div>
              <select value={newCatParent} onChange={(e) => setNewCatParent(e.target.value)}>
                <option value="">-- Root Category --</option>
                {parents.map(p => (<option key={p.id} value={p.id}>Subcategory of: {p.name}</option>))}
              </select>
              <button type="submit" className="add-cat-btn">Save Category</button>
            </form>
          </div>
        </div>
      </PageShell>
    );
  }

  if (view === 'new_transaction') {
    const currentParents = parentCategories.filter(c => c.type === txType);
    const applicableSubs = subCategories.filter(sub => currentParents.some(p => p.id === sub.parent_id));
    const filteredCats = [...currentParents, ...applicableSubs].filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));
    const filteredAccounts = accounts.filter(a => a.name.toLowerCase().includes(accountSearch.toLowerCase()));
    const accountItems = [{ id: null, _clear: true }, ...filteredAccounts];
    const filteredParties = parties.filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase()));
    const showCreateParty = partySearch.trim() !== '' && !parties.some(p => p.name.toLowerCase() === partySearch.trim().toLowerCase());
    const partyItems = [{ id: null, _clear: true }, ...(showCreateParty ? [{ id: null, _create: true, name: partySearch.trim() }] : []), ...filteredParties];
    const filteredTagItems = tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()));
    const filteredTransferFromAccounts = accounts.filter(a => a.name.toLowerCase().includes(transferFromSearch.toLowerCase()));
    const filteredTransferToAccounts = accounts.filter(a => a.name.toLowerCase().includes(transferToSearch.toLowerCase()));

    return (
      <PageShell {...shellProps}>
        <div className="page-inner slide-up" style={{ maxWidth: '640px' }}>
          <div className="page-header">
            <button className="icon-btn-text" onClick={() => { resetForm(); setView(txToEdit ? 'ledger' : 'dashboard'); }}>← Cancel</button>
            <h2 className="page-title">{txToEdit ? 'Edit Transaction' : 'New Transaction'}</h2>
          </div>
          <div className="fluid-input-area fade-in">
            <div className="type-toggle-bar">
              <button className={`type-btn ${txType === 'expense' ? 'active-expense' : ''}`} onClick={() => { setTxType('expense'); setSelectedCategory(null); setSelectedSubcategory(null); }}>Expense</button>
              <button className={`type-btn ${txType === 'income' ? 'active-income' : ''}`} onClick={() => { setTxType('income'); setSelectedCategory(null); setSelectedSubcategory(null); }}>Income</button>
              <button className={`type-btn ${txType === 'transfer' ? 'active-transfer' : ''}`} onClick={() => { setTxType('transfer'); setSelectedCategory(null); setSelectedSubcategory(null); }}>Transfer</button>
            </div>
            <div className="amount-input-wrapper">
              <span className="currency-prefix">{currencySymbol}</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="amount-input" autoFocus />
            </div>
            <div className="category-selection-area" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
              <p className="selection-label">Date</p>
              <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="text-input" />
            </div>
            <div className="category-selection-area">
              <p className="selection-label">Note</p>
              <input type="text" placeholder="Description (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="text-input" />
            </div>
            {txType === 'transfer' && (<>
              <div className="category-selection-area" style={{ position: 'relative', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <p className="selection-label">From Account</p>
                <div className="searchable-dropdown" onBlur={() => setTimeout(() => { setShowTransferFromDropdown(false); setTransferFromFocusedIndex(-1); }, 200)}>
                  <input type="text" className="text-input" placeholder="From Account..." value={transferFromAccount ? accounts.find(a => a.id === transferFromAccount)?.name ?? transferFromSearch : transferFromSearch} onChange={(e) => { setTransferFromSearch(e.target.value); setTransferFromAccount(null); setShowTransferFromDropdown(true); setTransferFromFocusedIndex(-1); }} onFocus={() => setShowTransferFromDropdown(true)} onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); if (!showTransferFromDropdown) setShowTransferFromDropdown(true); setTransferFromFocusedIndex(i => Math.min(i + 1, filteredTransferFromAccounts.length - 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setTransferFromFocusedIndex(i => Math.max(i - 1, 0)); } else if (e.key === 'Enter' && transferFromFocusedIndex >= 0) { e.preventDefault(); const a = filteredTransferFromAccounts[transferFromFocusedIndex]; if (a) { setTransferFromAccount(a.id); setTransferFromSearch(''); setShowTransferFromDropdown(false); setTransferFromFocusedIndex(-1); } } else if (e.key === 'Escape') { setShowTransferFromDropdown(false); setTransferFromFocusedIndex(-1); } }} />
                  {showTransferFromDropdown && (
                    <div className="dropdown-menu" ref={transferFromMenuRef}>
                      {filteredTransferFromAccounts.map((a, idx) => (<div key={a.id} className={`dropdown-item${transferFromFocusedIndex === idx ? ' dropdown-item-focused' : ''}`} onClick={() => { setTransferFromAccount(a.id); setTransferFromSearch(''); setShowTransferFromDropdown(false); setTransferFromFocusedIndex(-1); }}><span style={{ marginRight: '0.4rem', opacity: 0.6 }}>🏦</span> {a.name}</div>))}
                      {filteredTransferFromAccounts.length === 0 && <div className="dropdown-item disabled">No matching account</div>}
                    </div>
                  )}
                </div>
              </div>
              <div className="category-selection-area" style={{ position: 'relative' }}>
                <p className="selection-label">To Account</p>
                <div className="searchable-dropdown" onBlur={() => setTimeout(() => { setShowTransferToDropdown(false); setTransferToFocusedIndex(-1); }, 200)}>
                  <input type="text" className="text-input" placeholder="To Account..." value={transferToAccount ? accounts.find(a => a.id === transferToAccount)?.name ?? transferToSearch : transferToSearch} onChange={(e) => { setTransferToSearch(e.target.value); setTransferToAccount(null); setShowTransferToDropdown(true); setTransferToFocusedIndex(-1); }} onFocus={() => setShowTransferToDropdown(true)} onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); if (!showTransferToDropdown) setShowTransferToDropdown(true); setTransferToFocusedIndex(i => Math.min(i + 1, filteredTransferToAccounts.length - 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setTransferToFocusedIndex(i => Math.max(i - 1, 0)); } else if (e.key === 'Enter' && transferToFocusedIndex >= 0) { e.preventDefault(); const a = filteredTransferToAccounts[transferToFocusedIndex]; if (a) { setTransferToAccount(a.id); setTransferToSearch(''); setShowTransferToDropdown(false); setTransferToFocusedIndex(-1); } } else if (e.key === 'Escape') { setShowTransferToDropdown(false); setTransferToFocusedIndex(-1); } }} />
                  {showTransferToDropdown && (
                    <div className="dropdown-menu" ref={transferToMenuRef}>
                      {filteredTransferToAccounts.map((a, idx) => (<div key={a.id} className={`dropdown-item${transferToFocusedIndex === idx ? ' dropdown-item-focused' : ''}`} onClick={() => { setTransferToAccount(a.id); setTransferToSearch(''); setShowTransferToDropdown(false); setTransferToFocusedIndex(-1); }}><span style={{ marginRight: '0.4rem', opacity: 0.6 }}>🏦</span> {a.name}</div>))}
                      {filteredTransferToAccounts.length === 0 && <div className="dropdown-item disabled">No matching account</div>}
                    </div>
                  )}
                </div>
              </div>
            </>)}
            {txType !== 'transfer' && (<>
              <div className="category-selection-area" style={{ position: 'relative', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <p className="selection-label">Account</p>
                <div className="searchable-dropdown" onBlur={() => setTimeout(() => { setShowAccountDropdown(false); setAccountFocusedIndex(-1); }, 200)}>
                  <input type="text" className="text-input" placeholder="Select Account (optional)..." value={selectedAccount ? accounts.find(a => a.id === selectedAccount)?.name ?? accountSearch : accountSearch} onChange={(e) => { setAccountSearch(e.target.value); setSelectedAccount(null); setShowAccountDropdown(true); setAccountFocusedIndex(-1); }} onFocus={() => setShowAccountDropdown(true)} onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); if (!showAccountDropdown) setShowAccountDropdown(true); setAccountFocusedIndex(i => Math.min(i + 1, accountItems.length - 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setAccountFocusedIndex(i => Math.max(i - 1, 0)); } else if (e.key === 'Enter' && accountFocusedIndex >= 0) { e.preventDefault(); const item = accountItems[accountFocusedIndex]; if (item) { if (item._clear) { setSelectedAccount(null); setAccountSearch(''); } else { setSelectedAccount(item.id); setAccountSearch(''); } setShowAccountDropdown(false); setAccountFocusedIndex(-1); } } else if (e.key === 'Escape') { setShowAccountDropdown(false); setAccountFocusedIndex(-1); } }} />
                  {showAccountDropdown && (
                    <div className="dropdown-menu" ref={accountMenuRef}>
                      <div className={`dropdown-item${accountFocusedIndex === 0 ? ' dropdown-item-focused' : ''}`} onClick={() => { setSelectedAccount(null); setAccountSearch(''); setShowAccountDropdown(false); setAccountFocusedIndex(-1); }}><em style={{ color: 'var(--text-muted)' }}>None / Clear</em></div>
                      {filteredAccounts.map((a, idx) => (<div key={a.id} className={`dropdown-item${accountFocusedIndex === idx + 1 ? ' dropdown-item-focused' : ''}`} onClick={() => { setSelectedAccount(a.id); setAccountSearch(''); setShowAccountDropdown(false); setAccountFocusedIndex(-1); }}><span style={{ marginRight: '0.4rem', opacity: 0.6 }}>🏦</span> {a.name}</div>))}
                      {filteredAccounts.length === 0 && <div className="dropdown-item disabled">No matching account</div>}
                    </div>
                  )}
                </div>
              </div>
              <div className="category-selection-area" style={{ position: 'relative' }}>
                <p className="selection-label">Category</p>
                <div className="searchable-dropdown" onBlur={() => setTimeout(() => { setShowCatDropdown(false); setCatFocusedIndex(-1); }, 200)}>
                  <input type="text" className="text-input" placeholder="Search Category..." value={selectedCategory ? [...currentParents, ...applicableSubs].find(c => c.id === selectedCategory)?.name ?? catSearch : catSearch} onChange={(e) => { setCatSearch(e.target.value); setSelectedCategory(null); setShowCatDropdown(true); setCatFocusedIndex(-1); }} onFocus={() => setShowCatDropdown(true)} onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); if (!showCatDropdown) setShowCatDropdown(true); setCatFocusedIndex(i => Math.min(i + 1, filteredCats.length - 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setCatFocusedIndex(i => Math.max(i - 1, 0)); } else if (e.key === 'Enter' && catFocusedIndex >= 0) { e.preventDefault(); const c = filteredCats[catFocusedIndex]; if (c) { setSelectedCategory(c.id); setCatSearch(''); setShowCatDropdown(false); setCatFocusedIndex(-1); } } else if (e.key === 'Escape') { setShowCatDropdown(false); setCatFocusedIndex(-1); } }} />
                  {showCatDropdown && (
                    <div className="dropdown-menu" ref={catMenuRef}>
                      {filteredCats.map((c, idx) => { const isSub = !!c.parent_id; const pName = isSub ? currentParents.find(p => p.id === c.parent_id)?.name : null; return (<div key={c.id} className={`dropdown-item${catFocusedIndex === idx ? ' dropdown-item-focused' : ''}`} onClick={() => { setSelectedCategory(c.id); setCatSearch(''); setShowCatDropdown(false); setCatFocusedIndex(-1); }}>{c.icon} {c.name}{isSub && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>in {pName}</span>}</div>); })}
                      {filteredCats.length === 0 && <div className="dropdown-item disabled">No matching category</div>}
                    </div>
                  )}
                </div>
              </div>
              <div className="category-selection-area" style={{ position: 'relative' }}>
                <p className="selection-label">Counterparty</p>
                <div className="searchable-dropdown" onBlur={() => setTimeout(() => { setShowPartyDropdown(false); setPartyFocusedIndex(-1); }, 200)}>
                  <input type="text" className="text-input" placeholder="Select Party (optional)..." value={selectedParty ? parties.find(p => p.id === selectedParty)?.name ?? partySearch : partySearch} onChange={(e) => { setPartySearch(e.target.value); setSelectedParty(null); setShowPartyDropdown(true); setPartyFocusedIndex(-1); }} onFocus={() => setShowPartyDropdown(true)} onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); if (!showPartyDropdown) setShowPartyDropdown(true); setPartyFocusedIndex(i => Math.min(i + 1, partyItems.length - 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setPartyFocusedIndex(i => Math.max(i - 1, 0)); } else if (e.key === 'Enter') { e.preventDefault(); if (partyFocusedIndex >= 0) { const item = partyItems[partyFocusedIndex]; if (item) { if (item._clear) { setSelectedParty(null); setPartySearch(''); setShowPartyDropdown(false); setPartyFocusedIndex(-1); } else if (item._create) { handleCreateAndSelectParty(item.name); } else { setSelectedParty(item.id); setPartySearch(''); setShowPartyDropdown(false); setPartyFocusedIndex(-1); } } } else if (showCreateParty) { handleCreateAndSelectParty(partySearch); } } else if (e.key === 'Escape') { setShowPartyDropdown(false); setPartyFocusedIndex(-1); } }} />
                  {showPartyDropdown && (
                    <div className="dropdown-menu" ref={partyMenuRef}>
                      <div className={`dropdown-item${partyFocusedIndex === 0 ? ' dropdown-item-focused' : ''}`} onClick={() => { setSelectedParty(null); setPartySearch(''); setShowPartyDropdown(false); setPartyFocusedIndex(-1); }}><em style={{ color: 'var(--text-muted)' }}>None / Clear</em></div>
                      {showCreateParty && <div className={`dropdown-item${partyFocusedIndex === 1 ? ' dropdown-item-focused' : ''}`} onClick={() => handleCreateAndSelectParty(partySearch)}><span style={{ marginRight: '0.4rem' }}>➕</span>Create <strong>"{partySearch.trim()}"</strong></div>}
                      {filteredParties.map((p, idx) => (<div key={p.id} className={`dropdown-item${partyFocusedIndex === idx + (showCreateParty ? 2 : 1) ? ' dropdown-item-focused' : ''}`} onClick={() => { setSelectedParty(p.id); setPartySearch(''); setShowPartyDropdown(false); setPartyFocusedIndex(-1); }}><span style={{ marginRight: '0.4rem', opacity: 0.6 }}>👥</span> {p.name}</div>))}
                      {filteredParties.length === 0 && !showCreateParty && <div className="dropdown-item disabled">No matching party</div>}
                    </div>
                  )}
                </div>
              </div>
              <div className="category-selection-area" style={{ position: 'relative' }}>
                <p className="selection-label">Tags</p>
                {selectedTags.length > 0 && (
                  <div className="tag-chips-row">
                    {selectedTags.map(tagId => { const tag = tags.find(t => t.id === tagId); if (!tag) return null; return (<span key={tagId} className="tag-chip">{tag.name}<button type="button" className="tag-chip-remove" onClick={() => handleToggleTag(tagId)}>×</button></span>); })}
                  </div>
                )}
                <div className="searchable-dropdown" onBlur={() => setTimeout(() => { setShowTagDropdown(false); setTagFocusedIndex(-1); }, 200)}>
                  <input type="text" className="text-input" placeholder="Add tags (optional)..." value={tagSearch} onChange={(e) => { setTagSearch(e.target.value); setShowTagDropdown(true); setTagFocusedIndex(-1); }} onFocus={() => setShowTagDropdown(true)} onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); if (!showTagDropdown) setShowTagDropdown(true); setTagFocusedIndex(i => Math.min(i + 1, filteredTagItems.length - 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setTagFocusedIndex(i => Math.max(i - 1, 0)); } else if (e.key === 'Enter' && tagFocusedIndex >= 0) { e.preventDefault(); const t = filteredTagItems[tagFocusedIndex]; if (t) { handleToggleTag(t.id); setTagSearch(''); } } else if (e.key === 'Escape') { setShowTagDropdown(false); setTagFocusedIndex(-1); } }} />
                  {showTagDropdown && (
                    <div className="dropdown-menu" ref={tagMenuRef}>
                      {filteredTagItems.map((t, idx) => (<div key={t.id} className={`dropdown-item${selectedTags.includes(t.id) ? ' tag-item-selected' : ''}${tagFocusedIndex === idx ? ' dropdown-item-focused' : ''}`} onMouseDown={(e) => { e.preventDefault(); handleToggleTag(t.id); setTagSearch(''); }}><span className="tag-checkbox">{selectedTags.includes(t.id) ? '☑' : '☐'}</span>{t.name}</div>))}
                      {filteredTagItems.length === 0 && <div className="dropdown-item disabled">No matching tag</div>}
                    </div>
                  )}
                </div>
              </div>
            </>)}
            <button className={`submit-tx-btn bg-${txType}`} onClick={handleTransaction} disabled={txType === 'transfer' ? (!amount || !transferFromAccount || !transferToAccount) : (!amount || !selectedCategory)}>
              {txToEdit ? `Update ${txType === 'transfer' ? 'Transfer' : 'Transaction'}` : `Save ${txType === 'transfer' ? 'Transfer' : 'Transaction'}`}
            </button>
            {txToEdit && (
              <button className="settings-logout-btn" style={{ marginTop: '0.75rem', textAlign: 'center' }} onClick={handleDeleteTransaction}>Delete Transaction</button>
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  if (view === 'ledger') {
    const activeFiltersCount =
      (filterOptions.type !== 'all' ? 1 : 0) +
      (filterOptions.dateRange.start ? 1 : 0) +
      (filterOptions.dateRange.end ? 1 : 0) +
      filterOptions.categoryIds.length +
      filterOptions.tagIds.length +
      filterOptions.accountIds.length;

    const PRESET_LABELS = { all: 'All Time', today: 'Today', this_week: 'This Week', this_month: 'This Month', last_3m: '3 Months' };

    return (
      <PageShell {...shellProps}>
        <div className="page-inner fade-in">

          {/* Header */}
          <div className="section-header-row">
            <h2 className="section-title-editorial">Transactions</h2>
            <span className="tx-count">{filteredLedger.length} result{filteredLedger.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Search + Type Toggle */}
          <div className="ledger-filter-bar">
            <div className="ledger-search-wrap">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                className="ledger-search-input"
                placeholder="Search payee, note, category..."
                value={filterOptions.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
              />
              {filterOptions.searchTerm && (
                <button className="search-clear-btn" onClick={() => updateFilter('searchTerm', '')}>✕</button>
              )}
            </div>
            <div className="type-toggle-bar">
              {['all', 'income', 'expense', 'transfer'].map(t => (
                <button
                  key={t}
                  className={`type-btn${filterOptions.type === t ? (t === 'expense' ? ' active-expense' : t === 'income' ? ' active-income' : ' active-transfer') : ''}`}
                  onClick={() => updateFilter('type', t)}
                >
                  {t === 'all' ? 'All' : t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Presets + Filter Toggle */}
          <div className="filter-pills-row">
            {Object.entries(PRESET_LABELS).map(([key, label]) => (
              <button
                key={key}
                className={`filter-pill${filterOptions.preset === key ? ' active-pill' : ''}`}
                onClick={() => applyDatePreset(key)}
              >
                {label}
              </button>
            ))}
            <button
              className={`filter-toggle-btn${showAdvancedFilters ? ' active' : ''}`}
              onClick={() => setShowFilters(!showAdvancedFilters)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              Filters
              {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
            </button>
          </div>

          {/* Active filter chips summary */}
          {activeFiltersCount > 0 && !showAdvancedFilters && (
            <div className="filter-active-summary slide-up">
              <span className="label-sm" style={{ opacity: 0.6, flexShrink: 0 }}>Filtering by:</span>
              {filterOptions.type !== 'all' && (
                <span className="active-filter-tag">
                  {filterOptions.type}
                  <span className="active-filter-remove" onClick={() => updateFilter('type', 'all')}>✕</span>
                </span>
              )}
              {filterOptions.accountIds.map(id => {
                const a = accounts.find(x => x.id === id);
                return a ? <span key={id} className="active-filter-tag">{a.name} <span className="active-filter-remove" onClick={() => updateFilter('accountIds', filterOptions.accountIds.filter(x => x !== id))}>✕</span></span> : null;
              })}
              {filterOptions.categoryIds.map(id => {
                const c = categories.find(x => x.id === id);
                return c ? <span key={id} className="active-filter-tag">{c.icon} {c.name} <span className="active-filter-remove" onClick={() => updateFilter('categoryIds', filterOptions.categoryIds.filter(x => x !== id))}>✕</span></span> : null;
              })}
              {filterOptions.tagIds.map(id => {
                const tg = tags.find(x => x.id === id);
                return tg ? <span key={id} className="active-filter-tag">#{tg.name} <span className="active-filter-remove" onClick={() => updateFilter('tagIds', filterOptions.tagIds.filter(x => x !== id))}>✕</span></span> : null;
              })}
              <button className="filter-clear-all-btn" onClick={resetFilters}>Clear All</button>
            </div>
          )}

          {/* Filter Panel */}
          {showAdvancedFilters && (
            <FilterPanel
              categories={categories}
              tags={tags}
              accounts={accounts}
              filterOptions={filterOptions}
              onUpdateFilter={updateFilter}
              onResetFilters={resetFilters}
            />
          )}

          {/* Transaction List */}
          <div className="editorial-list" style={{ marginTop: '1.5rem' }}>
            {groupedLedger.map(([date, txs]) => (
              <div key={date} className="ledger-date-group">
                <div className="ledger-date-header">
                  <span className="ledger-date-text">{formatGroupDate(date)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {txs.map(t => {
                    const cat = t.categories || { icon: '•', name: 'Uncategorized' };
                    return (
                      <div key={t.id} className="editorial-item" onClick={() => openEditTransaction(t)}>
                        <div className="editorial-icon">{cat.icon}</div>
                        <div className="editorial-info">
                          <div className="editorial-title">{t.parties?.name || cat.name}</div>
                          <div className="editorial-meta">
                            {cat.name} · {t.accounts?.name || 'Cash'}
                            {t.transaction_tags?.length > 0 && (
                              <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>
                                {t.transaction_tags.map(tt => `#${tt.tags?.name}`).filter(Boolean).join(' ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="editorial-amount-wrap">
                          <div className={`editorial-amount ${t.type}`}>
                            {t.transfer_id ? '⇄' : t.type === 'income' ? '+' : '-'}{currencySymbol}{parseFloat(t.amount).toFixed(2)}
                          </div>
                          <div className="editorial-status">{t.transfer_id ? 'TRANSFER' : 'CLEARED'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredLedger.length === 0 && (
              <div className="empty-ledger-state fade-in">
                <svg className="empty-ledger-graphic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p className="title-lg">No Results</p>
                  <p className="body-md">No transactions match your current filters.</p>
                </div>
                <button className="launch-btn" style={{ maxWidth: '200px', marginTop: '1rem' }} onClick={resetFilters}>Reset Filters</button>
              </div>
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  // --- BUDGETS VIEW ---
  if (view === 'budgets') {
    const totalBudgeted = budgetProgress.reduce((s, b) => s + b.amount_limit, 0);
    const totalSpent = budgetProgress.reduce((s, b) => s + b.spent, 0);
    const totalRemaining = Math.max(0, totalBudgeted - totalSpent);
    const overCount = budgetProgress.filter(b => b.status === 'over').length;
    const warnCount = budgetProgress.filter(b => b.status === 'warning').length;
    const healthPct = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0;
    const healthData = totalBudgeted > 0
      ? [{ name: 'Spent', value: Math.min(totalSpent, totalBudgeted) }, { name: 'Remaining', value: Math.max(0, totalRemaining) }]
      : [{ name: 'No budgets', value: 1 }];
    const parentCategories = categories.filter(c => !c.parent_id);

    return (
      <>
      <PageShell {...shellProps}>
        <div className="page-inner fade-in">

          {/* Header */}
          <div className="section-header-row">
            <h2 className="section-title-editorial">Budgets</h2>
            <button className="section-action-link" onClick={openNewBudget}>+ New Budget</button>
          </div>

          {budgets.length === 0 ? (
            <div className="empty-ledger-state" style={{ marginTop: '2rem' }}>
              <svg className="empty-ledger-graphic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20v-6M6 20V10M18 20V4"/>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p className="title-lg">No Budgets Yet</p>
                <p className="body-md">Create your first budget to start tracking spending limits.</p>
              </div>
              <button className="launch-btn" style={{ maxWidth: '200px', marginTop: '1rem' }} onClick={openNewBudget}>Create Budget</button>
            </div>
          ) : (
            <>
              {/* Global Health Card */}
              <div className="budget-health-card">
                <div className="budget-health-donut">
                  <PieChart width={160} height={160}>
                    <Pie data={healthData} cx={75} cy={75} innerRadius={50} outerRadius={70} dataKey="value" startAngle={90} endAngle={450} paddingAngle={healthData.length > 1 ? 3 : 0}>
                      <Cell fill={healthPct >= 100 ? '#93000a' : healthPct >= 80 ? '#e65100' : '#000666'} />
                      <Cell fill="var(--surface-container-low)" />
                    </Pie>
                  </PieChart>
                  <div className="budget-health-center">
                    <span className="budget-health-pct">{healthPct}%</span>
                    <span className="budget-health-label">used</span>
                  </div>
                </div>
                <div className="budget-health-stats">
                  <div className="budget-health-stat">
                    <p className="kpi-label">Total Budgeted</p>
                    <p className="kpi-value">{currencySymbol}{totalBudgeted.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="budget-health-stat">
                    <p className="kpi-label">Spent This Period</p>
                    <p className={`kpi-value ${healthPct >= 100 ? 'expense' : ''}`}>{currencySymbol}{totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="budget-health-stat">
                    <p className="kpi-label">Remaining</p>
                    <p className="kpi-value income">{currencySymbol}{totalRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {overCount > 0 && <span className="budget-status-badge budget-status-over">{overCount} over budget</span>}
                    {warnCount > 0 && <span className="budget-status-badge budget-status-warning">{warnCount} near limit</span>}
                    {overCount === 0 && warnCount === 0 && <span className="budget-status-badge budget-status-ok">All on track</span>}
                  </div>
                </div>
              </div>

              {/* Budget Cards */}
              <div className="budget-list">
                {budgetProgress.map(b => {
                  const cat = categories.find(c => c.id === b.category_id);
                  const name = b.name || cat?.name || 'Overall Budget';
                  const icon = cat?.icon || '🌐';
                  const periodLabel = { monthly: 'Monthly', weekly: 'Weekly', quarterly: 'Quarterly' }[b.period];
                  return (
                    <div key={b.id} className={`budget-card budget-card-${b.status}`} onClick={() => openEditBudget(b)}>
                      <div className="budget-card-header">
                        <div className="budget-card-info">
                          <span className="budget-icon">{icon}</span>
                          <div>
                            <p className="budget-name">{name}</p>
                            <p className="budget-period-label">{periodLabel}</p>
                          </div>
                        </div>
                        <span className={`budget-status-badge budget-status-${b.status}`}>
                          {b.status === 'over' ? 'Over Budget' : b.status === 'warning' ? 'Near Limit' : 'On Track'}
                        </span>
                      </div>

                      <div className="budget-amounts-row">
                        <span className="budget-spent-val">{currencySymbol}{b.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span className="budget-limit-val">of {currencySymbol}{parseFloat(b.amount_limit).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>

                      <div className="budget-bar-track">
                        <div className={`budget-bar-fill budget-bar-${b.status}`} style={{ width: `${b.pct}%` }} />
                        {b.projected > b.amount_limit && b.pct < 100 && (
                          <div className="budget-projected-marker" style={{ left: `${Math.min(98, (b.amount_limit / b.projected) * 100)}%` }} />
                        )}
                      </div>

                      <div className="budget-footer-row">
                        <span className="budget-pct-text">{Math.round(b.rawPct)}% used</span>
                        {b.remaining > 0 && <span className="budget-remaining-text">{currencySymbol}{b.remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} left</span>}
                        {b.projected > b.amount_limit && (
                          <span className="budget-projected-text">⚠ Projected {currencySymbol}{Math.round(b.projected).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>
      </PageShell>

      {/* Create / Edit Modal — rendered outside PageShell to prevent remount on state change */}
      {showBudgetModal && (
        <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingBudget ? 'Edit Budget' : 'New Budget'}</h3>
              <button className="modal-close" onClick={() => setShowBudgetModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveBudget} className="modal-form">
              {/* Period */}
              <div className="form-group">
                <label className="form-label">Period</label>
                <div className="type-toggle-bar">
                  {['monthly', 'weekly', 'quarterly'].map(p => (
                    <button key={p} type="button"
                      className={`type-btn${budgetForm.period === p ? ' active-transfer' : ''}`}
                      onClick={() => setBudgetForm(f => ({ ...f, period: p }))}
                      style={{ textTransform: 'capitalize' }}
                    >{p}</button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category <span style={{ opacity: 0.5 }}>(leave blank for overall)</span></label>
                <select className="text-input" value={budgetForm.category_id} onChange={e => setBudgetForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">Overall Budget</option>
                  {parentCategories.map(c => (
                    <optgroup key={c.id} label={`${c.icon} ${c.name}`}>
                      <option value={c.id}>{c.icon} {c.name} (all)</option>
                      {categories.filter(sc => sc.parent_id === c.id).map(sc => (
                        <option key={sc.id} value={sc.id}>— {sc.icon} {sc.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Auto-suggestion */}
              {budgetSuggestion !== null && budgetSuggestion > 0 && (
                <div className="budget-suggestion" onClick={() => setBudgetForm(f => ({ ...f, amount_limit: String(budgetSuggestion) }))}>
                  <span>💡 Based on your last 3 months, suggested limit:</span>
                  <strong> {currencySymbol}{budgetSuggestion.toLocaleString()} / {budgetForm.period}</strong>
                  <span className="budget-suggestion-apply">Apply →</span>
                </div>
              )}

              {/* Amount */}
              <div className="form-group">
                <label className="form-label">Spending Limit</label>
                <div className="amount-input-wrapper">
                  <span className="currency-symbol-label">{currencySymbol}</span>
                  <input type="number" className="text-input amount-input" placeholder="0.00" min="1" step="any" required value={budgetForm.amount_limit} onChange={e => setBudgetForm(f => ({ ...f, amount_limit: e.target.value }))} />
                </div>
              </div>

              {/* Optional name */}
              <div className="form-group">
                <label className="form-label">Custom Name <span style={{ opacity: 0.5 }}>(optional)</span></label>
                <input type="text" className="text-input" placeholder="e.g. Dining Out, Utilities" value={budgetForm.name} onChange={e => setBudgetForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="modal-actions">
                {editingBudget && (
                  <button type="button" className="btn-danger" onClick={() => handleDeleteBudget(editingBudget.id)}>Delete</button>
                )}
                <button type="submit" className="btn-primary">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
    );
  }

  // --- ANALYTICS VIEW ---
  if (view === 'analytics') {
    const PRESET_LABELS = { all: 'All Time', today: 'Today', this_week: 'This Week', this_month: 'This Month', last_3m: '3 Months', this_year: 'This Year' };
    const analyticsActiveCount =
      (analyticsFilters.type !== 'all' ? 1 : 0) +
      (analyticsFilters.dateRange.start ? 1 : 0) +
      analyticsFilters.categoryIds.length + analyticsFilters.tagIds.length + analyticsFilters.accountIds.length;

    return (
      <PageShell {...shellProps}>
        <div className="page-inner fade-in">
          <div className="section-header-row">
            <h2 className="section-title-editorial">Analytics</h2>
          </div>

          {/* Date preset + filter toggle */}
          <div className="filter-pills-row" style={{ marginTop: '1.5rem' }}>
            {Object.entries(PRESET_LABELS).map(([key, label]) => (
              <button key={key} className={`filter-pill${analyticsFilters.preset === key ? ' active-pill' : ''}`} onClick={() => applyAnalyticsPreset(key)}>{label}</button>
            ))}
            <button className={`filter-toggle-btn${showAnalyticsFilters ? ' active' : ''}`} onClick={() => setShowAnalyticsFilters(v => !v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              Filters
              {analyticsActiveCount > 0 && <span className="filter-badge">{analyticsActiveCount}</span>}
            </button>
          </div>

          {showAnalyticsFilters && (
            <FilterPanel categories={categories} tags={tags} accounts={accounts} filterOptions={analyticsFilters} onUpdateFilter={updateAnalyticsFilter} onResetFilters={resetAnalyticsFilters} />
          )}

          {/* KPI Ribbon */}
          <div className="kpi-ribbon">
            <div className="kpi-card"><p className="kpi-label">Total Income</p><p className="kpi-value income">{currencySymbol}{analyticsKPIs.totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
            <div className="kpi-card"><p className="kpi-label">Total Expenses</p><p className="kpi-value expense">{currencySymbol}{analyticsKPIs.totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
            <div className="kpi-card"><p className="kpi-label">Net Flow</p><p className={`kpi-value ${analyticsKPIs.net >= 0 ? 'income' : 'expense'}`}>{analyticsKPIs.net >= 0 ? '+' : ''}{currencySymbol}{analyticsKPIs.net.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
            <div className="kpi-card"><p className="kpi-label">Daily Burn</p><p className="kpi-value">{currencySymbol}{analyticsKPIs.dailyBurn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
            <div className="kpi-card"><p className="kpi-label">Transactions</p><p className="kpi-value">{analyticsKPIs.txCount}</p></div>
            {topExpenseCat && <div className="kpi-card"><p className="kpi-label">Top Category</p><p className="kpi-value" style={{ fontSize: '1rem', letterSpacing: 0 }}>{topExpenseCat[0]}</p></div>}
          </div>

          {/* Charts */}
          <div className="analytics-charts-grid">

            {/* Cash Flow — full width */}
            <div className="chart-card chart-card-full">
              <p className="chart-title">Cash Flow Velocity</p>
              <p className="chart-subtitle">Daily income vs. expenses{chartTimeSeries.length > 60 ? ' (weekly)' : ''}{chartTimeSeries.length > 200 ? ' (monthly)' : ''}</p>
              <div className="chart-legend">
                <span className="chart-legend-dot" style={{ background: '#2e7d32' }} /> Income
                <span className="chart-legend-dot" style={{ background: '#93000a', marginLeft: '1rem' }} /> Expense
              </div>
              <CashFlowChart data={chartTimeSeries} currencySymbol={currencySymbol} />
            </div>

            {/* Donut */}
            <div className="chart-card">
              <p className="chart-title">Spending by Category</p>
              <p className="chart-subtitle">Breakdown of expenses</p>
              <CategoryDonutChart data={chartCategorical} currencySymbol={currencySymbol} />
            </div>

            {/* Tags */}
            <div className="chart-card">
              <p className="chart-title">Tag Breakdown</p>
              <p className="chart-subtitle">Amount by tag label</p>
              <TagBarChart data={chartTags} currencySymbol={currencySymbol} />
            </div>

          </div>
        </div>
      </PageShell>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <PageShell {...shellProps}>
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
