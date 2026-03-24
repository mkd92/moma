import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

// FloatingNav — 3-item bottom nav: Dashboard | FAB | Settings
const FloatingNav = ({ view, onDashboard, onNewTx, onSettings }) => (
  <nav className="bottom-nav fade-in">
    <button
      className={`nav-tab ${view === 'dashboard' ? 'active' : ''}`}
      onClick={onDashboard}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <span>Home</span>
    </button>

    <div className="nav-fab-container">
      <button className="nav-fab" onClick={onNewTx}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>

    <button
      className={`nav-tab ${['settings', 'category_management', 'party_management', 'account_management'].includes(view) ? 'active' : ''}`}
      onClick={onSettings}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
      <span>Settings</span>
    </button>
  </nav>
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

  // Account Manager State
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');

  // Account Edit State
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editBalanceMode, setEditBalanceMode] = useState('initial'); // 'initial' | 'current'
  const [editBalanceValue, setEditBalanceValue] = useState('');

  // Profile State
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [currencyCode, setCurrencyCode] = useState('USD');

  // Transaction Form State
  const [txToEdit, setTxToEdit] = useState(null);
  const [txType, setTxType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [note, setNote] = useState('');
  const [txDate, setTxDate] = useState('');
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Category Manager State
  const [settingsType, setSettingsType] = useState('expense');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🔖');
  const [newCatParent, setNewCatParent] = useState('');

  // Party Manager State
  const [newPartyName, setNewPartyName] = useState('');

  // Ledger Filter State
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [filterPreset, setFilterPreset] = useState('all');

  // Derived financials — no separate state needed
  const { balance, totalIncome, totalExpense } = useMemo(() => {
    let inc = 0, exp = 0;
    transactions.forEach(t => {
      if (t.type === 'income') inc += parseFloat(t.amount);
      if (t.type === 'expense') exp += parseFloat(t.amount);
    });
    let accInitial = 0;
    accounts.forEach(a => accInitial += parseFloat(a.initial_balance || 0));
    return { balance: accInitial + inc - exp, totalIncome: inc, totalExpense: exp };
  }, [transactions, accounts]);

  // Top expense category for insight card
  const topExpenseCat = useMemo(() => {
    const totals = {};
    transactions.filter(t => t.type === 'expense' && t.categories).forEach(t => {
      const n = t.categories.name;
      totals[n] = (totals[n] || 0) + parseFloat(t.amount);
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return sorted[0] || null;
  }, [transactions]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setView('dashboard');
        fetchInitialData(session);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setView('dashboard');
        fetchInitialData(session);
      } else {
        setView('landing');
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  // Parallelised fetch — categories/parties/transactions load simultaneously
  const fetchInitialData = async (activeSession) => {
    await fetchProfile(activeSession);
    await Promise.all([fetchCategories(), fetchParties(), fetchAccounts(), fetchTransactions()]);
  };

  const fetchProfile = async (activeSession) => {
    if (!activeSession) return;
    const { data } = await supabase
      .from('profiles')
      .select('currency_preference')
      .eq('id', activeSession.user.id)
      .maybeSingle();
    if (data?.currency_preference) {
      setCurrencyCode(data.currency_preference);
      setCurrencySymbol(CURRENCY_SYMBOLS[data.currency_preference] || '$');
    }
  };

  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const currencyDropdownRef = useRef(null);

  useEffect(() => {
    if (!currencyDropdownOpen) return;
    const handler = (e) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target)) {
        setCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [currencyDropdownOpen]);

  const handleCurrencyChange = useCallback(async (newCur) => {
    setCurrencyCode(newCur);
    setCurrencySymbol(CURRENCY_SYMBOLS[newCur] || '$');
    setCurrencyDropdownOpen(false);
    await supabase.from('profiles').update({ currency_preference: newCur }).eq('id', session.user.id);
  }, [session]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const fetchParties = async () => {
    const { data } = await supabase.from('parties').select('*').order('name');
    if (data) setParties(data);
  };

  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('accounts').select('*').order('name');
    // Silently ignore if table doesn't exist yet (migration not applied)
    if (data) setAccounts(data);
  };

  const accountBalances = useMemo(() => {
    const balances = {};
    accounts.forEach(a => {
      balances[a.id] = parseFloat(a.initial_balance) || 0;
    });
    transactions.forEach(t => {
      if (t.account_id && balances[t.account_id] !== undefined) {
        if (t.type === 'income') balances[t.account_id] += parseFloat(t.amount);
        if (t.type === 'expense') balances[t.account_id] -= parseFloat(t.amount);
      }
    });
    return balances;
  }, [accounts, transactions]);

  const fetchTransactions = async () => {
    // Try with accounts join; fall back if the FK doesn't exist yet
    let { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name, icon, type), parties(name), accounts(name)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error && error.code === 'PGRST200') {
      // accounts FK not yet in schema — retry without the join
      ({ data, error } = await supabase
        .from('transactions')
        .select('*, categories(name, icon, type), parties(name)')
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
    else { setEmail(''); setPassword(''); }
    setAuthLoading(false);
  };

  const handleLogout = useCallback(async () => supabase.auth.signOut(), []);

  const handleGoogleSignIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const resetForm = useCallback(() => {
    setTxToEdit(null);
    setAmount('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedParty(null);
    setSelectedAccount(null);
    setNote('');
    setTxDate('');
    setPartySearch('');
    setShowPartyDropdown(false);
    setCatSearch('');
    setShowCatDropdown(false);
    setAccountSearch('');
    setShowAccountDropdown(false);
  }, []);

  const openEditTransaction = useCallback((t) => {
    setTxToEdit(t);
    setTxType(t.type);
    setAmount(t.amount.toString());
    setSelectedCategory(t.category_id);
    setSelectedParty(t.party_id);
    setSelectedAccount(t.account_id);
    setNote(t.note || '');
    setTxDate(t.transaction_date || t.created_at.split('T')[0]);
    setView('new_transaction');
  }, []);

  const handleTransaction = useCallback(async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    const finalCategoryId = selectedSubcategory || selectedCategory;
    const payload = {
      amount: val,
      type: txType,
      category_id: finalCategoryId,
      party_id: selectedParty,
      account_id: selectedAccount,
      note: note.trim() || null,
      transaction_date: txDate || new Date().toISOString().split('T')[0],
    };

    if (session) {
      if (txToEdit) {
        const { error } = await supabase.from('transactions').update(payload).eq('id', txToEdit.id);
        if (error) alert('Database error: ' + error.message);
        else fetchTransactions();
      } else {
        payload.user_id = session.user.id;
        const { error } = await supabase.from('transactions').insert([payload]);
        if (error) alert('Database error: ' + error.message);
        else fetchTransactions();
      }
    }

    resetForm();
    setView('ledger');
  }, [amount, selectedSubcategory, selectedCategory, txType, selectedParty, selectedAccount, note, txDate, session, txToEdit, resetForm]);

  const handleDeleteTransaction = useCallback(async () => {
    if (!session || !txToEdit) return;
    if (!window.confirm('Delete this transaction?')) return;

    const { error } = await supabase.from('transactions').delete().eq('id', txToEdit.id);
    if (error) alert('Deletion error: ' + error.message);
    else {
      fetchTransactions();
      resetForm();
      setView('ledger');
    }
  }, [session, txToEdit, resetForm]);

  const handleCreateCategory = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !newCatName.trim()) return;
    const payload = {
      user_id: session.user.id,
      name: newCatName.trim(),
      type: settingsType,
      icon: newCatIcon,
      is_system: false,
      parent_id: newCatParent || null,
    };
    const { error } = await supabase.from('categories').insert([payload]);
    if (!error) { setNewCatName(''); setNewCatParent(''); setNewCatIcon('🔖'); fetchCategories(); }
  }, [session, newCatName, settingsType, newCatIcon, newCatParent]);

  const handleDeleteCategory = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  }, [session]);

  const handleCreateParty = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !newPartyName.trim()) return;
    const { error } = await supabase.from('parties').insert([{ user_id: session.user.id, name: newPartyName.trim() }]);
    if (!error) { setNewPartyName(''); fetchParties(); }
  }, [session, newPartyName]);

  const handleDeleteParty = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('parties').delete().eq('id', id);
    fetchParties();
  }, [session]);

  const handleCreateAccount = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !newAccountName.trim()) return;
    const { error } = await supabase.from('accounts').insert([{ 
      user_id: session.user.id, 
      name: newAccountName.trim(), 
      initial_balance: parseFloat(newAccountBalance) || 0 
    }]);
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

  const applyPreset = useCallback((preset) => {
    setFilterPreset(preset);
    const now = new Date();
    if (preset === 'this_month') {
      setFilterStart(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setFilterEnd(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (preset === 'last_month') {
      setFilterStart(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]);
      setFilterEnd(new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]);
    } else {
      setFilterStart('');
      setFilterEnd('');
    }
  }, []);

  // Memoised category splits — avoids filter on every render
  const parentCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const subCategories = useMemo(() => categories.filter(c => c.parent_id), [categories]);

  // Filtered Ledger
  const filteredLedger = useMemo(() => {
    return transactions.filter(t => {
      const matchStart = filterStart ? t.transaction_date >= filterStart : true;
      const matchEnd = filterEnd ? t.transaction_date <= filterEnd : true;
      return matchStart && matchEnd;
    });
  }, [transactions, filterStart, filterEnd]);

  // Stable nav callbacks passed as props (no inline arrows in JSX)
  const navToDashboard = useCallback(() => setView('dashboard'), []);
  const navToLedger = useCallback(() => { resetForm(); setView('ledger'); }, [resetForm]);
  const navToNewTx = useCallback(() => { resetForm(); setView('new_transaction'); }, [resetForm]);
  const navToSettings = useCallback(() => setView('settings'), []);

  // --- VIEWS ---

  if (view === 'landing') {
    return (
      <div className="landing-container fade-in">
        <svg
          className="landing-graphic"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="20" y="100" width="24" height="80" rx="4" stroke="#1A237E" strokeWidth="1.5"/>
          <rect x="56" y="60" width="24" height="120" rx="4" stroke="#1A237E" strokeWidth="1.5"/>
          <rect x="92" y="40" width="24" height="140" rx="4" stroke="#1A237E" strokeWidth="1.5"/>
          <rect x="128" y="75" width="24" height="105" rx="4" stroke="#1A237E" strokeWidth="1.5"/>
          <rect x="164" y="55" width="24" height="125" rx="4" stroke="#1A237E" strokeWidth="1.5"/>
          <line x1="10" y1="190" x2="195" y2="190" stroke="#1A237E" strokeWidth="1.5"/>
        </svg>
        <p className="landing-eyebrow">Personal Finance</p>
        <h1 className="hero-title">
          Simplify Your Spend,<br />Grow Your Future.
        </h1>
        <button
          className="launch-btn"
          onClick={() => session ? setView('dashboard') : setView('auth')}
        >
          Get Started
        </button>
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <div className="tracker-container fade-in auth-view">
        <div className="top-bar">
          <button className="icon-btn-text" onClick={() => setView('landing')}>← Back</button>
          <h2 className="view-title">Sign In</h2>
          <div style={{ width: '60px' }}></div>
        </div>
        <div className="auth-box">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
            >
              Log In
            </button>
            <button
              className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
            >
              Sign Up
            </button>
          </div>
          <form onSubmit={handleAuth} className="auth-form">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {authError && <p className="auth-error">{authError}</p>}
            <button type="submit" className="auth-submit-btn" disabled={authLoading}>
              {authLoading
                ? 'Authenticating...'
                : authMode === 'login'
                  ? 'Enter Vault'
                  : 'Create Account'}
            </button>
          </form>
          <div className="auth-divider"><span>or continue with</span></div>
          <div className="auth-social-btns">
            <button type="button" className="auth-social-btn" onClick={handleGoogleSignIn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button type="button" className="auth-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Apple
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'settings') {
    return (
      <div className="tracker-container fade-in main-layout">
        <div className="top-bar">
          <div style={{ width: '60px' }}></div>
          <h2 className="view-title">Settings</h2>
          <div style={{ width: '60px' }}></div>
        </div>

        <div className="settings-panel fade-in">
          <div className="profile-block">
            <div className="avatar-circle">
              {session?.user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <span className="profile-name">{session?.user?.email?.split('@')[0]}</span>
              <span className="profile-email">{session?.user?.email}</span>
            </div>
          </div>

          <div className="settings-section">
            <p className="settings-label">Preferences</p>
            <div className="settings-group">
              <div className="settings-card">
                <span className="sc-text">Currency</span>
                <div className="currency-dropdown" ref={currencyDropdownRef}>
                  <button
                    className="currency-dropdown-trigger"
                    onClick={() => setCurrencyDropdownOpen(o => !o)}
                  >
                    {currencyCode} ({CURRENCY_SYMBOLS[currencyCode]})
                    <span className="currency-dropdown-arrow">{currencyDropdownOpen ? '▲' : '▼'}</span>
                  </button>
                  {currencyDropdownOpen && (
                    <ul className="currency-dropdown-menu">
                      {Object.keys(CURRENCY_SYMBOLS).map(code => (
                        <li key={code}>
                          <button
                            className={`currency-dropdown-item${code === currencyCode ? ' active' : ''}`}
                            onClick={() => handleCurrencyChange(code)}
                          >
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
              <button className="settings-nav-btn" onClick={() => setView('account_management')}>
                Accounts <span className="arrow">›</span>
              </button>
              <button className="settings-nav-btn" onClick={() => setView('category_management')}>
                Categories <span className="arrow">›</span>
              </button>
              <button className="settings-nav-btn" onClick={() => setView('party_management')}>
                Parties <span className="arrow">›</span>
              </button>
            </div>
          </div>

          <div className="settings-section" style={{ marginTop: '2rem' }}>
            <button className="settings-logout-btn" onClick={handleLogout}>Log Out</button>
          </div>
        </div>

        <FloatingNav
          view={view}
          onDashboard={navToDashboard}
          onLedger={navToLedger}
          onNewTx={navToNewTx}
          onSettings={navToSettings}
        />
      </div>
    );
  }

  if (view === 'account_management') {
    return (
      <div className="tracker-container slide-up main-layout">
        <div className="top-bar">
          <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
          <h2 className="view-title">Accounts</h2>
          <div style={{ width: '60px' }}></div>
        </div>

        <div className="settings-controls fade-in">
          <div className="category-manager">
            {accounts.length === 0 ? (
              <div className="empty-state">
                <p>No accounts added yet.</p>
              </div>
            ) : (
              accounts.map(acc => {
                const currentBal = accountBalances[acc.id] || 0;
                const netTx = currentBal - parseFloat(acc.initial_balance || 0);
                const isEditing = editingAccountId === acc.id;

                if (isEditing) {
                  const resolvedInitial = editBalanceMode === 'initial'
                    ? parseFloat(editBalanceValue) || 0
                    : (parseFloat(editBalanceValue) || 0) - netTx;

                  return (
                    <div key={acc.id} className="settings-cat-block" style={{ flexDirection: 'column', padding: '1rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text)' }}>Edit Account</div>

                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Account Name</label>
                      <input
                        type="text"
                        className="text-input"
                        value={editAccountName}
                        onChange={(e) => setEditAccountName(e.target.value)}
                        style={{ marginBottom: '0.75rem' }}
                      />

                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Balance Mode</label>
                      <div className="type-toggle-bar" style={{ marginBottom: '0.5rem' }}>
                        <button
                          type="button"
                          className={`type-btn ${editBalanceMode === 'initial' ? 'active-income' : ''}`}
                          onClick={() => setEditBalanceMode('initial')}
                        >Set Initial</button>
                        <button
                          type="button"
                          className={`type-btn ${editBalanceMode === 'current' ? 'active-income' : ''}`}
                          onClick={() => setEditBalanceMode('current')}
                        >Set Current</button>
                      </div>

                      <input
                        type="number"
                        step="0.01"
                        className="text-input"
                        placeholder={editBalanceMode === 'initial' ? 'Initial Balance' : 'Desired Current Balance'}
                        value={editBalanceValue}
                        onChange={(e) => setEditBalanceValue(e.target.value)}
                        style={{ marginBottom: '0.25rem' }}
                      />
                      {editBalanceMode === 'current' && editBalanceValue !== '' && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                          → Initial balance will be set to {currencySymbol}{resolvedInitial.toFixed(2)}
                          <span style={{ marginLeft: '0.25rem' }}>(current {currencySymbol}{parseFloat(editBalanceValue).toFixed(2)} − net transactions {currencySymbol}{netTx.toFixed(2)})</span>
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          className="add-cat-btn"
                          style={{ flex: 1 }}
                          onClick={() => handleUpdateAccount(acc.id, {
                            name: editAccountName.trim() || acc.name,
                            initial_balance: resolvedInitial
                          })}
                        >Save</button>
                        <button
                          className="settings-logout-btn"
                          style={{ flex: 1, marginTop: 0 }}
                          onClick={() => setEditingAccountId(null)}
                        >Cancel</button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={acc.id} className="settings-cat-block">
                    <div className="settings-cat-parent">
                      <span className="cat-icon">🏦</span>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span className="cat-name">{acc.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Current: {currencySymbol}{currentBal.toFixed(2)} | Initial: {currencySymbol}{parseFloat(acc.initial_balance).toFixed(2)}
                        </span>
                      </div>
                      <button
                        className="icon-btn-text"
                        style={{ padding: '0 0.5rem', color: 'var(--primary)', marginRight: '0.5rem' }}
                        onClick={() => {
                          setEditingAccountId(acc.id);
                          setEditAccountName(acc.name);
                          setEditBalanceMode('initial');
                          setEditBalanceValue(acc.initial_balance.toString());
                        }}
                      >✎</button>
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
              <input
                type="text"
                placeholder="Account Name (e.g. Checking)"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                required
                style={{ flex: 1 }}
              />
            </div>
            <div className="form-row" style={{ marginTop: '0.5rem' }}>
              <input
                type="number"
                step="0.01"
                placeholder="Initial Balance"
                value={newAccountBalance}
                onChange={(e) => setNewAccountBalance(e.target.value)}
                required
                style={{ flex: 1 }}
              />
            </div>
            <button type="submit" className="add-cat-btn" style={{ marginTop: '1rem' }}>Add Account</button>
          </form>
        </div>

        <FloatingNav
          view={view}
          onDashboard={navToDashboard}
          onLedger={navToLedger}
          onNewTx={navToNewTx}
          onSettings={navToSettings}
        />
      </div>
    );
  }

  if (view === 'party_management') {
    return (
      <div className="tracker-container slide-up main-layout">
        <div className="top-bar">
          <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
          <h2 className="view-title">Parties</h2>
          <div style={{ width: '60px' }}></div>
        </div>

        <div className="settings-controls fade-in">
          <div className="category-manager">
            {parties.length === 0 ? (
              <div className="empty-state">
                <p>No parties added yet.</p>
              </div>
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
              <input
                type="text"
                placeholder="Party Name (e.g. Amazon, Landlord)"
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                required
                style={{ flex: 1 }}
              />
            </div>
            <button type="submit" className="add-cat-btn">Add Party</button>
          </form>
        </div>

        <FloatingNav
          view={view}
          onDashboard={navToDashboard}
          onLedger={navToLedger}
          onNewTx={navToNewTx}
          onSettings={navToSettings}
        />
      </div>
    );
  }

  if (view === 'category_management') {
    const parents = parentCategories.filter(c => c.type === settingsType);
    return (
      <div className="tracker-container slide-up main-layout">
        <div className="top-bar">
          <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
          <h2 className="view-title">Categories</h2>
          <div style={{ width: '60px' }}></div>
        </div>

        <div className="settings-controls fade-in">
          <div className="type-toggle-bar">
            <button
              className={`type-btn ${settingsType === 'expense' ? 'active-expense' : ''}`}
              onClick={() => { setSettingsType('expense'); setNewCatParent(''); }}
            >
              Expense
            </button>
            <button
              className={`type-btn ${settingsType === 'income' ? 'active-income' : ''}`}
              onClick={() => { setSettingsType('income'); setNewCatParent(''); }}
            >
              Income
            </button>
          </div>

          <div className="category-manager">
            {parents.length === 0 ? (
              <div className="empty-state">
                <p>No {settingsType} categories found.</p>
              </div>
            ) : (
              parents.map(parent => (
                <div key={parent.id} className="settings-cat-block">
                  <div className="settings-cat-parent">
                    <span className="cat-icon">{parent.icon}</span>
                    <span className="cat-name">{parent.name}</span>
                    {!parent.is_system && (
                      <button className="delete-btn" onClick={() => handleDeleteCategory(parent.id)}>✕</button>
                    )}
                  </div>
                  {subCategories.filter(sub => sub.parent_id === parent.id).length > 0 && (
                    <div className="settings-cat-children">
                      {subCategories.filter(sub => sub.parent_id === parent.id).map(sub => (
                        <div key={sub.id} className="settings-cat-child">
                          <span className="cat-icon">{sub.icon}</span>
                          <span className="cat-name">{sub.name}</span>
                          <button className="delete-btn" onClick={() => handleDeleteCategory(sub.id)}>✕</button>
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
              <input
                type="text"
                maxLength="2"
                placeholder="💰"
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                className="icon-input"
                required
              />
              <input
                type="text"
                placeholder="Category Name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                style={{ flex: 1 }}
              />
            </div>
            <select value={newCatParent} onChange={(e) => setNewCatParent(e.target.value)}>
              <option value="">-- Root Category --</option>
              {parents.map(p => (
                <option key={p.id} value={p.id}>Subcategory of: {p.name}</option>
              ))}
            </select>
            <button type="submit" className="add-cat-btn">Save Category</button>
          </form>
        </div>

        <FloatingNav
          view={view}
          onDashboard={navToDashboard}
          onLedger={navToLedger}
          onNewTx={navToNewTx}
          onSettings={navToSettings}
        />
      </div>
    );
  }

  if (view === 'new_transaction') {
    const currentParents = parentCategories.filter(c => c.type === txType);
    const applicableSubs = subCategories.filter(sub => currentParents.some(p => p.id === sub.parent_id));

    return (
      <div className="tracker-container slide-up main-layout" style={{ paddingBottom: '140px' }}>
        <div className="top-bar">
          <button
            className="icon-btn-text"
            onClick={() => { resetForm(); setView(txToEdit ? 'ledger' : 'dashboard'); }}
          >
            ← Cancel
          </button>
          <h2 className="view-title">{txToEdit ? 'Edit Transaction' : 'New Transaction'}</h2>
          <div style={{ width: '80px' }}></div>
        </div>

        <div className="fluid-input-area fade-in" style={{ overflowY: 'auto', maxHeight: '80vh', paddingBottom: '2rem' }}>
          <div className="type-toggle-bar">
            <button
              className={`type-btn ${txType === 'expense' ? 'active-expense' : ''}`}
              onClick={() => { setTxType('expense'); setSelectedCategory(null); setSelectedSubcategory(null); }}
            >
              Expense
            </button>
            <button
              className={`type-btn ${txType === 'income' ? 'active-income' : ''}`}
              onClick={() => { setTxType('income'); setSelectedCategory(null); setSelectedSubcategory(null); }}
            >
              Income
            </button>
          </div>

          <div className="amount-input-wrapper">
            <span className="currency-prefix">{currencySymbol}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="amount-input"
              autoFocus
            />
          </div>

          <div className="category-selection-area" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
            <p className="selection-label">Date</p>
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="text-input"
            />
          </div>

          <div className="category-selection-area">
            <p className="selection-label">Note</p>
            <input
              type="text"
              placeholder="Description (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-input"
            />
          </div>

          <div className="category-selection-area" style={{ position: 'relative', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
            <p className="selection-label">Account</p>
            <div
              className="searchable-dropdown"
              onBlur={() => setTimeout(() => setShowAccountDropdown(false), 200)}
            >
              <input
                type="text"
                className="text-input"
                placeholder="Select Account (optional)..."
                value={
                  selectedAccount
                    ? accounts.find(a => a.id === selectedAccount)?.name ?? accountSearch
                    : accountSearch
                }
                onChange={(e) => {
                  setAccountSearch(e.target.value);
                  setSelectedAccount(null);
                  setShowAccountDropdown(true);
                }}
                onFocus={() => setShowAccountDropdown(true)}
              />
              {showAccountDropdown && (
                <div className="dropdown-menu">
                  <div
                    className="dropdown-item"
                    onClick={() => { setSelectedAccount(null); setAccountSearch(''); setShowAccountDropdown(false); }}
                  >
                    <em style={{ color: 'var(--text-muted)' }}>None / Clear</em>
                  </div>
                  {accounts
                    .filter(a => a.name.toLowerCase().includes(accountSearch.toLowerCase()))
                    .map(a => (
                      <div
                        key={a.id}
                        className="dropdown-item"
                        onClick={() => { setSelectedAccount(a.id); setAccountSearch(''); setShowAccountDropdown(false); }}
                      >
                        <span style={{ marginRight: '0.4rem', opacity: 0.6 }}>🏦</span> {a.name}
                      </div>
                    ))}
                  {accounts.filter(a => a.name.toLowerCase().includes(accountSearch.toLowerCase())).length === 0 && (
                    <div className="dropdown-item disabled">No matching account</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="category-selection-area" style={{ position: 'relative' }}>
            <p className="selection-label">Category</p>
            <div
              className="searchable-dropdown"
              onBlur={() => setTimeout(() => setShowCatDropdown(false), 200)}
            >
              <input
                type="text"
                className="text-input"
                placeholder="Search Category..."
                value={
                  selectedCategory
                    ? [...currentParents, ...applicableSubs].find(c => c.id === selectedCategory)?.name ?? catSearch
                    : catSearch
                }
                onChange={(e) => {
                  setCatSearch(e.target.value);
                  setSelectedCategory(null);
                  setShowCatDropdown(true);
                }}
                onFocus={() => setShowCatDropdown(true)}
              />
              {showCatDropdown && (
                <div className="dropdown-menu">
                  {[...currentParents, ...applicableSubs]
                    .filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))
                    .map(c => {
                      const isSub = !!c.parent_id;
                      const pName = isSub ? currentParents.find(p => p.id === c.parent_id)?.name : null;
                      return (
                        <div
                          key={c.id}
                          className="dropdown-item"
                          onClick={() => { setSelectedCategory(c.id); setCatSearch(''); setShowCatDropdown(false); }}
                        >
                          {c.icon} {c.name}{isSub && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>in {pName}</span>}
                        </div>
                      );
                    })}
                  {[...currentParents, ...applicableSubs].filter(c =>
                    c.name.toLowerCase().includes(catSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="dropdown-item disabled">No matching category</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="category-selection-area" style={{ position: 'relative' }}>
            <p className="selection-label">Counterparty</p>
            <div
              className="searchable-dropdown"
              onBlur={() => setTimeout(() => setShowPartyDropdown(false), 200)}
            >
              <input
                type="text"
                className="text-input"
                placeholder="Select Party (optional)..."
                value={
                  selectedParty
                    ? parties.find(p => p.id === selectedParty)?.name ?? partySearch
                    : partySearch
                }
                onChange={(e) => {
                  setPartySearch(e.target.value);
                  setSelectedParty(null);
                  setShowPartyDropdown(true);
                }}
                onFocus={() => setShowPartyDropdown(true)}
              />
              {showPartyDropdown && (
                <div className="dropdown-menu">
                  <div
                    className="dropdown-item"
                    onClick={() => { setSelectedParty(null); setPartySearch(''); setShowPartyDropdown(false); }}
                  >
                    <em style={{ color: 'var(--text-muted)' }}>None / Clear</em>
                  </div>
                  {parties
                    .filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase()))
                    .map(p => (
                      <div
                        key={p.id}
                        className="dropdown-item"
                        onClick={() => { setSelectedParty(p.id); setPartySearch(''); setShowPartyDropdown(false); }}
                      >
                        <span style={{ marginRight: '0.4rem', opacity: 0.6 }}>👥</span> {p.name}
                      </div>
                    ))}
                  {parties.filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase())).length === 0 && (
                    <div className="dropdown-item disabled">No matching party</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            className={`submit-tx-btn bg-${txType}`}
            onClick={handleTransaction}
            disabled={!amount || !selectedCategory}
          >
            {txToEdit ? 'Update Transaction' : 'Save Transaction'}
          </button>

          {txToEdit && (
            <button
              className="settings-logout-btn"
              style={{ marginTop: '0.75rem', textAlign: 'center' }}
              onClick={handleDeleteTransaction}
            >
              Delete Transaction
            </button>
          )}
        </div>

        <FloatingNav
          view={view}
          onDashboard={navToDashboard}
          onLedger={navToLedger}
          onNewTx={navToNewTx}
          onSettings={navToSettings}
        />
      </div>
    );
  }

  // --- LEDGER VIEW ---
  if (view === 'ledger') {
    return (
      <div className="tracker-container fade-in main-layout">
        <div className="top-bar">
          <div style={{ width: '60px' }}></div>
          <h2 className="view-title">Ledger</h2>
          <div style={{ width: '60px' }}></div>
        </div>

        <div className="ledger-filters fade-in">
          <div className="filter-pills">
            <button
              className={`filter-pill ${filterPreset === 'all' ? 'active-pill' : ''}`}
              onClick={() => applyPreset('all')}
            >
              All
            </button>
            <button
              className={`filter-pill ${filterPreset === 'this_month' ? 'active-pill' : ''}`}
              onClick={() => applyPreset('this_month')}
            >
              This Month
            </button>
            <button
              className={`filter-pill ${filterPreset === 'last_month' ? 'active-pill' : ''}`}
              onClick={() => applyPreset('last_month')}
            >
              Last Month
            </button>
            <button
              className={`filter-pill ${filterPreset === 'custom' ? 'active-pill' : ''}`}
              onClick={() => setFilterPreset('custom')}
            >
              Custom
            </button>
          </div>
          {filterPreset === 'custom' && (
            <div className="custom-dates">
              <input
                type="date"
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
                className="text-input"
              />
              <input
                type="date"
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
                className="text-input"
              />
            </div>
          )}
        </div>

        <div className="transactions-list" style={{ marginTop: '0.5rem' }}>
          {filteredLedger.length === 0 ? (
            <div className="empty-state">
              <p>No transactions match this timeframe.</p>
            </div>
          ) : (() => {
            const groups = {};
            filteredLedger.forEach(t => {
              const d = t.transaction_date || t.created_at.split('T')[0];
              if (!groups[d]) groups[d] = [];
              groups[d].push(t);
            });
            return Object.entries(groups)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, txs]) => (
                <div key={date}>
                  <p className="date-group-header">{formatGroupDate(date)}</p>
                  {txs.map(t => {
                    const cat = t.categories || { icon: '•', name: 'Uncategorized' };
                    const pName = t.parties?.name;
                    const aName = t.accounts?.name;
                    let tag = cat.name;
                    if (pName && aName) tag = `${cat.name} · ${pName} · 🏦 ${aName}`;
                    else if (pName) tag = `${cat.name} · ${pName}`;
                    else if (aName) tag = `${cat.name} · 🏦 ${aName}`;
                    return (
                      <div
                        key={t.id}
                        className={`transaction-item ${t.type}`}
                        onClick={() => openEditTransaction(t)}
                      >
                        <div className="t-icon">{cat.icon}</div>
                        <div className="t-details">
                          <div className="t-type">{tag}</div>
                          {t.note && <div className="t-note">{t.note}</div>}
                          <div className="t-time">{t.transaction_date}</div>
                        </div>
                        <div className="t-amount">
                          {t.type === 'income' ? '+' : '-'}{currencySymbol}{parseFloat(t.amount).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ));
          })()}
        </div>

        <FloatingNav
          view={view}
          onDashboard={navToDashboard}
          onLedger={navToLedger}
          onNewTx={navToNewTx}
          onSettings={navToSettings}
        />
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div className="tracker-container fade-in main-layout">
      <div className="top-bar">
        <span className="moma-logo">MOMA</span>
        <div className="top-avatar-sm">
          {session?.user?.email?.charAt(0).toUpperCase() || 'G'}
        </div>
      </div>

      <div className="dashboard-hero fade-in">
        <div className="balance-board">
          <p className="balance-label">Total Net Worth</p>
          <h1 className="balance-amount">{currencySymbol}{balance.toFixed(2)}</h1>
          <span className="balance-badge">All Transactions</span>
        </div>

        <div className="metrics-row">
          <div className="metric-card metric-income">
            <span className="metric-label">Income</span>
            <span className="metric-value">+{currencySymbol}{totalIncome.toFixed(2)}</span>
          </div>
          <div className="metric-card metric-expense">
            <span className="metric-label">Expenses</span>
            <span className="metric-value">-{currencySymbol}{totalExpense.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {topExpenseCat && (
        <div className="insight-card fade-in">
          <span className="insight-icon">💡</span>
          <p className="insight-text">
            Your top expense is <strong>{topExpenseCat[0]}</strong> at {currencySymbol}{topExpenseCat[1].toFixed(2)} total.
          </p>
        </div>
      )}

      <div>
        <div className="section-header">
          <p className="section-title">Recent Activity</p>
          <button className="section-link" onClick={navToLedger}>View All →</button>
        </div>
        <div className="transactions-list">
          {transactions.slice(0, 5).length === 0 ? (
            <div className="empty-state">
              <p>No transactions yet.</p>
              <p className="hint">Tap + to record your first entry.</p>
            </div>
          ) : (
            transactions.slice(0, 5).map(t => {
              const cat = t.categories || { icon: '•', name: 'Uncategorized' };
              const pName = t.parties?.name;
              const aName = t.accounts?.name;
              let tag = cat.name;
              if (pName && aName) tag = `${cat.name} · ${pName} · 🏦 ${aName}`;
              else if (pName) tag = `${cat.name} · ${pName}`;
              else if (aName) tag = `${cat.name} · 🏦 ${aName}`;
              return (
                <div
                  key={t.id}
                  className={`transaction-item ${t.type}`}
                  onClick={() => openEditTransaction(t)}
                >
                  <div className="t-icon">{cat.icon}</div>
                  <div className="t-details">
                    <div className="t-type">{tag}</div>
                    {t.note && <div className="t-note">{t.note}</div>}
                    <div className="t-time">
                      {t.transaction_date || new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="t-amount">
                    {t.type === 'income' ? '+' : '-'}{currencySymbol}{parseFloat(t.amount).toFixed(2)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <FloatingNav
        view={view}
        onDashboard={navToDashboard}
        onLedger={navToLedger}
        onNewTx={navToNewTx}
        onSettings={navToSettings}
      />
    </div>
  );
}

export default App;
