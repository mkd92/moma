import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';

// Modular Imports
import { PATH_VIEWS, VIEW_PATHS } from './constants';
import { useAuth, useAppData, useTransactionForm } from './hooks';
import { 
  Landing, AuthView, Dashboard, Ledger, Analytics, 
  Budgets, NewTransaction, Settings, AccountManagement, 
  CategoryManagement, PartyManagement, TagManagement 
} from './views';

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const view = PATH_VIEWS[pathname] || 'landing';
  const setView = useCallback((v) => navigate(VIEW_PATHS[v] || '/'), [navigate]);

  // --- Theme Logic ---
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('moma-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('moma-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);

  // --- UI State ---
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAnalyticsFilters, setShowAnalyticsFilters] = useState(false);

  // --- Auth Hook ---
  const auth = useAuth();
  const { 
    session, authMode, setAuthMode, email, setEmail, password, setPassword,
    authLoading, authError, setAuthError, handleAuth, handleGoogleSignIn, handleLogout 
  } = auth;

  // --- App Data Hook ---
  const appData = useAppData(session, navigate, pathname);
  const {
    transactions, categories, parties, accounts, tags, budgets,
    currencySymbol, currencyCode, setCurrencyCode, defaultAccountId, setDefaultAccountId,
    fetchTransactions, fetchAccounts, refreshData,
    handleCreateCategory, handleDeleteCategory, handleCreateParty, handleDeleteParty,
    handleDeleteTransaction, handleCreateTag, handleDeleteTag, handleCreateAccount,
    handleDeleteAccount, handleUpdateAccount, handleSetDefaultAccount, handleSaveBudget
  } = appData;

  // --- Transaction Form Hook ---
  const txForm = useTransactionForm(session, accounts, categories, transactions, defaultAccountId, fetchTransactions, setView);
  const {
    txToEdit, setTxToEdit, txType, setTxType, amount, setAmount,
    selectedCategory, setSelectedCategory, selectedSubcategory, setSelectedSubcategory,
    selectedParty, setSelectedParty, selectedAccount, setSelectedAccount,
    note, setNote, txDate, setTxDate, selectedTags, setSelectedTags,
    transferFromAccount, setTransferFromAccount, transferToAccount, setTransferToAccount,
    resetForm, openEditTransaction, handleTransaction
  } = txForm;

  // --- Global Navigation Props ---
  const shellProps = {
    view,
    onDashboard: () => setView('dashboard'),
    onLedger: () => { resetForm(); setView('ledger'); },
    onAnalytics: () => setView('analytics'),
    onBudgets: () => setView('budgets'),
    onNewTx: () => { resetForm(); setView('new_transaction'); },
    onSettings: () => setView('settings'),
    onLogout: handleLogout,
    session,
    onRefresh: refreshData,
    theme,
    onToggleTheme: toggleTheme
  };

  // --- View Selection ---
  if (view === 'landing') {
    return <Landing session={session} setView={setView} />;
  }

  if (view === 'auth') {
    return (
      <AuthView 
        authMode={authMode} setAuthMode={setAuthMode}
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        authLoading={authLoading} authError={authError} setAuthError={setAuthError}
        handleAuth={handleAuth} handleGoogleSignIn={handleGoogleSignIn}
        setView={setView}
      />
    );
  }

  // Grouped props for easier passing
  const viewProps = {
    shellProps,
    ...appData,
    ...txForm,
    openEditTransaction,
    navToLedger: () => { resetForm(); setView('ledger'); },
    navToAnalytics: () => setView('analytics'),
    navToDashboard: () => setView('dashboard'),
    setView,
    showAdvancedFilters,
    setShowFilters: setShowAdvancedFilters,
    showAnalyticsFilters,
    setShowAnalyticsFilters
  };

  if (view === 'dashboard') {
    return <Dashboard {...viewProps} />;
  }

  if (view === 'ledger') {
    return <Ledger {...viewProps} />;
  }

  if (view === 'analytics') {
    return <Analytics {...viewProps} />;
  }

  if (view === 'budgets') {
    return <Budgets {...viewProps} />;
  }

  if (view === 'new_transaction') {
    return <NewTransaction {...viewProps} />;
  }

  if (view === 'settings') {
    return <Settings {...viewProps} />;
  }

  if (view === 'account_management') {
    return <AccountManagement {...viewProps} />;
  }

  if (view === 'category_management') {
    return <CategoryManagement {...viewProps} />;
  }

  if (view === 'party_management') {
    return <PartyManagement {...viewProps} />;
  }

  if (view === 'tag_management') {
    return <TagManagement {...viewProps} />;
  }

  return null;
}
