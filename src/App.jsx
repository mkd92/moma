import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';

// Modular Imports
import { PATH_VIEWS, VIEW_PATHS } from './constants';
import { useAuth, useAppData, useTransactionForm } from './hooks';

// Lazy-loaded Views
const Landing = lazy(() => import('./views/Landing'));
const AuthView = lazy(() => import('./views/AuthView'));
const Dashboard = lazy(() => import('./views/Dashboard'));
const Ledger = lazy(() => import('./views/Ledger'));
const Analytics = lazy(() => import('./views/Analytics'));
const Budgets = lazy(() => import('./views/Budgets'));
const NewTransaction = lazy(() => import('./views/NewTransaction'));
const Settings = lazy(() => import('./views/Settings'));
const AccountManagement = lazy(() => import('./views/Management/AccountManagement'));
const CategoryManagement = lazy(() => import('./views/Management/CategoryManagement'));
const PartyManagement = lazy(() => import('./views/Management/PartyManagement'));
const TagManagement = lazy(() => import('./views/Management/TagManagement'));

// Loading fallback component
const ViewLoader = () => (
  <div className="min-h-screen bg-surface flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-primary/10 border-t-primary rounded-full animate-spin"></div>
  </div>
);

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

  // --- Persistent Sidebar State ---
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('moma-sidebar-collapsed');
    return saved === 'true';
  });

  const handleSetCollapsed = useCallback((val) => {
    setCollapsed(val);
    localStorage.setItem('moma-sidebar-collapsed', val);
  }, []);

  // --- Auth Hook ---
  const { 
    session, authMode, setAuthMode, email, setEmail, password, setPassword,
    authLoading, authError, setAuthError, handleAuth, handleGoogleSignIn, handleLogout 
  } = useAuth(setView);

  // --- App Data Hook ---
  const appData = useAppData(session, navigate, pathname);
  const {
    transactions, categories, parties, accounts, tags, budgets,
    currencySymbol, currencyCode, setCurrencyCode, defaultAccountId, setDefaultAccountId,
    fetchTransactions, fetchAccounts, refreshData,
    handleCreateCategory, handleDeleteCategory, handleCreateParty, handleDeleteParty,
    handleDeleteTransaction, handleCreateTag, handleDeleteTag, handleCreateAccount,
    handleDeleteAccount, handleUpdateAccount, handleSetDefaultAccount, handleSaveBudget,
    handleBulkAssignCategory,
    updateFilter, resetFilters, applyDatePreset,
    showAdvancedFilters, setShowAdvancedFilters, showAnalyticsFilters, setShowAnalyticsFilters,
    settingsType, setSettingsType,
    selectedTxIds, setSelectedTxIds, bulkSelectMode, setBulkSelectMode, bulkCategory, setBulkCategory
  } = appData;

  // --- Transaction Form Hook ---
  const txForm = useTransactionForm(session, accounts, categories, transactions, defaultAccountId, fetchTransactions, setView);
  const {
    txToEdit, resetForm, openEditTransaction, handleTransaction
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
    onToggleTheme: toggleTheme,
    collapsed,
    setCollapsed: handleSetCollapsed
  };

  // --- View Selection ---
  const renderView = () => {
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
      onDelete: handleDeleteTransaction,
      navToLedger: () => { resetForm(); setView('ledger'); },
      navToAnalytics: () => setView('analytics'),
      navToDashboard: () => setView('dashboard'),
      setView,
      showAdvancedFilters,
      setShowFilters: setShowAdvancedFilters,
      showAnalyticsFilters,
      setShowAnalyticsFilters,
      settingsType,
      setSettingsType,
      updateFilter,
      resetFilters,
      applyDatePreset,
      selectedTxIds,
      setSelectedTxIds,
      bulkSelectMode,
      setBulkSelectMode,
      bulkCategory,
      setBulkCategory,
      handleBulkAssignCategory
    };

    switch (view) {
      case 'dashboard': return <Dashboard {...viewProps} />;
      case 'ledger': return <Ledger {...viewProps} />;
      case 'analytics': return <Analytics {...viewProps} />;
      case 'budgets': return <Budgets {...viewProps} />;
      case 'new_transaction': return <NewTransaction {...viewProps} />;
      case 'settings': return <Settings {...viewProps} />;
      case 'account_management': return <AccountManagement {...viewProps} />;
      case 'category_management': return <CategoryManagement {...viewProps} />;
      case 'party_management': return <PartyManagement {...viewProps} />;
      case 'tag_management': return <TagManagement {...viewProps} />;
      default: return null;
    }
  };

  return (
    <Suspense fallback={<ViewLoader />}>
      {renderView()}
    </Suspense>
  );
}
