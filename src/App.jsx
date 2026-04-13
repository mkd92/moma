import { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';

// Modular Imports
import { PATH_VIEWS, VIEW_PATHS } from './constants';
import { useAuth, useAppDataOrchestrator as useAppData, useTransactionForm, AppDataProvider } from './hooks';
import ToastContainer from './components/layout/ToastContainer';
import Sidebar from './components/layout/Sidebar';
import TopHeader from './components/layout/TopHeader';
import BottomNav from './components/layout/BottomNav';
import { ScrollIndicator } from './components/layout';

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
  
  // Stabilize view computation
  const view = useMemo(() => PATH_VIEWS[pathname] || 'landing', [pathname]);
  
  const setView = useCallback((v) => {
    const path = VIEW_PATHS[v] || '/';
    if (window.location.pathname !== path) {
      navigate(path);
    }
  }, [navigate]);

  // --- Theme Logic ---
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('moma-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return 'light';
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
  const auth = useAuth();
  const { session, handleLogout, isLoading: authIsLoading } = auth;

  // --- App Data Hook ---
  const appData = useAppData(session, navigate, pathname, authIsLoading);

  // --- Transaction Form Hook ---
  const txForm = useTransactionForm(session, appData.accounts, appData.categories, appData.transactions, appData.defaultAccountId, appData.fetchTransactions, setView, appData.resetFilters);

  // --- Global Navigation Props ---
  const shellProps = useMemo(() => ({
    view,
    onDashboard: () => setView('dashboard'),
    onLedger: () => { txForm.resetForm(); setView('ledger'); },
    onAnalytics: () => setView('analytics'),
    onBudgets: () => setView('budgets'),
    onNewTx: () => { txForm.resetForm(); setView('new_transaction'); },
    onSettings: () => setView('settings'),
    onAccounts: () => setView('account_management'),
    onCategories: () => setView('category_management'),
    onPayees: () => setView('party_management'),
    onTags: () => setView('tag_management'),
    onLogout: handleLogout,
    session,
    onRefresh: appData.refreshData,
    theme,
    onToggleTheme: toggleTheme,
    collapsed,
    setCollapsed: handleSetCollapsed
  }), [view, setView, txForm.resetForm, handleLogout, session, appData.refreshData, theme, toggleTheme, collapsed, handleSetCollapsed]);

  // --- Global keyboard shortcuts ---
  useEffect(() => {
    const handler = (e) => {
      // Alt+N → new transaction (skip if typing in an input/textarea)
      if (e.altKey && e.key === 'n') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        txForm.resetForm();
        setView('new_transaction');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [txForm.resetForm, setView]);

  // --- Context Value ---
  const contextValue = useMemo(() => ({
    ...appData,
    ...txForm,
    shellProps,
    setView,
    navToLedger: () => { txForm.resetForm(); setView('ledger'); },
    navToAnalytics: () => setView('analytics'),
    navToDashboard: () => setView('dashboard'),
  }), [appData, txForm, shellProps, setView]);

  // --- View Selection ---
  const renderViewContent = () => {
    switch (view) {
      case 'dashboard': return <Dashboard />;
      case 'ledger': return <Ledger />;
      case 'analytics': return <Analytics />;
      case 'budgets': return <Budgets />;
      case 'new_transaction': return <NewTransaction />;
      case 'settings': return <Settings />;
      case 'account_management': return <AccountManagement />;
      case 'category_management': return <CategoryManagement />;
      case 'party_management': return <PartyManagement />;
      case 'tag_management': return <TagManagement />;
      default: return null;
    }
  };

  if (view === 'landing') {
    return (
      <Suspense fallback={<ViewLoader />}>
        <Landing session={session} setView={setView} />
      </Suspense>
    );
  }

  if (view === 'auth') {
    return (
      <Suspense fallback={<ViewLoader />}>
        <AuthView 
          authMode={auth.authMode} setAuthMode={auth.setAuthMode}
          email={auth.email} setEmail={auth.setEmail}
          password={auth.password} setPassword={auth.setPassword}
          authLoading={auth.authLoading} authError={auth.authError} setAuthError={auth.setAuthError}
          handleAuth={auth.handleAuth} handleGoogleSignIn={auth.handleGoogleSignIn}
          setView={setView}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<ViewLoader />}>
      <AppDataProvider value={contextValue}>
        <div className="app-shell">
          <div className="page-content">
            <TopHeader session={session} theme={theme} onToggleTheme={toggleTheme} collapsed={false} />
            <div className="flex-1 w-full flex flex-col min-h-0 relative">
              {renderViewContent()}
            </div>
          </div>
          <BottomNav
            view={view}
            onDashboard={shellProps.onDashboard}
            onLedger={shellProps.onLedger}
            onAnalytics={shellProps.onAnalytics}
            onSettings={shellProps.onSettings}
            onNewTx={shellProps.onNewTx}
            onAccounts={shellProps.onAccounts}
            onCategories={shellProps.onCategories}
            onPayees={shellProps.onPayees}
            onTags={shellProps.onTags}
          />
          <ScrollIndicator />
        </div>
        <ToastContainer />
      </AppDataProvider>
    </Suspense>
  );
}
