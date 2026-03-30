import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from './supabaseClient';
import './App.css';

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };

const formatGroupDate = (dateStr) => {
  if (!dateStr || dateStr === 'Unknown') return 'Unknown Date';
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

const CustomDropdown = ({ options, value, onChange, placeholder = "Select option", label = "", showSearch = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const filteredOptions = useMemo(() => options.filter(opt => (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase())), [options, searchTerm]);
  const selectedOption = useMemo(() => options.find(opt => opt.value === value), [options, value]);
  const handleToggle = () => { setIsOpen(!isOpen); if (!isOpen) { setSearchTerm(''); setFocusedIndex(-1); setTimeout(() => searchInputRef.current?.focus(), 10); } };
  const handleSelect = (option) => { onChange(option.value); setIsOpen(false); setSearchTerm(''); };
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(p => (p < filteredOptions.length - 1 ? p + 1 : p)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(p => (p > 0 ? p - 1 : p)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (focusedIndex >= 0) handleSelect(filteredOptions[focusedIndex]); else if (!isOpen) handleToggle(); }
    else if (e.key === 'Escape') setIsOpen(false);
  };
  useEffect(() => {
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="custom-dropdown-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      {label && <p className="label-sm">{label}</p>}
      <div className="custom-dropdown" ref={containerRef} onKeyDown={handleKeyDown}>
        <button type="button" className={`dropdown-trigger ${isOpen ? 'open' : ''}`} onClick={handleToggle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {selectedOption?.icon && <span className="dropdown-option-icon">{selectedOption.icon}</span>}
            <span style={{ opacity: selectedOption ? 1 : 0.6 }}>{selectedOption ? selectedOption.label : placeholder}</span>
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        {isOpen && (
          <div className="dropdown-menu">
            {showSearch && <div className="dropdown-search-wrap"><input ref={searchInputRef} type="text" className="dropdown-search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} /></div>}
            <div className="dropdown-options">
              {filteredOptions.map((opt, idx) => (<div key={opt.value || idx} className={`dropdown-option ${opt.value === value ? 'selected' : ''} ${idx === focusedIndex ? 'focused' : ''}`} onClick={() => handleSelect(opt)}>{opt.icon && <span className="dropdown-option-icon">{opt.icon}</span>}<span>{opt.label}</span></div>))}
              {filteredOptions.length === 0 && <div className="dropdown-no-results">No results</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Sidebar = ({ view, onDashboard, onLedger, onAnalytics, onBudgets, onNewTx, onSettings, onLogout }) => (
  <aside className="sidebar">
    <div className="sidebar-brand-wrapper"><div className="sidebar-brand">MOMA</div><div className="sidebar-subtitle">THE DIGITAL LEDGER</div></div>
    <nav className="sidebar-nav">
      <button className={`sidebar-item ${view === 'dashboard' ? 'active' : ''}`} onClick={onDashboard}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>Portfolio</button>
      <button className={`sidebar-item ${view === 'ledger' ? 'active' : ''}`} onClick={onLedger}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>Transactions</button>
      <button className={`sidebar-item ${view === 'budgets' ? 'active' : ''}`} onClick={onBudgets}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>Budgets</button>
      <button className={`sidebar-item ${view === 'analytics' ? 'active' : ''}`} onClick={onAnalytics}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"/></svg>Analytics</button>
      <button className="sidebar-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Vault</button>
    </nav>
    <div className="sidebar-footer">
      <button className="sidebar-new-tx-btn" onClick={onNewTx}>Add Transaction</button>
      <div className="sidebar-footer-item" onClick={onSettings}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Settings</div>
      <div className="sidebar-footer-item" onClick={onLogout}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Logout</div>
    </div>
  </aside>
);

const TopHeader = ({ session }) => (
  <header className="top-header">
    <div className="search-container"><svg className="search-icon-top" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" placeholder="Search..." className="search-input-top" /></div>
    <div className="top-actions"><svg className="icon-action" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><div className="user-profile-sm"><div style={{ background: 'var(--primary)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>{session?.user?.email?.charAt(0).toUpperCase()}</div></div></div>
  </header>
);

const PageShell = ({ children, view, onDashboard, onLedger, onAnalytics, onBudgets, onNewTx, onSettings, onLogout, session }) => (
  <div className="app-shell">
    <Sidebar view={view} onDashboard={onDashboard} onLedger={onLedger} onAnalytics={onAnalytics} onBudgets={onBudgets} onNewTx={onNewTx} onSettings={onSettings} onLogout={onLogout} />
    <div className="page-content"><TopHeader session={session} />{children}</div>
  </div>
);

const FilterPanel = ({ categories, tags, accounts, filterOptions, onUpdateFilter, onResetFilters }) => {
  const parents = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const getSubs = useCallback((pid) => categories.filter(c => c.parent_id === pid), [categories]);
  const toggle = (key, id) => { const next = filterOptions[key].includes(id) ? filterOptions[key].filter(x => x !== id) : [...filterOptions[key], id]; onUpdateFilter(key, next); };
  return (
    <div className="advanced-filters slide-up" style={{ marginTop: '1.5rem', background: 'var(--surface-container-low)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
        <div className="filter-section"><p className="label-sm">Type</p><div className="type-toggle-bar" style={{ background: 'var(--surface-container-lowest)' }}>{['all', 'income', 'expense', 'transfer'].map(t => (<button key={t} className={`type-btn ${filterOptions.type === t ? (t === 'all' ? 'active-transfer' : `active-${t}`) : ''}`} onClick={() => onUpdateFilter('type', t)}>{t}</button>))}</div></div>
        <div className="filter-section"><p className="label-sm">Range</p><div style={{ display: 'flex', gap: '0.5rem' }}><input type="date" className="text-input" value={filterOptions.dateRange.start} onChange={e => onUpdateFilter('dateRange', { ...filterOptions.dateRange, start: e.target.value })} /><input type="date" className="text-input" value={filterOptions.dateRange.end} onChange={e => onUpdateFilter('dateRange', { ...filterOptions.dateRange, end: e.target.value })} /></div></div>
        <div className="filter-section"><p className="label-sm">Accounts</p><div className="filter-chips">{accounts.map(a => (<button key={a.id} className={`filter-chip ${filterOptions.accountIds.includes(a.id) ? 'active' : ''}`} onClick={() => toggle('accountIds', a.id)}>{a.name}</button>))}</div></div>
        <div className="filter-section" style={{ gridColumn: 'span 2' }}><p className="label-sm">Categories</p><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxHeight: '200px', overflowY: 'auto' }}>{parents.map(p => (<div key={p.id}><label className="filter-chip" style={{ background: filterOptions.categoryIds.includes(p.id) ? 'var(--primary-light)' : 'var(--surface-container-lowest)' }}><input type="checkbox" checked={filterOptions.categoryIds.includes(p.id)} onChange={() => toggle('categoryIds', p.id)} style={{ display: 'none' }} />{p.icon} {p.name}</label>{getSubs(p.id).map(s => (<label key={s.id} className="filter-chip" style={{ marginLeft: '1rem', opacity: 0.7, background: filterOptions.categoryIds.includes(s.id) ? 'var(--primary-light)' : 'transparent' }}><input type="checkbox" checked={filterOptions.categoryIds.includes(s.id)} onChange={() => toggle('categoryIds', s.id)} style={{ display: 'none' }} />{s.icon} {s.name}</label>))}</div>))}</div></div>
        <div className="filter-section" style={{ gridColumn: '1 / -1' }}><p className="label-sm">Tags</p><div className="filter-chips">{tags.map(t => (<button key={t.id} className={`filter-chip ${filterOptions.tagIds.includes(t.id) ? 'active' : ''}`} onClick={() => toggle('tagIds', t.id)}>#{t.name}</button>))}</div></div>
      </div>
      <div style={{ marginTop: '2rem', textAlign: 'right' }}><button className="section-action-link" onClick={onResetFilters}>Reset All</button></div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('landing');
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tags, setTags] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [defaultAccountId, setDefaultAccountId] = useState(null);
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
  const [settingsType, setSettingsType] = useState('expense');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🔖');
  const [newCatParent, setNewCatParent] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ id: null, category_id: '', amount_limit: '', period: 'monthly' });
  const [showAdvancedFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ type: 'all', dateRange: { start: '', end: '' }, categoryIds: [], tagIds: [], accountIds: [], searchTerm: '' });
  const [dashPeriod, setDashPeriod] = useState('this_month');
  const [analyticsFilters] = useState({ type: 'all', dateRange: { start: '', end: '' }, categoryIds: [], tagIds: [], accountIds: [], searchTerm: '' });

  const fetchProfile = useCallback(async (s) => { if (!s) return; const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).maybeSingle(); if (data) { setCurrencyCode(data.currency_preference || 'USD'); setCurrencySymbol(CURRENCY_SYMBOLS[data.currency_preference] || '$'); setDefaultAccountId(data.default_account_id); } }, []);
  const fetchCategories = useCallback(async () => { const { data } = await supabase.from('categories').select('*').order('name'); if (data) setCategories(data); }, []);
  const fetchTags = useCallback(async () => { const { data } = await supabase.from('tags').select('*').order('name'); if (data) setTags(data); }, []);
  const fetchAccounts = useCallback(async () => { const { data } = await supabase.from('accounts').select('*').order('name'); if (data) setAccounts(data); }, []);
  const fetchBudgets = useCallback(async () => { const { data } = await supabase.from('budgets').select('*').order('created_at'); if (data) setBudgets(data); }, []);
  const fetchTransactions = useCallback(async () => { let { data, error } = await supabase.from('transactions').select('*, categories(*), parties(*), accounts(*), transaction_tags(*, tags(*))').order('transaction_date', { ascending: false }); if (!error) setTransactions(data || []); }, []);
  const fetchInitialData = useCallback(async (s) => { await fetchProfile(s); await Promise.all([fetchCategories(), fetchAccounts(), fetchTags(), fetchTransactions(), fetchBudgets()]); }, [fetchProfile, fetchCategories, fetchAccounts, fetchTags, fetchTransactions, fetchBudgets]);

  useEffect(() => { 
    supabase.auth.getSession().then(({ data: { session: s } }) => { setSession(s); if (s) { setView('dashboard'); fetchInitialData(s); } });
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (s) { setView('dashboard'); fetchInitialData(s); } else setView('landing'); });
    return () => authListener.subscription.unsubscribe();
  }, [fetchInitialData]);

  const resetForm = useCallback(() => { setTxToEdit(null); setAmount(''); setSelectedCategory(null); setSelectedSubcategory(null); setSelectedParty(null); setSelectedAccount(defaultAccountId); setNote(''); setTxDate(new Date().toISOString().split('T')[0]); setSelectedTags([]); setTransferFromAccount(null); setTransferToAccount(null); }, [defaultAccountId]);
  const handleLogout = useCallback(async () => supabase.auth.signOut(), []);
  const navToDashboard = useCallback(() => setView('dashboard'), []);
  const navToLedger = useCallback(() => { resetForm(); setView('ledger'); }, [resetForm]);
  const navToAnalytics = useCallback(() => setView('analytics'), []);
  const navToBudgets = useCallback(() => setView('budgets'), []);
  const navToSettings = useCallback(() => setView('settings'), []);
  const navToNewTx = useCallback(() => { resetForm(); setView('new_transaction'); }, [resetForm]);

  const handleAuth = async (e) => { e.preventDefault(); setAuthLoading(true); setAuthError(''); const { error } = authMode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password }); if (error) setAuthError(error.message); setAuthLoading(false); };
  const handleCreateCategory = useCallback(async (e) => { e.preventDefault(); if (!session || !newCatName.trim()) return; await supabase.from('categories').insert([{ user_id: session.user.id, name: newCatName.trim(), type: settingsType, icon: newCatIcon, parent_id: newCatParent || null }]); setNewCatName(''); setNewCatParent(''); fetchCategories(); }, [session, newCatName, settingsType, newCatIcon, newCatParent, fetchCategories]);
  const handleCreateAccount = useCallback(async (e) => { e.preventDefault(); if (!session || !newAccountName.trim()) return; await supabase.from('accounts').insert([{ user_id: session.user.id, name: newAccountName.trim(), initial_balance: parseFloat(newAccountBalance) || 0 }]); setNewAccountName(''); setNewAccountBalance(''); fetchAccounts(); }, [session, newAccountName, newAccountBalance, fetchAccounts]);
  const handleSaveBudget = useCallback(async (e) => { e.preventDefault(); if (!session || !budgetForm.amount_limit) return; const my = new Date().toISOString().slice(0, 7); const payload = { user_id: session.user.id, category_id: budgetForm.category_id || null, limit_amount: parseFloat(budgetForm.amount_limit), month_year: my }; if (budgetForm.id) await supabase.from('budgets').update(payload).eq('id', budgetForm.id); else await supabase.from('budgets').insert([payload]); setShowBudgetModal(false); fetchBudgets(); }, [session, budgetForm, fetchBudgets]);
  const handleTransaction = useCallback(async () => {
    const val = parseFloat(amount); if (isNaN(val) || val <= 0 || !session) return;
    if (txType === 'transfer') { if (!transferFromAccount || !transferToAccount || transferFromAccount === transferToAccount) return; const base = { amount: val, note: note.trim() || null, transaction_date: txDate, user_id: session.user.id }; if (txToEdit?.transfer_id) { await supabase.from('transactions').update({ ...base, account_id: transferFromAccount }).eq('transfer_id', txToEdit.transfer_id).eq('type', 'expense'); await supabase.from('transactions').update({ ...base, account_id: transferToAccount }).eq('transfer_id', txToEdit.transfer_id).eq('type', 'income'); } else { const tid = crypto.randomUUID(); await supabase.from('transactions').insert([{ ...base, type: 'expense', account_id: transferFromAccount, transfer_id: tid }, { ...base, type: 'income', account_id: transferToAccount, transfer_id: tid }]); } }
    else { const payload = { amount: val, type: txType, category_id: selectedSubcategory || selectedCategory, party_id: selectedParty, account_id: selectedAccount || (accounts[0]?.id), note: note.trim() || null, transaction_date: txDate, user_id: session.user.id }; let id; if (txToEdit?.id) { await supabase.from('transactions').update(payload).eq('id', txToEdit.id); id = txToEdit.id; } else { const { data } = await supabase.from('transactions').insert([payload]).select('id').single(); id = data?.id; } if (id) { await supabase.from('transaction_tags').delete().eq('transaction_id', id); if (selectedTags.length > 0) await supabase.from('transaction_tags').insert(selectedTags.map(tid => ({ transaction_id: id, tag_id: tid }))); } }
    fetchTransactions(); resetForm(); setView('ledger');
  }, [amount, txType, transferFromAccount, transferToAccount, note, txDate, session, txToEdit, selectedSubcategory, selectedCategory, selectedParty, selectedAccount, accounts, selectedTags, fetchTransactions, resetForm]);

  const openEditTransaction = useCallback((t) => {
    setTxToEdit(t); setAmount(t.amount ? t.amount.toString() : ''); setNote(t.note || ''); setTxDate(t.transaction_date || t.created_at?.split('T')[0] || '');
    if (t.transfer_id) { const pair = transactions.find(tx => tx.transfer_id === t.transfer_id && tx.id !== t.id); setTxType('transfer'); setTransferFromAccount(t.type === 'expense' ? t.account_id : pair?.account_id); setTransferToAccount(t.type === 'income' ? t.account_id : pair?.account_id); }
    else { setTxType(t.type || 'expense'); setSelectedCategory(t.category_id); setSelectedParty(t.party_id); setSelectedAccount(t.account_id); setSelectedTags((t.transaction_tags || []).map(tt => tt.tag_id)); }
    setView('new_transaction');
  }, [transactions]);

  const accountBalancesResult = useMemo(() => { const b = {}; accounts.forEach(a => b[a.id] = parseFloat(a.initial_balance) || 0); transactions.forEach(t => { if (t.account_id && b[t.account_id] !== undefined) { if (t.type === 'income') b[t.account_id] += parseFloat(t.amount); else b[t.account_id] -= parseFloat(t.amount); } }); return b; }, [accounts, transactions]);
  const dashDateRangeResult = useMemo(() => { const t = new Date(); const f = d => d.toISOString().split('T')[0]; if (dashPeriod === 'this_month') return { start: f(new Date(t.getFullYear(), t.getMonth(), 1)), end: f(new Date(t.getFullYear(), t.getMonth() + 1, 0)) }; if (dashPeriod === 'last_month') return { start: f(new Date(t.getFullYear(), t.getMonth() - 1, 1)), end: f(new Date(t.getFullYear(), t.getMonth(), 0)) }; return { start: null, end: null }; }, [dashPeriod]);
  const dashTransactionsResult = useMemo(() => transactions.filter(t => (!dashDateRangeResult.start || t.transaction_date >= dashDateRangeResult.start) && (!dashDateRangeResult.end || t.transaction_date <= dashDateRangeResult.end)), [transactions, dashDateRangeResult]);
  const dashTotals = useMemo(() => { let inc = 0, exp = 0; dashTransactionsResult.forEach(t => { if (!t.transfer_id) { if (t.type === 'income') inc += parseFloat(t.amount); else exp += parseFloat(t.amount); } }); const initial = accounts.reduce((s, a) => s + parseFloat(a.initial_balance || 0), 0); const allInc = transactions.filter(t => t.type === 'income' && !t.transfer_id).reduce((s, t) => s + parseFloat(t.amount), 0); const allExp = transactions.filter(t => t.type === 'expense' && !t.transfer_id).reduce((s, t) => s + parseFloat(t.amount), 0); return { balance: initial + allInc - allExp, totalIncome: inc, totalExpense: exp }; }, [dashTransactionsResult, transactions, accounts]);
  const portfolioChangeResult = useMemo(() => { const s = dashDateRangeResult.start; if (!s) return 0; let curr = 0, prev = 0; transactions.forEach(t => { if (!t.transfer_id) { const a = parseFloat(t.amount) * (t.type === 'income' ? 1 : -1); if (t.transaction_date >= s) curr += a; else prev += a; } }); return prev === 0 ? 0 : Math.round((curr / Math.abs(prev)) * 100); }, [transactions, dashDateRangeResult]);
  const smartInsightsResult = useMemo(() => { const i = []; const t = {}; dashTransactionsResult.filter(tx => tx.type === 'expense' && !tx.transfer_id && tx.categories).forEach(tx => { const k = tx.categories.name; t[k] = (t[k] || 0) + parseFloat(tx.amount); }); const top = Object.entries(t).sort((a,b) => b[1]-a[1])[0]; if (top) i.push({ title: 'Top Spending', text: `${top[0]} is high.` }); return i; }, [dashTransactionsResult]);
  const filteredLedgerResult = useMemo(() => transactions.filter(t => { const f = filterOptions; if (f.type !== 'all' && t.type !== f.type) return false; if (f.dateRange.start && t.transaction_date < f.dateRange.start) return false; if (f.dateRange.end && t.transaction_date > f.dateRange.end) return false; return true; }), [transactions, filterOptions]);
  const groupedLedgerResult = useMemo(() => { const g = {}; filteredLedgerResult.forEach(t => { const d = t.transaction_date || 'Unknown'; if (!g[d]) g[d] = []; g[d].push(t); }); return Object.entries(g).sort(([a], [b]) => b.localeCompare(a)); }, [filteredLedgerResult]);
  const budgetProgressResult = useMemo(() => { const my = new Date().toISOString().slice(0, 7); return budgets.map(b => { const spent = transactions.filter(t => t.type === 'expense' && !t.transfer_id && t.transaction_date.startsWith(my) && (!b.category_id || t.category_id === b.category_id)).reduce((s, t) => s + parseFloat(t.amount), 0); const pct = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0; return { ...b, spent, pct: Math.min(pct, 100), status: pct >= 100 ? 'over' : 'ok' }; }); }, [budgets, transactions]);
  const analyticsTransactionsResult = useMemo(() => transactions.filter(t => (!analyticsFilters.dateRange.start || t.transaction_date >= analyticsFilters.dateRange.start)), [transactions, analyticsFilters]);
  const chartTimeSeriesResult = useMemo(() => { const data = {}; analyticsTransactionsResult.filter(t => !t.transfer_id).forEach(t => { const k = t.transaction_date; if (!data[k]) data[k] = { date: k, income: 0, expense: 0, label: k.slice(5) }; if (t.type === 'income') data[k].income += parseFloat(t.amount); else data[k].expense += parseFloat(t.amount); }); return Object.values(data).sort((a,b) => a.date.localeCompare(b.date)); }, [analyticsTransactionsResult]);
  const chartCategoricalResult = useMemo(() => { const t = {}; analyticsTransactionsResult.filter(tx => tx.type === 'expense' && !tx.transfer_id && tx.categories).forEach(tx => { const n = tx.categories.name; t[n] = (t[n] || 0) + parseFloat(tx.amount); }); return Object.entries(t).map(([name, value]) => ({ name, value })); }, [analyticsTransactionsResult]);

  const generateAIReport = useCallback(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const monthLabel = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const currentMonth = today.toISOString().slice(0, 7);

    const netWorth = Object.values(accountBalancesResult).reduce((s, v) => s + v, 0);

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
    const fmt = n => parseFloat(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let md = `# MOMA Financial Context\n**Generated:** ${dateStr} | **Currency:** ${currencyCode}\n\n---\n\n`;
    md += `## Financial Snapshot\n- **Net Worth:** ${currencySymbol}${fmt(netWorth)}\n- **This Month (${monthLabel}):** Income ${currencySymbol}${fmt(currentIncome)} | Expenses ${currencySymbol}${fmt(currentExpense)}\n\n`;
    md += `## Account Balances\n${accounts.map(a => `- ${a.name}: ${currencySymbol}${fmt(accountBalancesResult[a.id] || 0)}`).join('\n')}\n\n`;
    md += `## Spending by Category (${monthLabel})\n`;
    if (topCats.length === 0) { md += `No expense transactions this month.\n`; }
    else { topCats.forEach(([name, amt], i) => { const b = budgetProgressResult.find(b => categories.find(c => c.id === b.category_id)?.name === name); const budgetNote = b ? ` (budget: ${currencySymbol}${fmt(b.limit_amount)} — ${b.status === 'over' ? 'OVER BUDGET' : 'ok'})` : ''; md += `${i + 1}. ${name}: ${currencySymbol}${fmt(amt)}${budgetNote}\n`; }); }
    md += `\n## Budget Status\n`;
    if (budgetProgressResult.length === 0) { md += `No budgets configured.\n`; }
    else { budgetProgressResult.forEach(b => { const cat = categories.find(c => c.id === b.category_id); md += `- ${cat?.name || 'Global'}: ${currencySymbol}${fmt(b.spent)} / ${currencySymbol}${fmt(b.limit_amount)} ${b.status === 'over' ? '[OVER]' : '[ok]'}\n`; }); }
    md += `\n## Monthly Trends (Last 3 Months)\n`;
    last3Months.forEach(([month, t]) => { md += `- ${month}: Income ${currencySymbol}${fmt(t.income)} | Expenses ${currencySymbol}${fmt(t.expense)} | Net ${currencySymbol}${fmt(t.income - t.expense)}\n`; });
    md += `\n## Recent Transactions (Last 20)\n| Date | Description | Category | Amount | Type |\n|------|-------------|----------|--------|------|\n`;
    recentTx.forEach(t => { const desc = t.parties?.name || t.note || '-'; const cat = t.categories?.name || '-'; const sign = t.type === 'income' ? '+' : '-'; md += `| ${t.transaction_date} | ${desc} | ${cat} | ${sign}${currencySymbol}${fmt(t.amount)} | ${t.type} |\n`; });
    md += `\n---\n*Paste this report into Claude or Gemini to get AI-powered financial advice.*\n`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moma-context-${dateStr}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transactions, accounts, categories, budgets, accountBalancesResult, budgetProgressResult, currencySymbol, currencyCode]);

  const shellProps = { view, onDashboard: navToDashboard, onLedger: navToLedger, onAnalytics: navToAnalytics, onBudgets: navToBudgets, onNewTx: navToNewTx, onSettings: navToSettings, onLogout: handleLogout, session };

  if (view === 'landing') return (
    <div className="landing-container fade-in">
      <svg className="landing-graphic" viewBox="0 0 200 200" fill="none"><rect x="20" y="100" width="24" height="80" rx="4" stroke="#000666" strokeWidth="1.5"/><rect x="56" y="60" width="24" height="120" rx="4" stroke="#000666" strokeWidth="1.5"/><rect x="92" y="40" width="24" height="140" rx="4" stroke="#000666" strokeWidth="1.5"/><rect x="128" y="75" width="24" height="105" rx="4" stroke="#000666" strokeWidth="1.5"/><rect x="164" y="55" width="24" height="125" rx="4" stroke="#000666" strokeWidth="1.5"/><line x1="10" y1="190" x2="195" y2="190" stroke="#000666" strokeWidth="1.5"/></svg>
      <p className="landing-eyebrow">The Digital Ledger</p><h1 className="hero-title">Architectural Clarity<br />for Your Wealth.</h1>
      <button className="launch-btn" onClick={() => session ? setView('dashboard') : setView('auth')}>Get Started</button>
    </div>
  );

  if (view === 'auth') return (
    <div className="auth-view fade-in">
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><button className="icon-btn-text" onClick={() => setView('landing')}>← Back</button><h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Manrope' }}>MOMA</h2></div>
        <div className="auth-box">
          <div className="auth-tabs"><button className={`auth-tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => { setAuthMode('login'); setAuthError(''); }}>Log In</button><button className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`} onClick={() => { setAuthMode('signup'); setAuthError(''); }}>Sign Up</button></div>
          <form onSubmit={handleAuth} className="auth-form"><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required /><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />{authError && <p className="auth-error">{authError}</p>}<button type="submit" className="auth-submit-btn" disabled={authLoading}>{authLoading ? '...' : (authMode === 'login' ? 'Enter' : 'Join')}</button></form>
        </div>
      </div>
    </div>
  );

  if (view === 'settings') return (
    <PageShell {...shellProps}>
      <div className="page-inner fade-in"><h2 className="section-title-editorial">Settings</h2><div className="settings-panel"><div className="settings-section"><p className="label-sm">Currency</p><button className="currency-dropdown-trigger" onClick={() => setCurrencyCode(c => c === 'USD' ? 'EUR' : 'USD')}>{currencyCode}</button></div><div className="settings-section"><p className="label-sm">Manage</p><div className="settings-group"><button className="settings-nav-btn" onClick={() => setView('account_management')}>Accounts ›</button><button className="settings-nav-btn" onClick={() => setView('category_management')}>Categories ›</button></div></div><div className="settings-section"><p className="label-sm">AI Integration</p><div className="settings-group"><button className="settings-nav-btn" onClick={generateAIReport}>Export for AI ↓</button></div><p className="label-sm" style={{ marginTop: '0.5rem', opacity: 0.6 }}>Download a financial report to paste into Claude or Gemini</p></div></div></div>
    </PageShell>
  );

  if (view === 'account_management') return (
    <PageShell {...shellProps}>
      <div className="page-inner slide-up"><button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button><h2 className="section-title-editorial">Accounts</h2><div className="category-manager">{accounts.map(acc => (<div key={acc.id} className="editorial-item"><div className="editorial-info"><div className="editorial-title">{acc.name}</div><div className="editorial-meta">{(accountBalancesResult[acc.id]||0).toFixed(2)}</div></div><button className="delete-btn" onClick={async () => { if (session) { await supabase.from('accounts').delete().eq('id', acc.id); fetchAccounts(); } }}>✕</button></div>))}</div><form onSubmit={handleCreateAccount} className="add-category-form"><input type="text" placeholder="Name" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} required /><input type="number" placeholder="Balance" value={newAccountBalance} onChange={e => setNewAccountBalance(e.target.value)} required /><button type="submit" className="add-cat-btn">Add</button></form></div>
    </PageShell>
  );

  if (view === 'category_management') return (
    <PageShell {...shellProps}>
      <div className="page-inner slide-up"><button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button><h2 className="section-title-editorial">Categories</h2><div className="type-toggle-bar"><button className={`type-btn ${settingsType === 'expense' ? 'active-expense' : ''}`} onClick={() => setSettingsType('expense')}>Expense</button><button className={`type-btn ${settingsType === 'income' ? 'active-income' : ''}`} onClick={() => setSettingsType('income')}>Income</button></div><div className="category-manager">{categories.filter(c => c.type === settingsType).map(c => (<div key={c.id} className="editorial-item"><div className="editorial-icon">{c.icon}</div><div className="editorial-title">{c.name}</div>{!c.is_system && <button className="delete-btn" onClick={async () => { if (session) { await supabase.from('categories').delete().eq('id', c.id); fetchCategories(); } }}>✕</button>}</div>))}</div><form onSubmit={handleCreateCategory} className="add-category-form"><div style={{ display: 'flex', gap: '0.5rem' }}><input type="text" maxLength="2" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} style={{ width: '50px' }} /><input type="text" placeholder="Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={{ flex: 1 }} /></div><CustomDropdown label="Parent" options={[{ value: '', label: 'Root' }, ...categories.filter(c => !c.parent_id && c.type === settingsType).map(p => ({ value: p.id, label: p.name, icon: p.icon }))]} value={newCatParent} onChange={setNewCatParent} /><button type="submit" className="add-cat-btn">Add</button></form></div>
    </PageShell>
  );

  if (view === 'new_transaction') return (
    <PageShell {...shellProps}>
      <div className="page-inner slide-up" style={{ maxWidth: '600px' }}><h2 className="section-title-editorial">{txToEdit ? 'Edit' : 'New'} Transaction</h2><div className="fluid-input-area fade-in"><div className="type-toggle-bar"><button className={`type-btn ${txType === 'expense' ? 'active-expense' : ''}`} onClick={() => { setTxType('expense'); setSelectedCategory(null); setSelectedSubcategory(null); }}>Expense</button><button className={`type-btn ${txType === 'income' ? 'active-income' : ''}`} onClick={() => { setTxType('income'); setSelectedCategory(null); setSelectedSubcategory(null); }}>Income</button><button className={`type-btn ${txType === 'transfer' ? 'active-transfer' : ''}`} onClick={() => { setTxType('transfer'); setSelectedCategory(null); setSelectedSubcategory(null); }}>Transfer</button></div><div className="amount-input-wrapper"><span className="currency-prefix">{currencySymbol}</span><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="amount-input" autoFocus /></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><div className="category-selection-area"><p className="label-sm">Date</p><input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="text-input" /></div><div className="category-selection-area"><p className="label-sm">Note</p><input type="text" value={note} onChange={e => setNote(e.target.value)} className="text-input" /></div></div>{txType !== 'transfer' ? (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><CustomDropdown label="Account" options={accounts.map(a => ({ value: a.id, label: a.name, icon: '🏦' }))} value={selectedAccount} onChange={setSelectedAccount} /><CustomDropdown label="Category" options={categories.filter(c => c.type === txType).map(c => ({ value: c.id, label: c.name, icon: c.icon }))} value={selectedCategory} onChange={setSelectedCategory} /></div>) : (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><CustomDropdown label="From" options={accounts.map(a => ({ value: a.id, label: a.name }))} value={transferFromAccount} onChange={setTransferFromAccount} /><CustomDropdown label="To" options={accounts.map(a => ({ value: a.id, label: a.name }))} value={transferToAccount} onChange={setTransferToAccount} /></div>)}<button className={`submit-tx-btn bg-${txType}`} onClick={handleTransaction}>Save</button></div></div>
    </PageShell>
  );

  if (view === 'ledger') return (
    <PageShell {...shellProps}>
      <div className="page-inner fade-in"><div className="section-header-row"><h2 className="section-title-editorial">Transactions</h2><button className="filter-toggle-btn" onClick={() => setShowFilters(!showAdvancedFilters)}>Filter {showAdvancedFilters ? 'Hide' : 'Show'}</button></div>{showAdvancedFilters && <FilterPanel categories={categories} tags={tags} accounts={accounts} filterOptions={filterOptions} onUpdateFilter={(k, v) => setFilterOptions(p => ({ ...p, [k]: v }))} onResetFilters={() => setFilterOptions({ type: 'all', dateRange: { start: '', end: '' }, categoryIds: [], tagIds: [], accountIds: [], searchTerm: '' })} />}<div className="editorial-list" style={{ marginTop: '2rem' }}>{groupedLedgerResult.map(([date, txs]) => (<div key={date} className="ledger-date-group"><div className="ledger-date-header"><span className="ledger-date-text">{formatGroupDate(date)}</span></div>{txs.map(t => (<div key={t.id} className="editorial-item" onClick={() => openEditTransaction(t)}><div className="editorial-info"><div className="editorial-title">{t.parties?.name || t.categories?.name || 'Manual Entry'}</div><div className="editorial-meta">{t.accounts?.name}</div></div><div className={`editorial-amount ${t.type}`}>{t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount}</div></div>))}</div>))}</div></div>
    </PageShell>
  );

  if (view === 'analytics') return (
    <PageShell {...shellProps}>
      <div className="page-inner fade-in"><h2 className="section-title-editorial">Analytics</h2><div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '2rem' }}><div className="analytics-card-sm"><p className="analytics-title-sm">Cash Flow</p><ResponsiveContainer width="100%" height={300}><AreaChart data={chartTimeSeriesResult}><XAxis dataKey="label" axisLine={false} tickLine={false} /><YAxis hide /><Tooltip /><Area type="monotone" dataKey="income" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.1} /><Area type="monotone" dataKey="expense" stroke="var(--tertiary-fixed-variant)" fill="var(--tertiary-fixed-variant)" fillOpacity={0.1} /></AreaChart></ResponsiveContainer></div><div className="analytics-card-sm"><p className="analytics-title-sm">Categories</p><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={chartCategoricalResult} dataKey="value" innerRadius={60} outerRadius={80}><Cell fill="var(--primary)" /><Cell fill="var(--secondary)" /><Cell fill="var(--tertiary-fixed-variant)" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div></div></div>
    </PageShell>
  );

  if (view === 'budgets') return (
    <PageShell {...shellProps}>
      <div className="page-inner fade-in"><h2 className="section-title-editorial">Budgets</h2><div className="budget-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>{budgetProgressResult.map(b => { const c = categories.find(x => x.id === b.category_id); return (<div key={b.id} className="analytics-card-sm"><div>{c?.icon || '🌍'} {c?.name || 'Global'}</div><div className="cat-bar-track" style={{ margin: '1rem 0' }}><div className="cat-bar-fill" style={{ width: `${b.pct}%`, background: b.status === 'over' ? 'var(--tertiary-fixed-variant)' : 'var(--secondary)' }} /></div><div className="label-sm">{currencySymbol}{b.spent} / {currencySymbol}{b.limit_amount}</div></div>); })}</div><button className="add-cat-btn" onClick={() => setShowBudgetModal(true)}>Add Budget</button>{showBudgetModal && <div className="modal-overlay"><div className="modal-content fluid-input-area"><h3>New Budget</h3><form onSubmit={handleSaveBudget} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}><CustomDropdown label="Category" options={[{ value: '', label: 'Global' }, ...categories.map(c => ({ value: c.id, label: c.name }))] } value={budgetForm.category_id} onChange={v => setBudgetForm(p => ({ ...p, category_id: v }))} /><input type="number" placeholder="Limit" value={budgetForm.amount_limit} onChange={e => setBudgetForm(p => ({ ...p, amount_limit: e.target.value }))} /><button type="submit" className="add-cat-btn">Save</button><button type="button" onClick={() => setShowBudgetModal(false)}>Cancel</button></form></div></div>}</div>
    </PageShell>
  );

  return (
    <PageShell {...shellProps}>
      <div className="page-inner fade-in"><div className="portfolio-hero"><div className="portfolio-info"><p className="portfolio-label">Net Worth</p><h1 className="portfolio-value">{currencySymbol}{dashTotals.balance.toLocaleString()}</h1></div><div className="portfolio-chart-preview">{[40, 70, 45, 90, 65, 80, 50].map((h, i) => (<div key={i} className="chart-bar" style={{ height: `${h}%` }} />))}</div></div><div className="dash-period-bar">{['this_month', 'last_month', 'all'].map(p => (<button key={p} className={`dash-period-btn ${dashPeriod === p ? 'active' : ''}`} onClick={() => setDashPeriod(p)}>{p}</button>))}</div><div className="summary-cards-grid"><div className="summary-card income"><p className="summary-label">Income</p><h3>{currencySymbol}{dashTotals.totalIncome.toLocaleString()}</h3></div><div className="summary-card expense"><p className="summary-label">Expense</p><h3>{currencySymbol}{dashTotals.totalExpense.toLocaleString()}</h3></div><div className="summary-card burn"><p className="summary-label">Portfolio</p><h3>{portfolioChangeResult}%</h3></div></div><div className="content-section" style={{ marginTop: '2rem' }}><h2 className="section-title-editorial">Recent Activity</h2><div className="editorial-list">{dashTransactionsResult.slice(0, 5).map(t => (<div key={t.id} className="editorial-item" onClick={() => openEditTransaction(t)}><div className="editorial-info"><div className="editorial-title">{t.parties?.name || t.categories?.name}</div><div className="editorial-meta">{t.transaction_date}</div></div><div className={`editorial-amount ${t.type}`}>{currencySymbol}{t.amount}</div></div>))}</div></div><div className="smart-insight-card" style={{ marginTop: '2rem' }}>{smartInsightsResult.map((ins, i) => (<div key={i} className="insight-item"><strong>{ins.title}:</strong> {ins.text}</div>))}</div></div>
    </PageShell>
  );
}
