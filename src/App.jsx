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

// Sidebar — desktop left-rail navigation
const Sidebar = ({ view, onDashboard, onLedger, onNewTx, onSettings, session, onLogout }) => {
  const isSettingsGroup = ['settings', 'category_management', 'party_management', 'account_management', 'tag_management'].includes(view);
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">MOMA</div>
      <nav className="sidebar-nav">
        <button className="sidebar-new-tx-btn" onClick={onNewTx}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Transaction
        </button>
        <button className={`sidebar-item ${view === 'dashboard' ? 'active' : ''}`} onClick={onDashboard}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </button>
        <button className={`sidebar-item ${view === 'ledger' ? 'active' : ''}`} onClick={onLedger}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Ledger
        </button>
        <button className={`sidebar-item ${isSettingsGroup ? 'active' : ''}`} onClick={onSettings}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Settings
        </button>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{session?.user?.email?.charAt(0).toUpperCase()}</div>
          <span className="sidebar-email">{session?.user?.email}</span>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout}>Log out</button>
      </div>
    </aside>
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
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Transfer Form State
  const [transferFromAccount, setTransferFromAccount] = useState(null);
  const [transferToAccount, setTransferToAccount] = useState(null);
  const [transferFromSearch, setTransferFromSearch] = useState('');
  const [transferToSearch, setTransferToSearch] = useState('');
  const [showTransferFromDropdown, setShowTransferFromDropdown] = useState(false);
  const [showTransferToDropdown, setShowTransferToDropdown] = useState(false);
  const [transferFromFocusedIndex, setTransferFromFocusedIndex] = useState(-1);
  const [transferToFocusedIndex, setTransferToFocusedIndex] = useState(-1);

  // Category Manager State
  const [settingsType, setSettingsType] = useState('expense');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🔖');
  const [newCatParent, setNewCatParent] = useState('');

  // Category Edit State
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');
  const [editCatParent, setEditCatParent] = useState('');

  // Party Manager State
  const [newPartyName, setNewPartyName] = useState('');

  // Tag Manager State
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');

  // Transaction Form Tag State
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  // Dropdown keyboard navigation focused indices
  const [catFocusedIndex, setCatFocusedIndex] = useState(-1);
  const [partyFocusedIndex, setPartyFocusedIndex] = useState(-1);
  const [accountFocusedIndex, setAccountFocusedIndex] = useState(-1);
  const [tagFocusedIndex, setTagFocusedIndex] = useState(-1);

  // Ledger Filter State
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [filterPreset, setFilterPreset] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterParties, setFilterParties] = useState([]);
  const [filterTags, setFilterTags] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Derived financials — no separate state needed
  const { balance, totalIncome, totalExpense } = useMemo(() => {
    let inc = 0, exp = 0;
    transactions.forEach(t => {
      if (t.transfer_id) return; // exclude transfer legs from totals
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

  // Parallelised fetch — categories/parties/transactions load simultaneously
  const fetchInitialData = async (activeSession) => {
    await fetchProfile(activeSession);
    await Promise.all([fetchCategories(), fetchParties(), fetchAccounts(), fetchTags(), fetchTransactions()]);
  };

  const fetchProfile = async (activeSession) => {
    if (!activeSession) return;
    const { data } = await supabase
      .from('profiles')
      .select('currency_preference, default_account_id')
      .eq('id', activeSession.user.id)
      .maybeSingle();
    if (data?.currency_preference) {
      setCurrencyCode(data.currency_preference);
      setCurrencySymbol(CURRENCY_SYMBOLS[data.currency_preference] || '$');
    }
    if (data?.default_account_id) setDefaultAccountId(data.default_account_id);
  };

  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const currencyDropdownRef = useRef(null);
  const catMenuRef = useRef(null);
  const partyMenuRef = useRef(null);
  const accountMenuRef = useRef(null);
  const tagMenuRef = useRef(null);
  const transferFromMenuRef = useRef(null);
  const transferToMenuRef = useRef(null);

  useEffect(() => {
    if (!catMenuRef.current || catFocusedIndex < 0) return;
    catMenuRef.current.querySelectorAll('.dropdown-item:not(.disabled)')[catFocusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [catFocusedIndex]);

  useEffect(() => {
    if (!partyMenuRef.current || partyFocusedIndex < 0) return;
    partyMenuRef.current.querySelectorAll('.dropdown-item:not(.disabled)')[partyFocusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [partyFocusedIndex]);

  useEffect(() => {
    if (!accountMenuRef.current || accountFocusedIndex < 0) return;
    accountMenuRef.current.querySelectorAll('.dropdown-item:not(.disabled)')[accountFocusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [accountFocusedIndex]);

  useEffect(() => {
    if (!tagMenuRef.current || tagFocusedIndex < 0) return;
    tagMenuRef.current.querySelectorAll('.dropdown-item:not(.disabled)')[tagFocusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [tagFocusedIndex]);

  useEffect(() => {
    if (!transferFromMenuRef.current || transferFromFocusedIndex < 0) return;
    transferFromMenuRef.current.querySelectorAll('.dropdown-item:not(.disabled)')[transferFromFocusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [transferFromFocusedIndex]);

  useEffect(() => {
    if (!transferToMenuRef.current || transferToFocusedIndex < 0) return;
    transferToMenuRef.current.querySelectorAll('.dropdown-item:not(.disabled)')[transferToFocusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [transferToFocusedIndex]);

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

  const handleSetDefaultAccount = useCallback(async (id) => {
    if (!session) return;
    const newDefault = defaultAccountId === id ? null : id;
    setDefaultAccountId(newDefault);
    await supabase.from('profiles').update({ default_account_id: newDefault }).eq('id', session.user.id);
  }, [session, defaultAccountId]);

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
    // Try with full join including tags; fall back progressively if tables not yet migrated
    let { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name, icon, type), parties(name), accounts(name), transaction_tags(tag_id, tags(id, name))')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error && error.code === 'PGRST200') {
      // tags FK not yet in schema — retry without the tags join
      ({ data, error } = await supabase
        .from('transactions')
        .select('*, categories(name, icon, type), parties(name), accounts(name)')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }));
    }

    if (error && error.code === 'PGRST200') {
      // accounts FK not yet in schema — retry without the accounts join
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
    setSelectedAccount(defaultAccountId);
    setNote('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setPartySearch('');
    setShowPartyDropdown(false);
    setCatSearch('');
    setShowCatDropdown(false);
    setAccountSearch('');
    setShowAccountDropdown(false);
    setSelectedTags([]);
    setTagSearch('');
    setShowTagDropdown(false);
    setTransferFromAccount(null);
    setTransferToAccount(null);
    setTransferFromSearch('');
    setTransferToSearch('');
    setShowTransferFromDropdown(false);
    setShowTransferToDropdown(false);
    setTransferFromFocusedIndex(-1);
    setTransferToFocusedIndex(-1);
  }, [defaultAccountId]);

  const openEditTransaction = useCallback((t) => {
    setTxToEdit(t);
    setAmount(t.amount.toString());
    setNote(t.note || '');
    setTxDate(t.transaction_date || t.created_at.split('T')[0]);
    if (t.transfer_id) {
      const pair = transactions.find(tx => tx.transfer_id === t.transfer_id && tx.id !== t.id);
      const expenseLeg = t.type === 'expense' ? t : pair;
      const incomeLeg = t.type === 'income' ? t : pair;
      setTxType('transfer');
      setTransferFromAccount(expenseLeg?.account_id || null);
      setTransferToAccount(incomeLeg?.account_id || null);
    } else {
      setTxType(t.type);
      setSelectedCategory(t.category_id);
      setSelectedParty(t.party_id);
      setSelectedAccount(t.account_id);
      setSelectedTags((t.transaction_tags || []).map(tt => tt.tag_id));
    }
    setView('new_transaction');
  }, [transactions]);

  const handleTransaction = useCallback(async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    if (!session) return;

    // --- Transfer ---
    if (txType === 'transfer') {
      if (!transferFromAccount || !transferToAccount) return;
      if (transferFromAccount === transferToAccount) { alert('From and To accounts must be different.'); return; }
      const base = { amount: val, note: note.trim() || null, transaction_date: txDate };
      if (txToEdit?.transfer_id) {
        const { error: e1 } = await supabase.from('transactions')
          .update({ ...base, account_id: transferFromAccount })
          .eq('transfer_id', txToEdit.transfer_id).eq('type', 'expense');
        const { error: e2 } = await supabase.from('transactions')
          .update({ ...base, account_id: transferToAccount })
          .eq('transfer_id', txToEdit.transfer_id).eq('type', 'income');
        if (e1 || e2) { alert('Database error updating transfer.'); return; }
      } else {
        const transferId = crypto.randomUUID();
        const { error } = await supabase.from('transactions').insert([
          { ...base, type: 'expense', account_id: transferFromAccount, user_id: session.user.id, transfer_id: transferId },
          { ...base, type: 'income',  account_id: transferToAccount,   user_id: session.user.id, transfer_id: transferId },
        ]);
        if (error) { alert('Database error: ' + error.message); return; }
      }
      fetchTransactions();
      resetForm();
      setView('ledger');
      return;
    }

    // --- Normal expense / income ---
    const finalCategoryId = selectedSubcategory || selectedCategory;
    const payload = {
      amount: val,
      type: txType,
      category_id: finalCategoryId,
      party_id: selectedParty,
      account_id: selectedAccount,
      note: note.trim() || null,
      transaction_date: txDate,
    };

    let transactionId;
    if (txToEdit) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', txToEdit.id);
      if (error) { alert('Database error: ' + error.message); return; }
      transactionId = txToEdit.id;
    } else {
      payload.user_id = session.user.id;
      const { data, error } = await supabase.from('transactions').insert([payload]).select('id').single();
      if (error) { alert('Database error: ' + error.message); return; }
      transactionId = data.id;
    }
    // Sync tags
    await supabase.from('transaction_tags').delete().eq('transaction_id', transactionId);
    if (selectedTags.length > 0) {
      await supabase.from('transaction_tags').insert(
        selectedTags.map(tagId => ({ transaction_id: transactionId, tag_id: tagId }))
      );
    }
    fetchTransactions();
    resetForm();
    setView('ledger');
  }, [amount, selectedSubcategory, selectedCategory, txType, selectedParty, selectedAccount, note, txDate, session, txToEdit, selectedTags, transferFromAccount, transferToAccount, resetForm]);

  const handleDeleteTransaction = useCallback(async () => {
    if (!session || !txToEdit) return;
    const isTransfer = !!txToEdit.transfer_id;
    if (!window.confirm(isTransfer ? 'Delete this transfer (both legs)?' : 'Delete this transaction?')) return;

    const { error } = isTransfer
      ? await supabase.from('transactions').delete().eq('transfer_id', txToEdit.transfer_id)
      : await supabase.from('transactions').delete().eq('id', txToEdit.id);
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

  const handleUpdateCategory = useCallback(async (id, updates) => {
    if (!session) return;
    const { error } = await supabase.from('categories').update(updates).eq('id', id);
    if (!error) { setEditingCatId(null); setEditCatParent(''); fetchCategories(); }
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

  const handleCreateAndSelectParty = useCallback(async (name) => {
    if (!session || !name.trim()) return;
    const { data, error } = await supabase
      .from('parties')
      .insert([{ user_id: session.user.id, name: name.trim() }])
      .select('id')
      .single();
    if (!error && data) {
      await fetchParties();
      setSelectedParty(data.id);
      setPartySearch('');
      setShowPartyDropdown(false);
      setPartyFocusedIndex(-1);
    }
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

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCategories([]);
    setFilterParties([]);
    setFilterTags([]);
    setFilterType('all');
  }, []);

  // Memoised category splits — avoids filter on every render
  const parentCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const subCategories = useMemo(() => categories.filter(c => c.parent_id), [categories]);

  // Filtered Ledger
  const filteredLedger = useMemo(() => {
    return transactions.filter(t => {
      const matchStart = filterStart ? t.transaction_date >= filterStart : true;
      const matchEnd   = filterEnd   ? t.transaction_date <= filterEnd   : true;
      const matchType  = filterType === 'all'      ? true
                       : filterType === 'transfer' ? !!t.transfer_id
                       : (t.type === filterType && !t.transfer_id);
      const matchSearch = searchTerm
        ? (t.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.parties?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchCat = filterCategories.length > 0
        ? (!t.transfer_id && filterCategories.some(catId =>
            t.category_id === catId ||
            categories.find(c => c.id === t.category_id)?.parent_id === catId
          ))
        : true;
      const matchParty = filterParties.length > 0 ? filterParties.includes(t.party_id) : true;
      const matchTags  = filterTags.length > 0
        ? (t.transaction_tags?.some(tt => filterTags.includes(tt.tag_id)) ?? false)
        : true;
      return matchStart && matchEnd && matchType && matchSearch && matchCat && matchParty && matchTags;
    });
  }, [transactions, filterStart, filterEnd, filterType, searchTerm, filterCategories, filterParties, filterTags, categories]);

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
      <div className="auth-view fade-in">
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="icon-btn-text" onClick={() => setView('landing')}>← Back</button>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>MOMA</h2>
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
      </div>
    );
  }

  if (view === 'settings') {
    return (
      <div className="app-shell">
        <Sidebar view={view} onDashboard={navToDashboard} onLedger={navToLedger} onNewTx={navToNewTx} onSettings={navToSettings} session={session} onLogout={handleLogout} />
        <div className="page-content">
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
                  <button className="settings-nav-btn" onClick={() => setView('tag_management')}>
                    Tags <span className="arrow">›</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'account_management') {
    return (
      <div className="app-shell">
        <Sidebar view={view} onDashboard={navToDashboard} onLedger={navToLedger} onNewTx={navToNewTx} onSettings={navToSettings} session={session} onLogout={handleLogout} />
        <div className="page-content">
        <div className="page-inner slide-up">
          <div className="page-header">
            <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
            <h2 className="page-title">Accounts</h2>
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
                        <span className="cat-name">
                          {acc.name}
                          {defaultAccountId === acc.id && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', borderRadius: '10px', padding: '0.1rem 0.45rem' }}>default</span>
                          )}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Current: {currencySymbol}{currentBal.toFixed(2)} | Initial: {currencySymbol}{parseFloat(acc.initial_balance).toFixed(2)}
                        </span>
                      </div>
                      <button
                        className="icon-btn-text"
                        style={{ padding: '0 0.5rem', fontSize: '1rem', color: defaultAccountId === acc.id ? 'var(--primary)' : 'var(--text-muted)', marginRight: '0.25rem' }}
                        title={defaultAccountId === acc.id ? 'Remove default' : 'Set as default'}
                        onClick={() => handleSetDefaultAccount(acc.id)}
                      >★</button>
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
        </div>
        </div>
      </div>
    );
  }

  if (view === 'party_management') {
    return (
      <div className="app-shell">
        <Sidebar view={view} onDashboard={navToDashboard} onLedger={navToLedger} onNewTx={navToNewTx} onSettings={navToSettings} session={session} onLogout={handleLogout} />
        <div className="page-content">
        <div className="page-inner slide-up">
          <div className="page-header">
            <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
            <h2 className="page-title">Parties</h2>
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
        </div>
        </div>
      </div>
    );
  }

  if (view === 'tag_management') {
    return (
      <div className="app-shell">
        <Sidebar view={view} onDashboard={navToDashboard} onLedger={navToLedger} onNewTx={navToNewTx} onSettings={navToSettings} session={session} onLogout={handleLogout} />
        <div className="page-content">
        <div className="page-inner slide-up">
          <div className="page-header">
            <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
            <h2 className="page-title">Tags</h2>
          </div>

        <div className="settings-controls fade-in">
          <div className="category-manager">
            {tags.length === 0 ? (
              <div className="empty-state">
                <p>No tags added yet.</p>
              </div>
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
              <input
                type="text"
                placeholder="Tag Name (e.g. Vacation, Reimbursable)"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                required
                style={{ flex: 1 }}
              />
            </div>
            <button type="submit" className="add-cat-btn">Add Tag</button>
          </form>
        </div>
        </div>
        </div>
      </div>
    );
  }

  if (view === 'category_management') {
    const parents = parentCategories.filter(c => c.type === settingsType);
    return (
      <div className="app-shell">
        <Sidebar view={view} onDashboard={navToDashboard} onLedger={navToLedger} onNewTx={navToNewTx} onSettings={navToSettings} session={session} onLogout={handleLogout} />
        <div className="page-content">
        <div className="page-inner slide-up">
          <div className="page-header">
            <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
            <h2 className="page-title">Categories</h2>
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
                  {editingCatId === parent.id ? (
                    <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          maxLength="2"
                          value={editCatIcon}
                          onChange={(e) => setEditCatIcon(e.target.value)}
                          className="icon-input"
                          style={{ flexShrink: 0 }}
                        />
                        <input
                          type="text"
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="text-input"
                          style={{ flex: 1 }}
                          autoFocus
                        />
                      </div>
                      <select
                        value={editCatParent}
                        onChange={(e) => setEditCatParent(e.target.value)}
                        className="text-input"
                        style={{ fontSize: '0.875rem' }}
                      >
                        <option value="">— Root Category (no parent) —</option>
                        {parents.filter(p => p.id !== parent.id).map(p => (
                          <option key={p.id} value={p.id}>Subcategory of: {p.icon} {p.name}</option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="add-cat-btn"
                          style={{ padding: '0.5rem 0.875rem' }}
                          onClick={() => handleUpdateCategory(parent.id, { name: editCatName.trim() || parent.name, icon: editCatIcon || parent.icon, parent_id: editCatParent || null })}
                        >Save</button>
                        <button className="icon-btn-text" onClick={() => setEditingCatId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="settings-cat-parent">
                      <span className="cat-icon">{parent.icon}</span>
                      <span className="cat-name">{parent.name}</span>
                      {!parent.is_system && (
                        <>
                          <button
                            className="icon-btn-text"
                            style={{ padding: '0 0.5rem', color: 'var(--primary)', marginRight: '0.25rem' }}
                            onClick={() => { setEditingCatId(parent.id); setEditCatName(parent.name); setEditCatIcon(parent.icon); setEditCatParent(parent.parent_id || ''); }}
                          >✎</button>
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
                                <input
                                  type="text"
                                  maxLength="2"
                                  value={editCatIcon}
                                  onChange={(e) => setEditCatIcon(e.target.value)}
                                  className="icon-input"
                                  style={{ flexShrink: 0 }}
                                />
                                <input
                                  type="text"
                                  value={editCatName}
                                  onChange={(e) => setEditCatName(e.target.value)}
                                  className="text-input"
                                  style={{ flex: 1 }}
                                  autoFocus
                                />
                              </div>
                              <select
                                value={editCatParent}
                                onChange={(e) => setEditCatParent(e.target.value)}
                                className="text-input"
                                style={{ fontSize: '0.875rem' }}
                              >
                                <option value="">— Root Category (no parent) —</option>
                                {parents.filter(p => p.id !== sub.id).map(p => (
                                  <option key={p.id} value={p.id}>Subcategory of: {p.icon} {p.name}</option>
                                ))}
                              </select>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  className="add-cat-btn"
                                  style={{ padding: '0.5rem 0.875rem' }}
                                  onClick={() => handleUpdateCategory(sub.id, { name: editCatName.trim() || sub.name, icon: editCatIcon || sub.icon, parent_id: editCatParent || null })}
                                >Save</button>
                                <button className="icon-btn-text" onClick={() => setEditingCatId(null)}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="settings-cat-child">
                              <span className="cat-icon">{sub.icon}</span>
                              <span className="cat-name">{sub.name}</span>
                              <button
                                className="icon-btn-text"
                                style={{ padding: '0 0.5rem', color: 'var(--primary)', marginRight: '0.25rem' }}
                                onClick={() => { setEditingCatId(sub.id); setEditCatName(sub.name); setEditCatIcon(sub.icon); setEditCatParent(sub.parent_id || ''); }}
                              >✎</button>
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
        </div>
        </div>
      </div>
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
    const partyItems = [
      { id: null, _clear: true },
      ...(showCreateParty ? [{ id: null, _create: true, name: partySearch.trim() }] : []),
      ...filteredParties,
    ];
    const filteredTagItems = tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()));
    const filteredTransferFromAccounts = accounts.filter(a => a.name.toLowerCase().includes(transferFromSearch.toLowerCase()));
    const filteredTransferToAccounts = accounts.filter(a => a.name.toLowerCase().includes(transferToSearch.toLowerCase()));

    return (
      <div className="app-shell">
        <Sidebar view={view} onDashboard={navToDashboard} onLedger={navToLedger} onNewTx={navToNewTx} onSettings={navToSettings} session={session} onLogout={handleLogout} />
        <div className="page-content">
        <div className="page-inner slide-up" style={{ maxWidth: '640px' }}>
          <div className="page-header">
            <button
              className="icon-btn-text"
              onClick={() => { resetForm(); setView(txToEdit ? 'ledger' : 'dashboard'); }}
            >
              ← Cancel
            </button>
            <h2 className="page-title">{txToEdit ? 'Edit Transaction' : 'New Transaction'}</h2>
          </div>

        <div className="fluid-input-area fade-in">
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
            <button
              className={`type-btn ${txType === 'transfer' ? 'active-transfer' : ''}`}
              onClick={() => { setTxType('transfer'); setSelectedCategory(null); setSelectedSubcategory(null); }}
            >
              Transfer
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

          {txType === 'transfer' && (<>
          <div className="category-selection-area" style={{ position: 'relative', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
            <p className="selection-label">From Account</p>
            <div className="searchable-dropdown" onBlur={() => setTimeout(() => { setShowTransferFromDropdown(false); setTransferFromFocusedIndex(-1); }, 200)}>
              <input
                type="text"
                className="text-input"
                placeholder="From Account..."
                value={transferFromAccount ? accounts.find(a => a.id === transferFromAccount)?.name ?? transferFromSearch : transferFromSearch}
                onChange={(e) => { setTransferFromSearch(e.target.value); setTransferFromAccount(null); setShowTransferFromDropdown(true); setTransferFromFocusedIndex(-1); }}
                onFocus={() => setShowTransferFromDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); if (!showTransferFromDropdown) setShowTransferFromDropdown(true); setTransferFromFocusedIndex(i => Math.min(i + 1, filteredTransferFromAccounts.length - 1)); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setTransferFromFocusedIndex(i => Math.max(i - 1, 0)); }
                  else if (e.key === 'Enter' && transferFromFocusedIndex >= 0) { e.preventDefault(); const a = filteredTransferFromAccounts[transferFromFocusedIndex]; if (a) { setTransferFromAccount(a.id); setTransferFromSearch(''); setShowTransferFromDropdown(false); setTransferFromFocusedIndex(-1); } }
                  else if (e.key === 'Escape') { setShowTransferFromDropdown(false); setTransferFromFocusedIndex(-1); }
                }}
              />
              {showTransferFromDropdown && (
                <div className="dropdown-menu" ref={transferFromMenuRef}>
                  {filteredTransferFromAccounts.map((a, idx) => (
                    <div key={a.id} className={`dropdown-item${transferFromFocusedIndex === idx ? ' dropdown-item-focused' : ''}`} onClick={() => { setTransferFromAccount(a.id); setTransferFromSearch(''); setShowTransferFromDropdown(false); setTransferFromFocusedIndex(-1); }}>
                      <span style={{ marginRight: '0.4rem', opacity: 0.6 }}>🏦</span> {a.name}
                    </div>
                  ))}
                  {filteredTransferFromAccounts.length === 0 && <div className="dropdown-item disabled">No matching account</div>}
                </div>
              )}
            </div>
          </div>

          <div className="category-selection-area" style={{ position: 'relative' }}>
            <p className="selection-label">To Account</p>
            <div className="searchable-dropdown" onBlur={() => setTimeout(() => { setShowTransferToDropdown(false); setTransferToFocusedIndex(-1); }, 200)}>
              <input
                type="text"
                className="text-input"
                placeholder="To Account..."
                value={transferToAccount ? accounts.find(a => a.id === transferToAccount)?.name ?? transferToSearch : transferToSearch}
                onChange={(e) => { setTransferToSearch(e.target.value); setTransferToAccount(null); setShowTransferToDropdown(true); setTransferToFocusedIndex(-1); }}
                onFocus={() => setShowTransferToDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); if (!showTransferToDropdown) setShowTransferToDropdown(true); setTransferToFocusedIndex(i => Math.min(i + 1, filteredTransferToAccounts.length - 1)); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setTransferToFocusedIndex(i => Math.max(i - 1, 0)); }
                  else if (e.key === 'Enter' && transferToFocusedIndex >= 0) { e.preventDefault(); const a = filteredTransferToAccounts[transferToFocusedIndex]; if (a) { setTransferToAccount(a.id); setTransferToSearch(''); setShowTransferToDropdown(false); setTransferToFocusedIndex(-1); } }
                  else if (e.key === 'Escape') { setShowTransferToDropdown(false); setTransferToFocusedIndex(-1); }
                }}
              />
              {showTransferToDropdown && (
                <div className="dropdown-menu" ref={transferToMenuRef}>
                  {filteredTransferToAccounts.map((a, idx) => (
                    <div key={a.id} className={`dropdown-item${transferToFocusedIndex === idx ? ' dropdown-item-focused' : ''}`} onClick={() => { setTransferToAccount(a.id); setTransferToSearch(''); setShowTransferToDropdown(false); setTransferToFocusedIndex(-1); }}>
                      <span style={{ marginRight: '0.4rem', opacity: 0.6 }}>🏦</span> {a.name}
                    </div>
                  ))}
                  {filteredTransferToAccounts.length === 0 && <div className="dropdown-item disabled">No matching account</div>}
                </div>
              )}
            </div>
          </div>
          </>)}

          {txType !== 'transfer' && (<>
          <div className="category-selection-area" style={{ position: 'relative', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
            <p className="selection-label">Account</p>
            <div
              className="searchable-dropdown"
              onBlur={() => setTimeout(() => { setShowAccountDropdown(false); setAccountFocusedIndex(-1); }, 200)}
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
                  setAccountFocusedIndex(-1);
                }}
                onFocus={() => setShowAccountDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!showAccountDropdown) setShowAccountDropdown(true);
                    setAccountFocusedIndex(i => Math.min(i + 1, accountItems.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setAccountFocusedIndex(i => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter' && accountFocusedIndex >= 0) {
                    e.preventDefault();
                    const item = accountItems[accountFocusedIndex];
                    if (item) {
                      if (item._clear) { setSelectedAccount(null); setAccountSearch(''); }
                      else { setSelectedAccount(item.id); setAccountSearch(''); }
                      setShowAccountDropdown(false);
                      setAccountFocusedIndex(-1);
                    }
                  } else if (e.key === 'Escape') {
                    setShowAccountDropdown(false);
                    setAccountFocusedIndex(-1);
                  }
                }}
              />
              {showAccountDropdown && (
                <div className="dropdown-menu" ref={accountMenuRef}>
                  <div
                    className={`dropdown-item${accountFocusedIndex === 0 ? ' dropdown-item-focused' : ''}`}
                    onClick={() => { setSelectedAccount(null); setAccountSearch(''); setShowAccountDropdown(false); setAccountFocusedIndex(-1); }}
                  >
                    <em style={{ color: 'var(--text-muted)' }}>None / Clear</em>
                  </div>
                  {filteredAccounts.map((a, idx) => (
                    <div
                      key={a.id}
                      className={`dropdown-item${accountFocusedIndex === idx + 1 ? ' dropdown-item-focused' : ''}`}
                      onClick={() => { setSelectedAccount(a.id); setAccountSearch(''); setShowAccountDropdown(false); setAccountFocusedIndex(-1); }}
                    >
                      <span style={{ marginRight: '0.4rem', opacity: 0.6 }}>🏦</span> {a.name}
                    </div>
                  ))}
                  {filteredAccounts.length === 0 && (
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
              onBlur={() => setTimeout(() => { setShowCatDropdown(false); setCatFocusedIndex(-1); }, 200)}
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
                  setCatFocusedIndex(-1);
                }}
                onFocus={() => setShowCatDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!showCatDropdown) setShowCatDropdown(true);
                    setCatFocusedIndex(i => Math.min(i + 1, filteredCats.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setCatFocusedIndex(i => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter' && catFocusedIndex >= 0) {
                    e.preventDefault();
                    const c = filteredCats[catFocusedIndex];
                    if (c) { setSelectedCategory(c.id); setCatSearch(''); setShowCatDropdown(false); setCatFocusedIndex(-1); }
                  } else if (e.key === 'Escape') {
                    setShowCatDropdown(false);
                    setCatFocusedIndex(-1);
                  }
                }}
              />
              {showCatDropdown && (
                <div className="dropdown-menu" ref={catMenuRef}>
                  {filteredCats.map((c, idx) => {
                    const isSub = !!c.parent_id;
                    const pName = isSub ? currentParents.find(p => p.id === c.parent_id)?.name : null;
                    return (
                      <div
                        key={c.id}
                        className={`dropdown-item${catFocusedIndex === idx ? ' dropdown-item-focused' : ''}`}
                        onClick={() => { setSelectedCategory(c.id); setCatSearch(''); setShowCatDropdown(false); setCatFocusedIndex(-1); }}
                      >
                        {c.icon} {c.name}{isSub && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>in {pName}</span>}
                      </div>
                    );
                  })}
                  {filteredCats.length === 0 && (
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
              onBlur={() => setTimeout(() => { setShowPartyDropdown(false); setPartyFocusedIndex(-1); }, 200)}
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
                  setPartyFocusedIndex(-1);
                }}
                onFocus={() => setShowPartyDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!showPartyDropdown) setShowPartyDropdown(true);
                    setPartyFocusedIndex(i => Math.min(i + 1, partyItems.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setPartyFocusedIndex(i => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (partyFocusedIndex >= 0) {
                      const item = partyItems[partyFocusedIndex];
                      if (item) {
                        if (item._clear) { setSelectedParty(null); setPartySearch(''); setShowPartyDropdown(false); setPartyFocusedIndex(-1); }
                        else if (item._create) { handleCreateAndSelectParty(item.name); }
                        else { setSelectedParty(item.id); setPartySearch(''); setShowPartyDropdown(false); setPartyFocusedIndex(-1); }
                      }
                    } else if (showCreateParty) {
                      handleCreateAndSelectParty(partySearch);
                    }
                  } else if (e.key === 'Escape') {
                    setShowPartyDropdown(false);
                    setPartyFocusedIndex(-1);
                  }
                }}
              />
              {showPartyDropdown && (
                <div className="dropdown-menu" ref={partyMenuRef}>
                  <div
                    className={`dropdown-item${partyFocusedIndex === 0 ? ' dropdown-item-focused' : ''}`}
                    onClick={() => { setSelectedParty(null); setPartySearch(''); setShowPartyDropdown(false); setPartyFocusedIndex(-1); }}
                  >
                    <em style={{ color: 'var(--text-muted)' }}>None / Clear</em>
                  </div>
                  {showCreateParty && (
                    <div
                      className={`dropdown-item${partyFocusedIndex === 1 ? ' dropdown-item-focused' : ''}`}
                      onClick={() => handleCreateAndSelectParty(partySearch)}
                    >
                      <span style={{ marginRight: '0.4rem' }}>➕</span>
                      Create <strong>"{partySearch.trim()}"</strong>
                    </div>
                  )}
                  {filteredParties.map((p, idx) => (
                    <div
                      key={p.id}
                      className={`dropdown-item${partyFocusedIndex === idx + (showCreateParty ? 2 : 1) ? ' dropdown-item-focused' : ''}`}
                      onClick={() => { setSelectedParty(p.id); setPartySearch(''); setShowPartyDropdown(false); setPartyFocusedIndex(-1); }}
                    >
                      <span style={{ marginRight: '0.4rem', opacity: 0.6 }}>👥</span> {p.name}
                    </div>
                  ))}
                  {filteredParties.length === 0 && !showCreateParty && (
                    <div className="dropdown-item disabled">No matching party</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="category-selection-area" style={{ position: 'relative' }}>
            <p className="selection-label">Tags</p>
            {selectedTags.length > 0 && (
              <div className="tag-chips-row">
                {selectedTags.map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <span key={tagId} className="tag-chip">
                      {tag.name}
                      <button
                        type="button"
                        className="tag-chip-remove"
                        onClick={() => handleToggleTag(tagId)}
                      >×</button>
                    </span>
                  );
                })}
              </div>
            )}
            <div
              className="searchable-dropdown"
              onBlur={() => setTimeout(() => { setShowTagDropdown(false); setTagFocusedIndex(-1); }, 200)}
            >
              <input
                type="text"
                className="text-input"
                placeholder="Add tags (optional)..."
                value={tagSearch}
                onChange={(e) => { setTagSearch(e.target.value); setShowTagDropdown(true); setTagFocusedIndex(-1); }}
                onFocus={() => setShowTagDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!showTagDropdown) setShowTagDropdown(true);
                    setTagFocusedIndex(i => Math.min(i + 1, filteredTagItems.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setTagFocusedIndex(i => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter' && tagFocusedIndex >= 0) {
                    e.preventDefault();
                    const t = filteredTagItems[tagFocusedIndex];
                    if (t) { handleToggleTag(t.id); setTagSearch(''); }
                  } else if (e.key === 'Escape') {
                    setShowTagDropdown(false);
                    setTagFocusedIndex(-1);
                  }
                }}
              />
              {showTagDropdown && (
                <div className="dropdown-menu" ref={tagMenuRef}>
                  {filteredTagItems.map((t, idx) => (
                    <div
                      key={t.id}
                      className={`dropdown-item${selectedTags.includes(t.id) ? ' tag-item-selected' : ''}${tagFocusedIndex === idx ? ' dropdown-item-focused' : ''}`}
                      onMouseDown={(e) => { e.preventDefault(); handleToggleTag(t.id); setTagSearch(''); }}
                    >
                      <span className="tag-checkbox">{selectedTags.includes(t.id) ? '☑' : '☐'}</span>
                      {t.name}
                    </div>
                  ))}
                  {filteredTagItems.length === 0 && (
                    <div className="dropdown-item disabled">No matching tag</div>
                  )}
                </div>
              )}
            </div>
          </div>
          </>)}

          <button
            className={`submit-tx-btn bg-${txType}`}
            onClick={handleTransaction}
            disabled={txType === 'transfer' ? (!amount || !transferFromAccount || !transferToAccount) : (!amount || !selectedCategory)}
          >
            {txToEdit ? `Update ${txType === 'transfer' ? 'Transfer' : 'Transaction'}` : `Save ${txType === 'transfer' ? 'Transfer' : 'Transaction'}`}
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
        </div>
        </div>
      </div>
    );
  }

  // --- LEDGER VIEW ---
  if (view === 'ledger') {
    return (
      <div className="app-shell">
        <Sidebar view={view} onDashboard={navToDashboard} onLedger={navToLedger} onNewTx={navToNewTx} onSettings={navToSettings} session={session} onLogout={handleLogout} />
        <div className="page-content">
        <div className="page-inner fade-in">
          <div className="page-header">
            <h2 className="page-title">Ledger</h2>
          </div>

        <div className="ledger-filters fade-in">
          {/* Search + Filters toggle row */}
          <div className="ledger-search-row">
            <div className="ledger-search-wrap">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                className="ledger-search-input"
                placeholder="Search notes, parties…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="search-clear-btn" onClick={() => setSearchTerm('')}>✕</button>
              )}
            </div>
            <button
              className={`filter-toggle-btn${showFilters ? ' active' : ''}`}
              onClick={() => setShowFilters(v => !v)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filters
              {(filterCategories.length + filterParties.length + filterTags.length + (filterType !== 'all' ? 1 : 0)) > 0 && (
                <span className="filter-badge">{filterCategories.length + filterParties.length + filterTags.length + (filterType !== 'all' ? 1 : 0)}</span>
              )}
            </button>
          </div>

          {/* Date preset pills */}
          <div className="filter-pills">
            <button className={`filter-pill ${filterPreset === 'all' ? 'active-pill' : ''}`} onClick={() => applyPreset('all')}>All</button>
            <button className={`filter-pill ${filterPreset === 'this_month' ? 'active-pill' : ''}`} onClick={() => applyPreset('this_month')}>This Month</button>
            <button className={`filter-pill ${filterPreset === 'last_month' ? 'active-pill' : ''}`} onClick={() => applyPreset('last_month')}>Last Month</button>
            <button className={`filter-pill ${filterPreset === 'custom' ? 'active-pill' : ''}`} onClick={() => setFilterPreset('custom')}>Custom</button>
          </div>
          {filterPreset === 'custom' && (
            <div className="custom-dates">
              <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="text-input" />
              <input type="date" value={filterEnd}   onChange={(e) => setFilterEnd(e.target.value)}   className="text-input" />
            </div>
          )}

          {/* Advanced filters panel */}
          {showFilters && (
            <div className="advanced-filters">
              {/* Type */}
              <div className="filter-section">
                <span className="filter-section-label">Type</span>
                <div className="filter-chips">
                  {['all','income','expense','transfer'].map(t => (
                    <button
                      key={t}
                      className={`filter-chip${filterType === t ? ' active' : ''}`}
                      onClick={() => setFilterType(t)}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              {parentCategories.length > 0 && (
                <div className="filter-section">
                  <span className="filter-section-label">Category</span>
                  <div className="filter-chips">
                    {parentCategories.map(c => (
                      <button
                        key={c.id}
                        className={`filter-chip${filterCategories.includes(c.id) ? ' active' : ''}`}
                        onClick={() => setFilterCategories(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                      >
                        {c.icon} {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Parties */}
              {parties.length > 0 && (
                <div className="filter-section">
                  <span className="filter-section-label">Counterparty</span>
                  <div className="filter-chips">
                    {parties.map(p => (
                      <button
                        key={p.id}
                        className={`filter-chip${filterParties.includes(p.id) ? ' active' : ''}`}
                        onClick={() => setFilterParties(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="filter-section">
                  <span className="filter-section-label">Tags</span>
                  <div className="filter-chips">
                    {tags.map(t => (
                      <button
                        key={t.id}
                        className={`filter-chip${filterTags.includes(t.id) ? ' active' : ''}`}
                        onClick={() => setFilterTags(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(filterCategories.length + filterParties.length + filterTags.length + (filterType !== 'all' ? 1 : 0)) > 0 && (
                <button className="clear-filters-btn" onClick={clearFilters}>Clear all filters</button>
              )}
            </div>
          )}
        </div>

        <div className="transactions-list" style={{ marginTop: '0.5rem' }}>
          {filteredLedger.length === 0 ? (
            <div className="empty-state">
              <p>No transactions match your filters.</p>
              {(searchTerm || filterCategories.length || filterParties.length || filterTags.length || filterType !== 'all') && (
                <button className="icon-btn-text" onClick={clearFilters} style={{ marginTop: '0.5rem' }}>Clear filters</button>
              )}
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
                  {(() => {
                    const seenTransfers = new Set();
                    return txs.map(t => {
                      if (t.transfer_id) {
                        if (seenTransfers.has(t.transfer_id)) return null;
                        seenTransfers.add(t.transfer_id);
                        const pair = txs.find(x => x.transfer_id === t.transfer_id && x.id !== t.id)
                          || transactions.find(x => x.transfer_id === t.transfer_id && x.id !== t.id);
                        const expLeg = t.type === 'expense' ? t : pair;
                        const incLeg = t.type === 'income' ? t : pair;
                        const fromName = accounts.find(a => a.id === expLeg?.account_id)?.name || '?';
                        const toName   = accounts.find(a => a.id === incLeg?.account_id)?.name || '?';
                        return (
                          <div key={t.transfer_id} className="transaction-item transfer" onClick={() => openEditTransaction(t)}>
                            <div className="t-icon">🔄</div>
                            <div className="t-details">
                              <div className="t-type">Transfer: {fromName} → {toName}</div>
                              {t.note && <div className="t-note">{t.note}</div>}
                              <div className="t-time">{t.transaction_date}</div>
                            </div>
                            <div className="t-amount t-amount-transfer">{currencySymbol}{parseFloat(t.amount).toFixed(2)}</div>
                          </div>
                        );
                      }
                      const cat = t.categories || { icon: '•', name: 'Uncategorized' };
                      const pName = t.parties?.name;
                      const aName = t.accounts?.name;
                      let tag = cat.name;
                      if (pName && aName) tag = `${cat.name} · ${pName} · 🏦 ${aName}`;
                      else if (pName) tag = `${cat.name} · ${pName}`;
                      else if (aName) tag = `${cat.name} · 🏦 ${aName}`;
                      return (
                        <div key={t.id} className={`transaction-item ${t.type}`} onClick={() => openEditTransaction(t)}>
                          <div className="t-icon">{cat.icon}</div>
                          <div className="t-details">
                            <div className="t-type">{tag}</div>
                            {t.note && <div className="t-note">{t.note}</div>}
                            {(t.transaction_tags?.length > 0) && (
                              <div className="t-tags">
                                {t.transaction_tags.map(tt => tt.tags?.name).filter(Boolean).map(name => (
                                  <span key={name} className="t-tag-pill">{name}</span>
                                ))}
                              </div>
                            )}
                            <div className="t-time">{t.transaction_date}</div>
                          </div>
                          <div className="t-amount">{t.type === 'income' ? '+' : '-'}{currencySymbol}{parseFloat(t.amount).toFixed(2)}</div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ));
          })()}
        </div>
        </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div className="app-shell">
      <Sidebar view={view} onDashboard={navToDashboard} onLedger={navToLedger} onNewTx={navToNewTx} onSettings={navToSettings} session={session} onLogout={handleLogout} />
      <div className="page-content">
        <div className="page-inner fade-in">
          <div className="page-header">
            <h2 className="page-title">Dashboard</h2>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-left">
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

              {topExpenseCat && (
                <div className="insight-card">
                  <span className="insight-icon">💡</span>
                  <p className="insight-text">
                    Your top expense is <strong>{topExpenseCat[0]}</strong> at {currencySymbol}{topExpenseCat[1].toFixed(2)} total.
                  </p>
                </div>
              )}
            </div>

            <div className="dashboard-right">
              <div className="section-header">
                <p className="section-title">Recent Activity</p>
                <button className="section-link" onClick={navToLedger}>View All →</button>
              </div>
              <div className="transactions-list">
                {transactions.slice(0, 8).length === 0 ? (
                  <div className="empty-state">
                    <p>No transactions yet.</p>
                    <p className="hint">Click + New Transaction to record your first entry.</p>
                  </div>
                ) : (() => {
                  const seenTransfers = new Set();
                  return transactions.slice(0, 8).map(t => {
                    if (t.transfer_id) {
                      if (seenTransfers.has(t.transfer_id)) return null;
                      seenTransfers.add(t.transfer_id);
                      const pair = transactions.find(x => x.transfer_id === t.transfer_id && x.id !== t.id);
                      const expLeg = t.type === 'expense' ? t : pair;
                      const incLeg = t.type === 'income' ? t : pair;
                      const fromName = accounts.find(a => a.id === expLeg?.account_id)?.name || '?';
                      const toName   = accounts.find(a => a.id === incLeg?.account_id)?.name || '?';
                      return (
                        <div key={t.transfer_id} className="transaction-item transfer" onClick={() => openEditTransaction(t)}>
                          <div className="t-icon">🔄</div>
                          <div className="t-details">
                            <div className="t-type">Transfer: {fromName} → {toName}</div>
                            {t.note && <div className="t-note">{t.note}</div>}
                            <div className="t-time">{t.transaction_date || new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                          </div>
                          <div className="t-amount t-amount-transfer">{currencySymbol}{parseFloat(t.amount).toFixed(2)}</div>
                        </div>
                      );
                    }
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
                          {(t.transaction_tags?.length > 0) && (
                            <div className="t-tags">
                              {t.transaction_tags.map(tt => tt.tags?.name).filter(Boolean).map(name => (
                                <span key={name} className="t-tag-pill">{name}</span>
                              ))}
                            </div>
                          )}
                          <div className="t-time">
                            {t.transaction_date || new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div className="t-amount">
                          {t.type === 'income' ? '+' : '-'}{currencySymbol}{parseFloat(t.amount).toFixed(2)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
