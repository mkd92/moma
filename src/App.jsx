import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Line, LabelList } from 'recharts';
import { supabase } from './supabaseClient';
import { cacheGet, cacheSet, cacheClear } from './cache';
import CustomDropdown from './components/CustomDropdown';
import './App.css';

// Constant outside component — not recreated on every render
const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };

const ACCT_META = {
  asset: { icon: '🏦', label: 'Asset', color: 'var(--secondary)' },
  liability: { icon: '💳', label: 'Liability', color: 'var(--tertiary-fixed-variant)' },
  temp: { icon: '⏳', label: 'Temp', color: 'var(--on-surface-variant)' },
};

// Route ↔ view name maps
const VIEW_PATHS = {
  landing: '/', auth: '/auth', dashboard: '/dashboard', ledger: '/ledger',
  new_transaction: '/transaction/new', analytics: '/analytics', budgets: '/budgets',
  settings: '/settings', account_management: '/settings/accounts',
  category_management: '/settings/categories', party_management: '/settings/parties',
  tag_management: '/settings/tags',
};
const PATH_VIEWS = Object.fromEntries(Object.entries(VIEW_PATHS).map(([k, v]) => [v, k]));

// Module-level date formatter for transaction grouping
const formatGroupDate = (dateStr) => {
  if (!dateStr || dateStr === 'Unknown') return 'Unknown Date';
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

// Pull-to-refresh hook (uses native listeners to allow preventDefault on touchmove)
const usePullToRefresh = (onRefresh) => {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);
  const state = useRef({ startY: null, pullY: 0, active: false });
  const THRESHOLD = 72;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchStart = (e) => {
      if (el.scrollTop === 0) {
        state.current.startY = e.touches[0].clientY;
        state.current.active = true;
      }
    };
    const onTouchMove = (e) => {
      if (!state.current.active) return;
      const dy = e.touches[0].clientY - state.current.startY;
      if (dy > 0 && el.scrollTop === 0) {
        e.preventDefault();
        const clamped = Math.min(dy * 0.5, THRESHOLD + 20);
        state.current.pullY = clamped;
        setPullY(clamped);
      } else if (dy <= 0) {
        state.current.active = false;
        state.current.pullY = 0;
        setPullY(0);
      }
    };
    const onTouchEnd = async () => {
      if (!state.current.active) return;
      state.current.active = false;
      const pulled = state.current.pullY;
      state.current.pullY = 0;
      setPullY(0);
      if (pulled >= THRESHOLD) {
        setRefreshing(true);
        try { await onRefresh(); } finally { setRefreshing(false); }
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh]);

  return { containerRef, pullY, refreshing };
};

// Bottom navigation bar — mobile only
const BottomNav = ({ view, onDashboard, onLedger, onAnalytics, onSettings, onNewTx }) => {
  const settingsViews = ['settings', 'account_management', 'category_management', 'party_management', 'tag_management'];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-[#0e0e0e]/80 backdrop-blur-xl border-none shadow-[0_-24px_48px_rgba(0,0,0,0.4)] rounded-t-3xl">
      <button className={`flex flex-col items-center justify-center transition-all duration-300 ease-out ${view === 'dashboard' ? 'text-[#3fff8b] font-bold scale-110' : 'text-zinc-500'}`} onClick={onDashboard}>
        <span className="material-symbols-outlined">home</span>
        <span className="font-['Inter'] text-[10px] uppercase tracking-[0.05em] mt-1">Home</span>
      </button>
      <button className={`flex flex-col items-center justify-center transition-all duration-300 ease-out ${view === 'ledger' ? 'text-[#3fff8b] font-bold scale-110' : 'text-zinc-500'}`} onClick={onLedger}>
        <span className="material-symbols-outlined">list_alt</span>
        <span className="font-['Inter'] text-[10px] uppercase tracking-[0.05em] mt-1">History</span>
      </button>
      <button className="flex flex-col items-center justify-center bg-[#3fff8b] text-[#005d2c] w-12 h-12 rounded-2xl shadow-lg active:scale-95 transition-transform -translate-y-4" onClick={onNewTx}>
        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>add</span>
      </button>
      <button className={`flex flex-col items-center justify-center transition-all duration-300 ease-out ${view === 'analytics' ? 'text-[#3fff8b] font-bold scale-110' : 'text-zinc-500'}`} onClick={onAnalytics}>
        <span className="material-symbols-outlined">pie_chart</span>
        <span className="font-['Inter'] text-[10px] uppercase tracking-[0.05em] mt-1">Charts</span>
      </button>
      <button className={`flex flex-col items-center justify-center transition-all duration-300 ease-out ${settingsViews.includes(view) ? 'text-[#3fff8b] font-bold scale-110' : 'text-zinc-500'}`} onClick={onSettings}>
        <span className="material-symbols-outlined">manage_accounts</span>
        <span className="font-['Inter'] text-[10px] uppercase tracking-[0.05em] mt-1">Settings</span>
      </button>
    </nav>
  );
};

const CATEGORY_ICONS = {
  'Food': 'restaurant',
  'Dining': 'restaurant',
  'Grocery': 'shopping_cart',
  'Shopping': 'shopping_bag',
  'Transport': 'directions_car',
  'Travel': 'flight',
  'Entertainment': 'movie',
  'Health': 'medical_services',
  'Insurance': 'shield',
  'Utilities': 'bolt',
  'Rent': 'home',
  'Salary': 'payments',
  'Income': 'add_card',
  'Investment': 'trending_up',
  'Gift': 'redeem',
  'Education': 'school',
  'Personal': 'person',
  'Family': 'family_restroom',
  'Other': 'more_horiz',
  'Transfer': 'sync_alt'
};

const getCategoryIcon = (catName) => CATEGORY_ICONS[catName] || 'label';

// Transaction item component for consistency
const TransactionItem = ({ t, onClick, onDelete, accounts, categories, currencySymbol, isSelected, bulkSelectMode, onToggleSelect }) => {
  const cat = categories.find(c => c.id === t.category_id);
  const amt = t.amount || 0;
  const isNeg = t.type === 'expense';
  const isTransfer = !!t.transfer_id;
  const icon = isTransfer ? 'sync_alt' : getCategoryIcon(cat?.name || 'Other');
  
  return (
    <div 
      className={`active:scale-[0.98] transition-all bg-surface-container p-4 rounded-xl flex items-center gap-4 cursor-pointer border border-outline-variant/10 ${isSelected ? 'ring-2 ring-[#3fff8b] bg-[#3fff8b]/5' : ''}`}
      onClick={() => bulkSelectMode && !isTransfer ? onToggleSelect(t.id) : onClick(t)}
    >
      {bulkSelectMode && !isTransfer && (
        <div 
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#3fff8b] border-[#3fff8b]' : 'border-zinc-700'}`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(t.id); }}
        >
          {isSelected && <span className="material-symbols-outlined text-[#005d2c] text-xs font-bold">check</span>}
        </div>
      )}
      <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[#3fff8b]">{icon}</span>
      </div>
      <div className="flex-1 min-width-0">
        <div className="flex justify-between items-baseline gap-2">
          <h3 className="font-bold text-[#ffffff] text-sm truncate">{t.note || cat?.name || (isTransfer ? 'Transfer' : 'Transaction')}</h3>
          <span className={`font-['Manrope'] font-extrabold whitespace-nowrap ${isNeg ? 'text-[#ff716c]' : 'text-[#3fff8b]'}`}>
            {isTransfer ? '⇄' : (isNeg ? '-' : '+')} {currencySymbol}{Math.abs(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-on-surface-variant truncate">{cat?.name || (isTransfer ? 'Transfer' : 'General')}</p>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-tighter whitespace-nowrap">
              {t.transaction_date || t.created_at?.split('T')[0]}
            </p>
            {!bulkSelectMode && onDelete && (
              <button 
                className="text-zinc-600 hover:text-[#ff716c] transition-colors"
                onClick={(e) => { e.stopPropagation(); onDelete(t, e); }}
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-views that support swipe-back gesture
const SUB_VIEWS = new Set(['new_transaction', 'account_management', 'category_management', 'party_management', 'tag_management']);

// Sidebar — desktop left-rail navigation
const Sidebar = ({ view, onDashboard, onLedger, onAnalytics, onBudgets, onNewTx, onSettings, onLogout, collapsed, setCollapsed }) => {
  const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', onClick: onDashboard, icon: 'dashboard' },
    { key: 'ledger', label: 'Transactions', onClick: onLedger, icon: 'receipt_long' },
    { key: 'analytics', label: 'Analytics', onClick: onAnalytics, icon: 'insights' },
    { key: 'budgets', label: 'Budgets', onClick: onBudgets, icon: 'account_balance_wallet' },
  ];
  return (
    <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-screen transition-all duration-300 border-r border-zinc-800/15 bg-[#131313] z-[60] ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-8">
        {!collapsed && <span className="text-[#3fff8b] font-bold font-headline text-xl tracking-tight">Editorial Finance</span>}
        {collapsed && <span className="text-[#3fff8b] font-bold font-headline text-xl">EF</span>}
        {!collapsed && <p className="text-zinc-500 text-[10px] mt-1 uppercase tracking-widest font-label font-bold">Premium Tier</p>}
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all w-full ${view === item.key ? 'text-[#3fff8b] font-bold bg-emerald-500/5 border-r-2 border-[#3fff8b]' : 'text-zinc-400 hover:bg-zinc-900'}`}
            onClick={item.onClick}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {!collapsed && <span className="font-['Manrope'] text-sm tracking-wide">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 space-y-2 border-t border-zinc-800/15">
        <button
          className={`flex items-center gap-4 px-4 py-3 rounded-xl w-full text-zinc-400 hover:bg-zinc-900 transition-all`}
          onClick={onSettings}
        >
          <span className="material-symbols-outlined">settings</span>
          {!collapsed && <span className="font-['Manrope'] text-sm tracking-wide">Settings</span>}
        </button>
        <button
          className={`flex items-center gap-4 px-4 py-3 rounded-xl w-full text-zinc-400 hover:bg-zinc-900 transition-all`}
          onClick={onLogout}
        >
          <span className="material-symbols-outlined">logout</span>
          {!collapsed && <span className="font-['Manrope'] text-sm tracking-wide">Logout</span>}
        </button>
        <button 
          className="mt-4 w-full bg-[#3fff8b] text-[#005d2c] py-3 rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
          onClick={onNewTx}
        >
          <span className="material-symbols-outlined">add</span>
          {!collapsed && <span>New Transaction</span>}
        </button>
      </div>
      
      <button 
        className="absolute -right-3 top-1/2 bg-[#131313] border border-zinc-800/15 rounded-full p-1 text-zinc-500 hover:text-white"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
          {collapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>
    </aside>
  );
};

const TopHeader = ({ session, theme, onToggleTheme, collapsed }) => (
  <nav className={`fixed top-0 right-0 left-0 z-50 flex justify-between items-center px-6 h-16 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300 ${collapsed ? 'md:left-20' : 'md:left-64'}`}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1a1a1a] border border-white/5 flex items-center justify-center">
        {session?.user?.email ? (
          <div className="w-full h-full bg-[#3fff8b] text-[#005d2c] flex items-center justify-center font-bold text-xs">
            {session.user.email.charAt(0).toUpperCase()}
          </div>
        ) : (
          <span className="material-symbols-outlined text-zinc-500" style={{ fontSize: '20px' }}>person</span>
        )}
      </div>
      <span className="font-['Manrope'] font-bold text-xl tracking-tight text-[#3fff8b]">Editorial Finance</span>
    </div>
    <div className="flex items-center gap-2">
      <button className="p-2 text-zinc-400 hover:text-[#3fff8b] active:scale-95 transition-all" onClick={onToggleTheme}>
        <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
      </button>
      <button className="p-2 text-zinc-400 hover:text-[#3fff8b] active:scale-95 transition-all">
        <span className="material-symbols-outlined">search</span>
      </button>
    </div>
  </nav>
);

const PageShell = ({ children, view, onDashboard, onLedger, onAnalytics, onBudgets, onNewTx, onSettings, onLogout, session, onRefresh, theme, onToggleTheme }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { containerRef, pullY, refreshing } = usePullToRefresh(onRefresh || (() => Promise.resolve()));

  // Swipe-back: right-edge swipe on sub-views
  const canGoBack = SUB_VIEWS.has(view);
  const swipe = useRef({ startX: 0, startY: 0 });
  const handleSwipeTouchStart = useCallback((e) => {
    swipe.current.startX = e.touches[0].clientX;
    swipe.current.startY = e.touches[0].clientY;
  }, []);
  const handleSwipeTouchEnd = useCallback((e) => {
    if (!canGoBack) return;
    const dx = e.changedTouches[0].clientX - swipe.current.startX;
    const dy = Math.abs(e.changedTouches[0].clientY - swipe.current.startY);
    if (dx > 80 && dy < 80 && swipe.current.startX < 60) navigate(-1);
  }, [canGoBack, navigate]);

  return (
    <div
      className="app-shell"
      onTouchStart={handleSwipeTouchStart}
      onTouchEnd={handleSwipeTouchEnd}
    >
      <Sidebar 
        view={view} 
        onDashboard={onDashboard} 
        onLedger={onLedger} 
        onAnalytics={onAnalytics} 
        onBudgets={onBudgets} 
        onNewTx={onNewTx} 
        onSettings={onSettings} 
        onLogout={onLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div className={`page-content transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`} ref={containerRef}>
        {(pullY > 0 || refreshing) && (
          <div className="ptr-indicator" style={{ height: refreshing ? 48 : pullY }}>
            <div
              className={`ptr-spinner${refreshing ? '' : ' ptr-spinner-static'}`}
              style={!refreshing ? { transform: `rotate(${(pullY / 72) * 360}deg)` } : {}}
            />
          </div>
        )}
        <TopHeader session={session} theme={theme} onToggleTheme={onToggleTheme} collapsed={collapsed} />
        <main className="flex-1 w-full relative">
          {children}
        </main>
      </div>
      <BottomNav view={view} onDashboard={onDashboard} onLedger={onLedger} onAnalytics={onAnalytics} onSettings={onSettings} onNewTx={onNewTx} />
    </div>
  );
};

const AcctGroup = ({ title, accts, accountBalances, currencySymbol, onDelete, onEdit, onSetDefault, defaultAccountId }) => accts.length === 0 ? null : (
  <div style={{ marginBottom: '1.5rem' }}>
    <p className="label-sm" style={{ marginBottom: '0.75rem' }}>{title}</p>
    <div className="category-manager">
      {accts.map(acc => {
        const meta = ACCT_META[acc.type || 'asset'];
        const bal = accountBalances[acc.id] || 0;
        const isDefault = acc.id === defaultAccountId;
        return (
          <div key={acc.id} className="editorial-item">
            <div className="editorial-icon">{meta.icon}</div>
            <div className="editorial-info">
              <div className="editorial-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {acc.name}
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-low)', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{meta.label}</span>
                {acc.exclude_from_total && <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>excl.</span>}
                {isDefault && <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Default</span>}
              </div>
              <div className="editorial-meta">{currencySymbol}{bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              {!isDefault && <button className="icon-btn-text" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', color: '#f59e0b' }} title="Set as Default" onClick={() => onSetDefault(acc.id)}>☆</button>}
              {isDefault && <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', color: '#f59e0b' }}>★</span>}
              <button className="icon-btn-text" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }} onClick={() => onEdit(acc)}>✎</button>
              <button className="delete-btn" onClick={() => onDelete(acc.id)}>✕</button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const EmptyChart = ({ h = 280, msg = 'No data for this period' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: h, color: 'var(--on-surface-variant)', fontSize: '0.875rem', fontStyle: 'italic' }}>{msg}</div>
);

const AnalyticsTooltip = ({ active, payload, label, currencySymbol }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--ghost-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', boxShadow: 'var(--shadow-ambient)', fontFamily: 'Inter, sans-serif' }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{label}</p>
      {payload.filter(e => e.dataKey !== 'expenseMA').map((e, i) => (
        <p key={i} style={{ fontSize: '0.875rem', fontWeight: 600, color: e.color, margin: '0.15rem 0', fontFamily: 'Manrope, sans-serif' }}>{e.name}: {currencySymbol}{Number(e.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      ))}
    </div>
  );
};

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
            {/* Uncategorized sentinel chip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label className="filter-chip" style={{ cursor: 'pointer', justifyContent: 'flex-start', gap: '0.5rem', background: filterOptions.categoryIds.includes('__uncategorized__') ? 'var(--primary-light)' : 'var(--surface-container-lowest)', borderColor: filterOptions.categoryIds.includes('__uncategorized__') ? 'var(--primary)' : 'var(--ghost-border)' }}>
                <input type="checkbox" checked={filterOptions.categoryIds.includes('__uncategorized__')} onChange={() => toggleCategory('__uncategorized__')} style={{ display: 'none' }} />
                <span>•</span>
                <span style={{ fontWeight: 700 }}>Uncategorized</span>
              </label>
            </div>
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

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const view = PATH_VIEWS[pathname] || 'landing';
  const setView = useCallback((v) => navigate(VIEW_PATHS[v] || '/'), [navigate]);

  // Auto-reload when a new service worker version is available

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

  const [session, setSession] = useState(null);
  const userIdRef = useRef(null);

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

  // Category Manager State
  const [settingsType, setSettingsType] = useState('expense');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🔖');
  const [newCatParent, setNewCatParent] = useState('');
  const [editingCat, setEditingCat] = useState(null);

  // Account Manager State
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('0');
  const [newAccountType, setNewAccountType] = useState('asset');
  const [newAccountExclude, setNewAccountExclude] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editAcctName, setEditAcctName] = useState('');
  const [editAcctMode, setEditAcctMode] = useState('opening'); // 'opening' | 'current'
  const [editAcctValue, setEditAcctValue] = useState('');

  // Party Manager State
  const [newPartyName, setNewPartyName] = useState('');

  // Tag Manager State
  const [newTagName, setNewTagName] = useState('');

  // Budget Form State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ id: null, category_id: null, amount_limit: '', period: 'monthly' });

  // Filter State
  const [showAdvancedFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    type: 'all', dateRange: { start: '', end: '' },
    categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'all'
  });

  // Ledger sort: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
  const [ledgerSort, setLedgerSort] = useState('date_desc');

  // Bulk selection state (ledger)
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState(null);

  // Dashboard period filter
  const [dashPeriod, setDashPeriod] = useState('this_month');

  // Analytics filter state
  const [analyticsFilters, setAnalyticsFilters] = useState({
    type: 'all', dateRange: { start: '', end: '' },
    categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'this_month'
  });
  const [showAnalyticsFilters, setShowAnalyticsFilters] = useState(false);
  const [drillCategory, setDrillCategory] = useState(null);
  const [catBreakdownType, setCatBreakdownType] = useState('expense');

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) { setCategories(data); if (userIdRef.current) cacheSet(userIdRef.current, 'categories', data); }
  }, []);

  const fetchParties = useCallback(async () => {
    const { data } = await supabase.from('parties').select('*').order('name');
    if (data) { setParties(data); if (userIdRef.current) cacheSet(userIdRef.current, 'parties', data); }
  }, []);

  const fetchTags = useCallback(async () => {
    const { data } = await supabase.from('tags').select('*').order('name');
    if (data) { setTags(data); if (userIdRef.current) cacheSet(userIdRef.current, 'tags', data); }
  }, []);

  const fetchAccounts = useCallback(async () => {
    const { data } = await supabase.from('accounts').select('*').order('name');
    if (data) { setAccounts(data); if (userIdRef.current) cacheSet(userIdRef.current, 'accounts', data); }
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

    // Hydrate from cache for instant render (stale-while-revalidate)
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

    // Fetch fresh data in background — updates state + cache when done
    await fetchProfile(activeSession);
    await Promise.all([fetchCategories(), fetchParties(), fetchAccounts(), fetchTags(), fetchTransactions(), fetchBudgets()]);
  }, [fetchProfile, fetchCategories, fetchParties, fetchAccounts, fetchTags, fetchTransactions, fetchBudgets]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        if (pathname === '/' || pathname === '/auth') navigate('/dashboard');
        fetchInitialData(session);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN') {
        if (pathname === '/' || pathname === '/auth') {
          navigate('/dashboard');
        }
        fetchInitialData(session);
      } else if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [pathname, navigate, fetchInitialData]);

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

  // Transactions for the active (non-excluded) accounts only — used for all financial metrics.
  // An account is active if: it's type 'asset' AND not explicitly excluded.
  // Temp and liability accounts are excluded from net worth by design.
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

  // Actions
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

  const handleLogout = useCallback(async () => {
    if (userIdRef.current) cacheClear(userIdRef.current);
    userIdRef.current = null;
    await supabase.auth.signOut();
  }, []);
  const handleGoogleSignIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  }, []);
  const navToDashboard = useCallback(() => setView('dashboard'), [setView]);
  const navToLedger = useCallback(() => { resetForm(); setView('ledger'); }, [resetForm, setView]);
  const navToAnalytics = useCallback(() => setView('analytics'), [setView]);
  const navToBudgets = useCallback(() => setView('budgets'), [setView]);
  const navToSettings = useCallback(() => setView('settings'), [setView]);
  const navToNewTx = useCallback(() => { resetForm(); setView('new_transaction'); }, [resetForm, setView]);
  const refreshData = useCallback(() => Promise.all([fetchTransactions(), fetchAccounts()]), [fetchTransactions, fetchAccounts]);

  // Navigate to ledger pre-filtered by a category ID + transaction type
  const navToLedgerByCategory = useCallback((categoryId, txType = 'expense') => {
    const childIds = categories.filter(c => c.parent_id === categoryId).map(c => c.id);
    const ids = [categoryId, ...childIds];
    setFilterOptions({ type: txType, dateRange: { start: '', end: '' }, categoryIds: ids, tagIds: [], accountIds: [], searchTerm: '', preset: 'all' });
    setView('ledger');
  }, [categories]);

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

  const handleTransaction = useCallback(async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || !session) return;

    if (txType === 'transfer') {
      if (!transferFromAccount || !transferToAccount || transferFromAccount === transferToAccount) return;
      const base = { amount: val, note: note.trim() || null, transaction_date: txDate, category_id: null, party_id: null };
      if (txToEdit?.transfer_id) {
        await supabase.from('transactions').update({ ...base, account_id: transferFromAccount }).eq('transfer_id', txToEdit.transfer_id).eq('type', 'expense');
        await supabase.from('transactions').update({ ...base, account_id: transferToAccount }).eq('transfer_id', txToEdit.transfer_id).eq('type', 'income');
      } else {
        if (txToEdit?.id && !txToEdit?.transfer_id) {
          await supabase.from('transaction_tags').delete().eq('transaction_id', txToEdit.id);
          await supabase.from('transactions').delete().eq('id', txToEdit.id);
        }
        const transferId = crypto.randomUUID();
        await supabase.from('transactions').insert([
          { ...base, type: 'expense', account_id: transferFromAccount, user_id: session.user.id, transfer_id: transferId },
          { ...base, type: 'income', account_id: transferToAccount, user_id: session.user.id, transfer_id: transferId },
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
  }, [amount, selectedSubcategory, selectedCategory, txType, selectedParty, selectedAccount, note, txDate, session, txToEdit, selectedTags, transferFromAccount, transferToAccount, resetForm, accounts, fetchTransactions, setView]);

  const handleCreateCategory = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !newCatName.trim()) return;
    const payload = { user_id: session.user.id, name: newCatName.trim(), type: settingsType, icon: newCatIcon, is_system: false, parent_id: newCatParent || null };
    let error;
    if (editingCat) {
      ({ error } = await supabase.from('categories').update(payload).eq('id', editingCat.id));
    } else {
      ({ error } = await supabase.from('categories').insert([payload]));
    }
    if (!error) {
      setNewCatName('');
      setNewCatParent('');
      setNewCatIcon('🔖');
      setEditingCat(null);
      fetchCategories();
    }
  }, [session, newCatName, settingsType, newCatIcon, newCatParent, editingCat, fetchCategories]);

  const handleDeleteCategory = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  }, [session, fetchCategories]);

  const handleCreateParty = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !newPartyName.trim()) return;
    const { error } = await supabase.from('parties').insert([{ user_id: session.user.id, name: newPartyName.trim() }]);
    if (!error) { setNewPartyName(''); fetchParties(); }
  }, [session, newPartyName, fetchParties]);

  const handleDeleteParty = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('parties').delete().eq('id', id);
    fetchParties();
  }, [session, fetchParties]);

  const handleDeleteTransaction = useCallback(async (t, e) => {
    e.stopPropagation();
    if (!session) return;
    if (!window.confirm(`Delete this ${t.transfer_id ? 'transfer' : t.type} of ${currencySymbol}${parseFloat(t.amount).toFixed(2)}?`)) return;
    if (t.transfer_id) {
      await supabase.from('transactions').delete().eq('transfer_id', t.transfer_id);
    } else {
      await supabase.from('transaction_tags').delete().eq('transaction_id', t.id);
      await supabase.from('transactions').delete().eq('id', t.id);
    }
    fetchTransactions();
  }, [session, currencySymbol]);

  const handleCreateTag = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !newTagName.trim()) return;
    const { error } = await supabase.from('tags').insert([{ user_id: session.user.id, name: newTagName.trim().toLowerCase() }]);
    if (!error) { setNewTagName(''); fetchTags(); }
  }, [session, newTagName, fetchTags]);

  const handleDeleteTag = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('tags').delete().eq('id', id);
    fetchTags();
  }, [session, fetchTags]);

  const handleCreateAccount = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !newAccountName.trim()) return;
    const base = { user_id: session.user.id, name: newAccountName.trim(), initial_balance: parseFloat(newAccountBalance) || 0 };
    let { error } = await supabase.from('accounts').insert([{ ...base, type: newAccountType, exclude_from_total: newAccountExclude }]);
    // Fall back if migration hasn't been applied yet (columns don't exist)
    if (error?.code === '42703') {
      ({ error } = await supabase.from('accounts').insert([base]));
    }
    if (!error) {
      setNewAccountName('');
      setNewAccountBalance('');
      setNewAccountType('asset');
      setNewAccountExclude(false);
      fetchAccounts();
    } else {
      console.error('Account creation failed:', error.message);
      alert(`Could not save account: ${error.message}`);
    }
  }, [session, newAccountName, newAccountBalance, newAccountType, newAccountExclude, fetchAccounts]);

  const handleDeleteAccount = useCallback(async (id) => {
    if (!session) return;
    await supabase.from('accounts').delete().eq('id', id);
    fetchAccounts();
  }, [session, fetchAccounts]);

  const openEditAccount = useCallback((acct) => {
    setEditingAccount(acct);
    setEditAcctName(acct.name);
    setEditAcctMode('opening');
    setEditAcctValue(String(parseFloat(acct.initial_balance) || 0));
    setEditAcctExclude(!!acct.exclude_from_total);
  }, []);

  const [editAcctExclude, setEditAcctExclude] = useState(false);

  const handleUpdateAccount = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !editingAccount) return;
    let newInitialBalance;
    if (editAcctMode === 'opening') {
      newInitialBalance = parseFloat(editAcctValue) || 0;
    } else {
      // Derive opening balance: opening = desired_current - transactions_sum
      const txSum = (accountBalances[editingAccount.id] || 0) - (parseFloat(editingAccount.initial_balance) || 0);
      newInitialBalance = (parseFloat(editAcctValue) || 0) - txSum;
    }
    const { error } = await supabase.from('accounts').update({ name: editAcctName.trim(), initial_balance: newInitialBalance, exclude_from_total: editAcctExclude }).eq('id', editingAccount.id);
    if (!error) {
      setEditingAccount(null);
      fetchAccounts();
    }
  }, [session, editingAccount, editAcctName, editAcctMode, editAcctValue, editAcctExclude, accountBalances, fetchAccounts]);

  const handleSetDefaultAccount = useCallback(async (accountId) => {
    if (!session) return;
    const { error } = await supabase.from('profiles')
      .update({ default_account_id: accountId }).eq('id', session.user.id);
    if (!error) setDefaultAccountId(accountId);
  }, [session]);

  const handleBulkAssignCategory = useCallback(async () => {
    if (!session || selectedTxIds.size === 0 || !bulkCategory) return;
    await Promise.all([...selectedTxIds].map(id =>
      supabase.from('transactions').update({ category_id: bulkCategory }).eq('id', id)
    ));
    setBulkSelectMode(false);
    setSelectedTxIds(new Set());
    setBulkCategory(null);
    fetchTransactions();
  }, [session, selectedTxIds, bulkCategory]);

  const handleSaveBudget = useCallback(async (e) => {
    e.preventDefault();
    if (!session || !budgetForm.amount_limit) return;
    const my = new Date().toISOString().slice(0, 7);
    const payload = { user_id: session.user.id, category_id: budgetForm.category_id || null, limit_amount: parseFloat(budgetForm.amount_limit), month_year: my };
    if (budgetForm.id) await supabase.from('budgets').update(payload).eq('id', budgetForm.id);
    else await supabase.from('budgets').insert([payload]);
    setShowBudgetModal(false);
    fetchBudgets();
  }, [session, budgetForm, fetchBudgets]);

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
      // Always exclude transactions from exempted accounts
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
      return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
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
        return { ...d, expenseMA: sum / window.length };
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
      // Track subcategory if this transaction belongs to a child category
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
        const amountStr = parseFloat(t.amount).toFixed(2);
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
      // Single synthetic group — no date header needed; use null key
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
  }, [transactions, accounts, setView]);

  const shellProps = { view, onDashboard: navToDashboard, onLedger: navToLedger, onAnalytics: navToAnalytics, onBudgets: navToBudgets, onNewTx: navToNewTx, onSettings: navToSettings, onLogout: handleLogout, session, onRefresh: refreshData, theme, onToggleTheme: toggleTheme };

  if (view === 'landing') return (
    <div className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center p-8 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#3fff8b]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#6e9bff]/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative z-10 max-w-xl text-center space-y-12 fade-in">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a] border border-white/5 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#3fff8b] animate-pulse"></span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">The Digital Ledger</span>
          </div>
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-[1.1]">
            Architectural Clarity for <span className="text-[#3fff8b]">Wealth.</span>
          </h1>
          <p className="text-zinc-500 font-medium text-lg md:text-xl max-w-md mx-auto leading-relaxed">
            A premium financial ecosystem designed for the modern era of asset management.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button 
            className="w-full md:w-auto px-12 py-5 bg-gradient-to-br from-[#3fff8b] to-[#13ea79] text-[#005d2c] rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(63,255,139,0.2)] active:scale-95 transition-all hover:brightness-110"
            onClick={() => session ? setView('dashboard') : setView('auth')}
          >
            Enter Vault
          </button>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">End-to-End Encrypted · Open Source</p>
        </div>
      </div>
    </div>
  );

  if (view === 'auth') return (
    <div className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#3fff8b]/5 rounded-full blur-[150px]"></div>
      
      <div className="w-full max-w-md space-y-8 relative z-10 fade-in">
        <div className="flex flex-col items-center gap-4">
          <button 
            className="self-start flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest" 
            onClick={() => setView('landing')}
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>
          <div className="w-16 h-16 rounded-[1.5rem] bg-[#1a1a1a] flex items-center justify-center border border-white/5 shadow-2xl">
            <span className="material-symbols-outlined text-[#3fff8b] text-3xl">token</span>
          </div>
          <h2 className="font-headline text-3xl font-extrabold text-white tracking-tight">Access Digital Ledger</h2>
        </div>

        <div className="bg-[#131313] p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl space-y-8">
          <div className="flex bg-[#0e0e0e] p-1.5 rounded-xl gap-1">
            <button 
              className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-[#3fff8b] text-[#005d2c] shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`} 
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
            >
              Log In
            </button>
            <button 
              className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${authMode === 'signup' ? 'bg-[#3fff8b] text-[#005d2c] shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`} 
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Email</p>
              <input 
                type="email" 
                placeholder="email@vault.com" 
                className="w-full bg-[#1a1a1a] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/30 transition-all text-sm font-medium"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Password</p>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-[#1a1a1a] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/30 transition-all text-sm font-medium"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            {authError && (
              <div className="p-4 bg-[#ff716c]/10 rounded-xl border border-[#ff716c]/20 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ff716c] text-sm">error</span>
                <p className="text-[10px] font-bold text-[#ff716c] uppercase tracking-wider leading-relaxed">{authError}</p>
              </div>
            )}
            <button 
              type="submit" 
              className="w-full bg-[#3fff8b] text-[#005d2c] py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 mt-4" 
              disabled={authLoading}
            >
              {authLoading ? 'Verifying...' : authMode === 'login' ? 'Enter Vault' : 'Initialize Account'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#131313] px-4 text-zinc-600 font-bold tracking-widest">Or Secure Link</span></div>
          </div>

          <button 
            type="button" 
            className="w-full bg-[#1a1a1a] text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-white/5 hover:bg-[#262626] transition-all active:scale-[0.98]" 
            onClick={handleGoogleSignIn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );

  if (view === 'settings' || view === 'account_management' || view === 'category_management' || view === 'party_management' || view === 'tag_management') {
    let settingsContent;
    let acctEditModal = null;
    const pillLight = 'theme-pill-option' + (theme === 'light' ? ' active' : '');
    const pillDark = 'theme-pill-option' + (theme === 'dark' ? ' active' : '');
    const currencyOptions = Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => ({ value: code, label: code + ' (' + sym + ')' }));
    if (view === 'settings') settingsContent = (
      <div className="page-inner fade-in">
        <div className="section-header-row"><h2 className="section-title-editorial">Settings</h2></div>
        <div className="settings-panel">
          <div className="settings-section">
            <p className="label-sm">Preferences</p>
            <div className="settings-group">
              <div className="settings-card">
                <span className="sc-text">Currency</span>
                <div style={{ width: '180px' }}>
                  <CustomDropdown options={currencyOptions} value={currencyCode} onChange={setCurrencyCode} showSearch={false} />
                </div>
              </div>
              <div className="settings-card">
                <span className="sc-text">Appearance</span>
                <button className="theme-pill-toggle" onClick={toggleTheme}>
                  <span className={pillLight}><SunIcon />Light</span>
                  <span className={pillDark}><MoonIcon />Dark</span>
                </button>
              </div>
            </div>
          </div>
          <div className="settings-section">
            <p className="label-sm">Manage</p>
            <div className="settings-group">
              <button className="settings-nav-btn" onClick={() => setView('account_management')}>Accounts <span className="arrow">&#8250;</span></button>
              <button className="settings-nav-btn" onClick={() => setView('category_management')}>Categories <span className="arrow">&#8250;</span></button>
              <button className="settings-nav-btn" onClick={() => setView('party_management')}>Parties <span className="arrow">&#8250;</span></button>
              <button className="settings-nav-btn" onClick={() => setView('tag_management')}>Tags <span className="arrow">&#8250;</span></button>
            </div>
          </div>
          <div className="settings-section">
            <p className="label-sm">Account</p>
            <div className="settings-group">
              <div className="settings-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                <span className="label-sm">Signed in as</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--on-surface)', fontWeight: 500 }}>{session?.user?.email}</span>
              </div>
            </div>
            <button className="settings-logout-btn" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
    else if (view === 'account_management') {
      const assetAccts = accounts.filter(a => (a.type || 'asset') === 'asset');
      const liabilityAccts = accounts.filter(a => a.type === 'liability');
      const tempAccts = accounts.filter(a => a.type === 'temp');
      const editAcctCurrentBalance = editingAccount
        ? (() => {
          const txSum = (accountBalances[editingAccount.id] || 0) - (parseFloat(editingAccount.initial_balance) || 0);
          if (editAcctMode === 'opening') {
            return txSum + (parseFloat(editAcctValue) || 0);
          } else {
            return parseFloat(editAcctValue) || 0;
          }
        })()
        : 0;
      const editAcctDerivedOpening = editingAccount && editAcctMode === 'current'
        ? (() => {
          const txSum = (accountBalances[editingAccount.id] || 0) - (parseFloat(editingAccount.initial_balance) || 0);
          return (parseFloat(editAcctValue) || 0) - txSum;
        })()
        : null;
      if (editingAccount) {
        acctEditModal = createPortal(
          <div className="modal-overlay" onClick={() => setEditingAccount(null)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
              <h3 className="headline-md">Edit Account</h3>
              <form onSubmit={handleUpdateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                <div className="category-selection-area">
                  <p className="label-sm">Account Name</p>
                  <input type="text" className="text-input" value={editAcctName} onChange={e => setEditAcctName(e.target.value)} required />
                </div>
                <div className="category-selection-area">
                  <p className="label-sm">Balance Mode</p>
                  <div className="type-toggle-bar" style={{ marginTop: '0.5rem' }}>
                    <button type="button" className={`type-btn ${editAcctMode === 'opening' ? 'active-transfer' : ''}`} onClick={() => { setEditAcctMode('opening'); setEditAcctValue(String(parseFloat(editingAccount.initial_balance) || 0)); }}>Opening Balance</button>
                    <button type="button" className={`type-btn ${editAcctMode === 'current' ? 'active-transfer' : ''}`} onClick={() => { setEditAcctMode('current'); setEditAcctValue(String(accountBalances[editingAccount.id] || 0)); }}>Current Balance</button>
                  </div>
                </div>
                <div className="category-selection-area">
                  <p className="label-sm">{editAcctMode === 'opening' ? 'Opening Balance' : 'Set Current Balance'}</p>
                  <input type="number" step="0.01" className="text-input" value={editAcctValue} onChange={e => setEditAcctValue(e.target.value)} required />
                </div>
                <div style={{ background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {editAcctMode === 'opening' ? (
                    <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                      Resulting current balance: <strong style={{ color: 'var(--on-surface)' }}>{currencySymbol}{editAcctCurrentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </p>
                  ) : (
                    <>
                      <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                        Calculated opening balance: <strong style={{ color: 'var(--on-surface)' }}>{currencySymbol}{editAcctDerivedOpening.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', opacity: 0.7 }}>Opening = Current − transaction sum</p>
                    </>
                  )}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editAcctExclude} onChange={e => setEditAcctExclude(e.target.checked)} />
                  <span className="body-md">Exclude from Net Worth</span>
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="add-cat-btn" style={{ flex: 1 }}>Save Changes</button>
                  <button type="button" className="icon-btn-text" onClick={() => setEditingAccount(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        );
      }
      settingsContent = (
        <div className="page-inner slide-up">
          <div className="page-header"><button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button><h2 className="section-title-editorial">Accounts</h2></div>
          <div className="settings-controls fade-in">
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px solid var(--ghost-border)' }}>
              <CustomDropdown
                label="Default Account"
                options={accounts.map(a => ({ value: a.id, label: a.name, icon: ACCT_META[a.type || 'asset']?.icon || '🏦' }))}
                value={defaultAccountId}
                onChange={handleSetDefaultAccount}
                placeholder="Select Default Account"
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: '0.5rem', opacity: 0.8 }}>
                This account will be pre-selected when you create a new transaction.
              </p>
            </div>
            <AcctGroup title="Assets" accts={assetAccts} accountBalances={accountBalances} currencySymbol={currencySymbol} onDelete={handleDeleteAccount} onEdit={openEditAccount} onSetDefault={handleSetDefaultAccount} defaultAccountId={defaultAccountId} />
            <AcctGroup title="Liabilities" accts={liabilityAccts} accountBalances={accountBalances} currencySymbol={currencySymbol} onDelete={handleDeleteAccount} onEdit={openEditAccount} onSetDefault={handleSetDefaultAccount} defaultAccountId={defaultAccountId} />
            <AcctGroup title="Temporary" accts={tempAccts} accountBalances={accountBalances} currencySymbol={currencySymbol} onDelete={handleDeleteAccount} onEdit={openEditAccount} onSetDefault={handleSetDefaultAccount} defaultAccountId={defaultAccountId} />
            <form onSubmit={handleCreateAccount} className="add-category-form">
              <p className="label-sm">Add Account</p>
              <input type="text" placeholder="Account Name" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} required />
              <input type="number" step="0.01" placeholder="Initial Balance (0)" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} />
              <CustomDropdown
                label="Account Type"
                options={[
                  { value: 'asset', label: 'Asset (Bank, Cash, Wallet)', icon: '🏦' },
                  { value: 'liability', label: 'Liability (Loan, Credit Card)', icon: '💳' },
                  { value: 'temp', label: 'Temporary / Transit', icon: '⏳' }
                ]}
                value={newAccountType}
                onChange={v => {
                  setNewAccountType(v);
                  if (v !== 'asset') setNewAccountExclude(true);
                  else setNewAccountExclude(false);
                }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={newAccountExclude} onChange={e => setNewAccountExclude(e.target.checked)} />
                <span className="body-md">Exclude from total Net Worth</span>
              </label>
              <button type="submit" className="add-cat-btn">Add Account</button>
            </form>
          </div>
        </div>
      );
    }
    else if (view === 'category_management') {
      const parents = categories.filter(c => !c.parent_id && c.type === settingsType);
      settingsContent = (
        <div className="page-inner slide-up">
          <div className="page-header"><button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button><h2 className="section-title-editorial">Categories</h2></div>
          <div className="type-toggle-bar" style={{ margin: '1.5rem 0' }}><button className={`type-btn ${settingsType === 'expense' ? 'active-expense' : ''}`} onClick={() => setSettingsType('expense')}>Expense</button><button className={`type-btn ${settingsType === 'income' ? 'active-income' : ''}`} onClick={() => setSettingsType('income')}>Income</button></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
            {parents.map(parent => {
              const subs = categories.filter(c => c.parent_id === parent.id);
              return (
                <div key={parent.id} style={{ background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  {/* Parent row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: editingCat?.id === parent.id ? 'var(--primary-light)' : 'transparent' }}>
                    <span style={{ fontSize: '1.1rem', width: '28px', textAlign: 'center' }}>{parent.icon}</span>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: '0.9375rem', color: 'var(--on-surface)' }}>{parent.name}</span>
                    {subs.length > 0 && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }}>{subs.length}</span>}
                    {!parent.is_system && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="icon-btn-text" style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem' }} onClick={() => { setEditingCat(parent); setNewCatName(parent.name); setNewCatIcon(parent.icon); setNewCatParent(''); }}>✎</button>
                        <button className="delete-btn" onClick={() => handleDeleteCategory(parent.id)}>✕</button>
                      </div>
                    )}
                  </div>
                  {/* Subcategory rows */}
                  {subs.map((sub, i) => (
                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem 0.5rem 2.75rem', borderTop: '1px solid var(--ghost-border)', background: editingCat?.id === sub.id ? 'var(--primary-light)' : 'var(--surface-container-lowest)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginRight: '-0.25rem' }}>{i === subs.length - 1 ? '└' : '├'}</span>
                      <span style={{ fontSize: '0.95rem', width: '20px', textAlign: 'center' }}>{sub.icon}</span>
                      <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>{sub.name}</span>
                      {!sub.is_system && (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="icon-btn-text" style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem' }} onClick={() => { setEditingCat(sub); setNewCatName(sub.name); setNewCatIcon(sub.icon); setNewCatParent(sub.parent_id || ''); }}>✎</button>
                          <button className="delete-btn" onClick={() => handleDeleteCategory(sub.id)}>✕</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <form onSubmit={handleCreateCategory} className="add-category-form">
            <h3>{editingCat ? 'Edit' : 'Add Custom'} Category</h3>
            <div style={{ display: 'flex', gap: '1rem' }}><input type="text" maxLength="2" placeholder="🔖" value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} style={{ width: '60px', textAlign: 'center' }} required /><input type="text" placeholder="Category Name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} style={{ flex: 1 }} required /></div>
            <CustomDropdown label="Parent Category (Optional)" options={[{ value: '', label: '-- Root Category --' }, ...parents.map(p => ({ value: p.id, label: p.name, icon: p.icon }))]} value={newCatParent} onChange={setNewCatParent} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              {editingCat && <button type="button" className="icon-btn-text" onClick={() => { setEditingCat(null); setNewCatName(''); setNewCatParent(''); setNewCatIcon('🔖'); }}>Cancel</button>}
              <button type="submit" className="add-cat-btn" style={{ width: '100%' }}>{editingCat ? 'Update Category' : 'Save Category'}</button>
            </div>
          </form>
        </div>
      );
    } else if (view === 'party_management') {
      settingsContent = (
        <div className="page-inner slide-up">
          <div className="page-header"><button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button><h2 className="section-title-editorial">Parties</h2></div>
          <div className="settings-controls fade-in">
            <div className="category-manager">{parties.map(p => (<div key={p.id} className="editorial-item"><div className="editorial-icon">🏪</div><div className="editorial-info"><div className="editorial-title">{p.name}</div></div><button className="delete-btn" onClick={() => handleDeleteParty(p.id)}>✕</button></div>))}</div>
            <form onSubmit={handleCreateParty} className="add-category-form"><p className="label-sm">Add Party</p><input type="text" placeholder="Party Name (e.g. Starbucks)" value={newPartyName} onChange={(e) => setNewPartyName(e.target.value)} required /><button type="submit" className="add-cat-btn">Add Party</button></form>
          </div>
        </div>
      );
    } else if (view === 'tag_management') {
      settingsContent = (
        <div className="page-inner slide-up">
          <div className="page-header"><button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button><h2 className="section-title-editorial">Tags</h2></div>
          <div className="settings-controls fade-in">
            <div className="category-manager">{tags.map(t => (<div key={t.id} className="editorial-item"><div className="editorial-icon" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>#</div><div className="editorial-info"><div className="editorial-title">#{t.name}</div></div><button className="delete-btn" onClick={() => handleDeleteTag(t.id)}>✕</button></div>))}</div>
            <form onSubmit={handleCreateTag} className="add-category-form"><p className="label-sm">Add Tag</p><input type="text" placeholder="tag name (e.g. work)" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} required /><button type="submit" className="add-cat-btn">Add Tag</button></form>
          </div>
        </div>
      );
    }
    return <><PageShell {...shellProps}>{settingsContent}</PageShell>{acctEditModal}</>;
  }

  if (view === 'new_transaction') {
    const currentParents = categories.filter(c => c.type === txType && !c.parent_id);
    const applicableSubs = categories.filter(sub => currentParents.some(p => p.id === sub.parent_id));
    return (
      <PageShell {...shellProps}>
        <div className="page-inner max-w-2xl mx-auto space-y-8 pb-32" onKeyDown={(e) => { if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleTransaction(); } }}>
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#3fff8b]">{txToEdit ? 'Edit Transaction' : 'New Transaction'}</h2>
            <button className="text-zinc-500 font-bold uppercase text-xs tracking-widest" onClick={() => { resetForm(); setView(txToEdit ? 'ledger' : 'dashboard'); }}>Cancel</button>
          </div>

          <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/10 space-y-10 shadow-2xl">
            {/* Type Selector */}
            <div className="flex bg-surface-container-lowest p-1.5 rounded-2xl gap-1">
              {['expense', 'income', 'transfer'].map(t => (
                <button 
                  key={t}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${txType === t ? 'bg-[#3fff8b] text-[#005d2c] shadow-lg scale-105' : 'text-zinc-500 hover:text-zinc-300'}`}
                  onClick={() => { setTxType(t); setSelectedCategory(null); setSelectedSubcategory(null); }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Large Amount Input */}
            <div className="text-center space-y-2">
              <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase">Amount</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-extrabold font-['Manrope'] text-[#3fff8b]">{currencySymbol}</span>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00" 
                  className="bg-transparent border-none text-6xl font-extrabold font-['Manrope'] text-white focus:ring-0 w-full max-w-[280px] text-center placeholder:text-zinc-800"
                  autoFocus 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Date</p>
                <input 
                  type="date" 
                  value={txDate} 
                  onChange={(e) => setTxDate(e.target.value)} 
                  className="w-full bg-surface-container border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/20 transition-all text-sm font-medium" 
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Description</p>
                <input 
                  type="text" 
                  placeholder="What was this for?" 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  className="w-full bg-surface-container border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/20 transition-all text-sm font-medium placeholder:text-zinc-600" 
                />
              </div>
            </div>

            {txType !== 'transfer' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CustomDropdown 
                    label="Account" 
                    options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'account_balance' }))} 
                    value={selectedAccount} 
                    onChange={setSelectedAccount} 
                    placeholder="Select Account" 
                  />
                  <CustomDropdown 
                    label="Category" 
                    options={currentParents.flatMap(p => [{ value: p.id, label: p.name, icon: getCategoryIcon(p.name) }, ...applicableSubs.filter(s => s.parent_id === p.id).map(s => ({ value: s.id, label: s.name, icon: getCategoryIcon(s.name), indent: true }))])} 
                    value={selectedCategory} 
                    onChange={setSelectedCategory} 
                    placeholder="Select Category" 
                  />
                </div>
                <CustomDropdown 
                  label="Party" 
                  options={[{ value: '', label: '— No Party —', icon: 'person_off' }, ...parties.map(p => ({ value: p.id, label: p.name, icon: 'storefront' }))]} 
                  value={selectedParty || ''} 
                  onChange={v => setSelectedParty(v || null)} 
                  placeholder="Select Payee" 
                  showSearch={true} 
                />
                
                {tags.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(t => (
                        <button 
                          key={t.id} 
                          type="button"
                          onClick={() => setSelectedTags(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedTags.includes(t.id) ? 'bg-[#3fff8b] text-[#005d2c] border-[#3fff8b]' : 'bg-surface-container text-zinc-500 border-outline-variant/10 hover:border-[#3fff8b]/30'}`}
                        >
                          #{t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomDropdown label="From Account" options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'logout' }))} value={transferFromAccount} onChange={setTransferFromAccount} placeholder="Source..." />
                <CustomDropdown label="To Account" options={accounts.map(a => ({ value: a.id, label: a.name, icon: 'login' }))} value={transferToAccount} onChange={setTransferToAccount} placeholder="Destination..." />
              </div>
            )}

            <button 
              className="w-full bg-gradient-to-br from-[#3fff8b] to-[#13ea79] text-[#005d2c] py-5 rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all hover:brightness-110 disabled:opacity-50"
              onClick={handleTransaction}
            >
              {txToEdit ? 'Update Entry' : 'Post Transaction'}
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (view === 'ledger') {
    const activeFiltersCount = (filterOptions.type !== 'all' ? 1 : 0) + (filterOptions.dateRange.start ? 1 : 0) + (filterOptions.dateRange.end ? 1 : 0) + filterOptions.categoryIds.length + filterOptions.tagIds.length;
    const allVisibleIds = filteredLedger.filter(t => !t.transfer_id).map(t => t.id);
    const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedTxIds.has(id));
    const toggleTx = (id) => setSelectedTxIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
    const toggleAll = () => setSelectedTxIds(allSelected ? new Set() : new Set(allVisibleIds));
    const exitBulk = () => { setBulkSelectMode(false); setSelectedTxIds(new Set()); setBulkCategory(null); };
    const allCatOptions = categories.filter(c => !c.is_system || c.type).map(c => ({ value: c.id, label: c.name, icon: c.icon }));
    return (
      <PageShell {...shellProps}>
        {/* Sticky controls — sticks to top of .page-content scroll container */}
        <div className="ledger-sticky-header">
          <div className="ledger-header-row">
            <h2 className="section-title-editorial">Transactions</h2>
            <div className="ledger-header-actions">
              <button
                className={`filter-toggle-btn${bulkSelectMode ? ' active' : ''}`}
                onClick={() => bulkSelectMode ? exitBulk() : setBulkSelectMode(true)}
                title="Bulk assign category"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                {bulkSelectMode ? 'Cancel' : 'Select'}
              </button>
              <button className={`filter-toggle-btn${showAdvancedFilters ? ' active' : ''}`} onClick={() => setShowFilters(!showAdvancedFilters)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                <span className="ledger-filter-label">{showAdvancedFilters ? 'Hide' : 'Filter'}</span>{activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
              </button>
              <button className="section-action-link ledger-dashboard-link" onClick={navToDashboard}>Dashboard</button>
            </div>
          </div>
          <div className="relative bg-surface-container-low rounded-xl border border-outline-variant/10">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">search</span>
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="w-full bg-transparent pl-12 pr-4 py-4 text-sm font-medium focus:outline-none text-white placeholder:text-zinc-600" 
              value={filterOptions.searchTerm} 
              onChange={(e) => updateFilter('searchTerm', e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-4 overflow-x-auto pb-2 hide-scrollbar mt-4">
            <div className="flex gap-2">
              {[{ p: 'all', label: 'All' }, { p: 'today', label: 'Today' }, { p: 'this_week', label: 'Week' }, { p: 'this_month', label: 'Month' }, { p: 'last_3m', label: '3M' }].map(({ p, label }) => (
                <button 
                  key={p} 
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${filterOptions.preset === p ? 'bg-[#3fff8b] text-[#005d2c]' : 'bg-surface-container text-zinc-500'}`} 
                  onClick={() => applyDatePreset(p)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex gap-2">
              {[{ key: 'date_desc', label: 'Recent' }, { key: 'amount_desc', label: 'Highest' }].map(s => (
                <button 
                  key={s.key} 
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${ledgerSort === s.key ? 'bg-white text-black' : 'bg-surface-container text-zinc-500'}`} 
                  onClick={() => setLedgerSort(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {activeFiltersCount > 0 && !showAdvancedFilters && (<div className="filter-active-summary slide-up" style={{ marginTop: '0.75rem' }}><span className="label-sm" style={{ marginRight: '0.5rem' }}>Active:</span>{filterOptions.type !== 'all' && <span className="active-filter-tag">{filterOptions.type} <span className="active-filter-remove" onClick={() => updateFilter('type', 'all')}>✕</span></span>}{filterOptions.categoryIds.map(id => { if (id === '__uncategorized__') return <span key={id} className="active-filter-tag">• Uncategorized <span className="active-filter-remove" onClick={() => updateFilter('categoryIds', filterOptions.categoryIds.filter(x => x !== id))}>✕</span></span>; const c = categories.find(x => x.id === id); return c ? <span key={id} className="active-filter-tag">{c.icon} {c.name} <span className="active-filter-remove" onClick={() => updateFilter('categoryIds', filterOptions.categoryIds.filter(x => x !== id))}>✕</span></span> : null; })}{filterOptions.tagIds.map(id => { const t = tags.find(x => x.id === id); return t ? <span key={id} className="active-filter-tag">#{t.name} <span className="active-filter-remove" onClick={() => updateFilter('tagIds', filterOptions.tagIds.filter(x => x !== id))}>✕</span></span> : null; })}<button className="section-action-link" style={{ marginLeft: 'auto', fontSize: '0.7rem' }} onClick={resetFilters}>Clear All</button></div>)}
          {showAdvancedFilters && (<FilterPanel categories={categories} tags={tags} accounts={accounts} filterOptions={filterOptions} onUpdateFilter={updateFilter} onResetFilters={resetFilters} />)}
          {bulkSelectMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', padding: '0.625rem 1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Select all ({allVisibleIds.length})</span>
              </label>
              {selectedTxIds.size > 0 && <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>{selectedTxIds.size} selected</span>}
            </div>
          )}
        </div>

        {/* Scrollable transaction list */}
          <div className="flex flex-col gap-4">
            {groupedLedger.map(([date, txs]) => (
              <div key={date} className="flex flex-col gap-2">
                {date !== '__flat__' && (
                  <div className="flex items-center gap-4 py-2 mt-4 sticky top-0 bg-[#0e0e0e] z-10">
                    <span className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase">{formatGroupDate(date)}</span>
                    <div className="h-px flex-1 bg-zinc-800/30"></div>
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {txs.map(t => (
                    <TransactionItem 
                      key={t.id} 
                      t={t} 
                      onClick={openEditTransaction}
                      onDelete={handleDeleteTransaction}
                      accounts={accounts} 
                      categories={categories} 
                      currencySymbol={currencySymbol}
                      isSelected={selectedTxIds.has(t.id)}
                      bulkSelectMode={bulkSelectMode}
                      onToggleSelect={toggleTx}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

        {/* Sticky bulk-action bar */}
        {bulkSelectMode && selectedTxIds.size > 0 && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: 'var(--surface-container-lowest)', borderTop: '1px solid var(--ghost-border)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 -4px 24px rgba(0,0,0,0.1)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', whiteSpace: 'nowrap' }}>{selectedTxIds.size} selected</span>
            <div style={{ flex: 1, maxWidth: '320px' }}>
              <CustomDropdown
                options={allCatOptions}
                value={bulkCategory}
                onChange={setBulkCategory}
                placeholder="Assign category..."
                showSearch={true}
              />
            </div>
            <button
              className="add-cat-btn"
              style={{ whiteSpace: 'nowrap', padding: '0.75rem 1.5rem', opacity: bulkCategory ? 1 : 0.4, cursor: bulkCategory ? 'pointer' : 'not-allowed' }}
              onClick={bulkCategory ? handleBulkAssignCategory : undefined}
            >
              Apply
            </button>
            <button className="icon-btn-text" onClick={exitBulk}>Cancel</button>
          </div>
        )}
      </PageShell>
    );
  }

  if (view === 'analytics') {
    const PIE_COLORS = ['#3fff8b', '#6e9bff', '#ffe483', '#ff716c', '#acc3ff', '#fdd400'];
    const pct = (curr, prev) => {
      if (!prev || prev === 0) return null;
      const change = ((curr - prev) / Math.abs(prev)) * 100;
      return { label: `${Math.abs(change).toFixed(1)}%`, up: change >= 0 };
    };
    const incomePct = pct(analyticsKPIs.totalIncome, prevPeriodKPIs.income);
    const expensePct = pct(analyticsKPIs.totalExpense, prevPeriodKPIs.expense);
    const netPct = pct(analyticsKPIs.net, prevPeriodKPIs.net);
    const savRate = analyticsKPIs.totalIncome > 0 ? Math.round(((analyticsKPIs.totalIncome - analyticsKPIs.totalExpense) / analyticsKPIs.totalIncome) * 100) : null;
    const composedData = chartTimeSeries.map(d => ({ ...d, net: Math.round((d.income - d.expense) * 100) / 100 }));
    const topPayees = (() => {
      const totals = {};
      analyticsTransactions.filter(t => t.type === 'expense' && !t.transfer_id && t.parties?.name).forEach(t => {
        totals[t.parties.name] = (totals[t.parties.name] || 0) + parseFloat(t.amount);
      });
      return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
    })();
    const totalCatVal = chartCategorical.reduce((s, c) => s + c.value, 0);

    return (
      <PageShell {...shellProps}>
        <div className="page-inner space-y-8 pb-32">
          {/* Header & Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#3fff8b]">Insights</h2>
              <button 
                className={`p-2 rounded-xl transition-colors ${showAnalyticsFilters ? 'bg-[#3fff8b] text-[#005d2c]' : 'bg-surface-container text-[#3fff8b]'}`}
                onClick={() => setShowAnalyticsFilters(!showAnalyticsFilters)}
              >
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {['today', 'this_week', 'this_month', 'last_3m', 'this_year'].map(p => (
                <button 
                  key={p} 
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${analyticsFilters.preset === p ? 'bg-[#3fff8b] text-[#005d2c]' : 'bg-surface-container text-zinc-500'}`}
                  onClick={() => applyAnalyticsPreset(p)}
                >
                  {p.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {showAnalyticsFilters && (
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/10 slide-up">
              <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-4">Transaction Type</p>
              <div className="flex bg-surface-container-lowest p-1 rounded-xl gap-1">
                {['all', 'income', 'expense'].map(t => (
                  <button 
                    key={t} 
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${analyticsFilters.type === t ? 'bg-[#3fff8b] text-[#005d2c]' : 'text-zinc-500'}`}
                    onClick={() => updateAnalyticsFilter('type', t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button className="text-xs font-bold text-[#ff716c] uppercase tracking-widest" onClick={resetAnalyticsFilters}>Reset Filters</button>
              </div>
            </div>
          )}

          {/* Net Cash Flow Hero */}
          <section className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 font-bold">Net Cash Flow</span>
                <h2 className={`font-headline text-5xl font-extrabold tracking-tighter mt-1 ${analyticsKPIs.net >= 0 ? 'text-[#3fff8b]' : 'text-[#ff716c]'}`}>
                  {analyticsKPIs.net >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(analyticsKPIs.net).toLocaleString()}
                </h2>
              </div>
              {netPct && (
                <div className="bg-[#3fff8b]/10 px-3 py-1 rounded-full flex items-center gap-1 border border-[#3fff8b]/20">
                  <span className={`material-symbols-outlined text-xs ${netPct.up ? 'text-[#3fff8b]' : 'text-[#ff716c]'}`}>
                    {netPct.up ? 'trending_up' : 'trending_down'}
                  </span>
                  <span className={`text-[10px] font-bold ${netPct.up ? 'text-[#3fff8b]' : 'text-[#ff716c]'}`}>{netPct.label}</span>
                </div>
              )}
            </div>
            
            <div className="h-64 bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/5">
              {composedData.length === 0 ? <EmptyChart h={200} /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={composedData}>
                    <XAxis dataKey="label" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip content={<AnalyticsTooltip currencySymbol={currencySymbol} />} />
                    <Bar dataKey="income" fill="#3fff8b" radius={[4, 4, 0, 0]} opacity={0.2} barSize={20} />
                    <Bar dataKey="expense" fill="#ff716c" radius={[4, 4, 0, 0]} opacity={0.2} barSize={20} />
                    <Line type="monotone" dataKey="net" stroke="#3fff8b" strokeWidth={3} dot={false} strokeLinecap="round" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Savings Rate Bento */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-low p-8 rounded-[2rem] flex flex-col justify-between border-l-4 border-[#3fff8b] shadow-xl">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-zinc-500 font-bold">Savings Rate</p>
                  <p className="font-headline text-4xl font-extrabold mt-1 text-white">{savRate !== null ? `${savRate}%` : '—'}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#3fff8b]/10 flex items-center justify-center border border-[#3fff8b]/20">
                  <span className="material-symbols-outlined text-[#3fff8b]">analytics</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#3fff8b] to-[#13ea79] rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.max(0, Math.min(100, savRate || 0))}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
                  <span>Efficiency</span>
                  <span>Target: 40%</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low p-8 rounded-[2rem] border-l-4 border-[#6e9bff] shadow-xl">
              <p className="text-[10px] tracking-widest uppercase text-zinc-500 font-bold mb-4">Top Spending Category</p>
              {chartCategorical.length > 0 ? (
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 rounded-2xl bg-[#6e9bff]/10 flex items-center justify-center border border-[#6e9bff]/20">
                    <span className="material-symbols-outlined text-[#6e9bff] text-3xl">
                      {getCategoryIcon(chartCategorical[0].name)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-white">{chartCategorical[0].name}</h4>
                    <p className="text-[#6e9bff] font-bold font-headline">{currencySymbol}{chartCategorical[0].value.toLocaleString()}</p>
                  </div>
                </div>
              ) : <p className="text-zinc-500 text-sm">No data</p>}
            </div>
          </section>

          {/* Distribution */}
          <section className="space-y-6">
            <div className="flex justify-between items-baseline">
              <h3 className="font-headline text-2xl font-bold tracking-tight text-white">Distribution</h3>
              <span className="text-[10px] text-[#3fff8b] font-bold tracking-widest uppercase" onClick={() => setCatBreakdownType(catBreakdownType === 'expense' ? 'income' : 'expense')}>
                Switch to {catBreakdownType === 'expense' ? 'Income' : 'Expense'}
              </span>
            </div>
            <div className="bg-surface-container p-6 rounded-[2rem] border border-outline-variant/10 space-y-6">
              {chartCategorical.slice(0, 5).map(({ name, id, value }, i) => {
                const pctOfTotal = totalCatVal > 0 ? Math.round((value / totalCatVal) * 100) : 0;
                const color = PIE_COLORS[i % PIE_COLORS.length];
                const icon = getCategoryIcon(name);
                return (
                  <div key={id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navToLedgerByCategory(id, catBreakdownType)}>
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center transition-transform group-active:scale-90" style={{ color }}>
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-white">{name}</span>
                        <span className="text-sm font-extrabold font-headline" style={{ color }}>{currencySymbol}{value.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctOfTotal}%`, background: color }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recurring Payees */}
          <section className="space-y-6">
            <h3 className="font-headline text-2xl font-bold tracking-tight text-white">Top Payees</h3>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-6 px-6">
              {topPayees.map((p, i) => (
                <div key={i} className="flex-shrink-0 w-36 bg-surface-container-low p-6 rounded-[2.5rem] text-center space-y-4 border border-outline-variant/5 active:scale-95 transition-transform">
                  <div className="w-16 h-16 mx-auto rounded-full bg-surface-container-lowest flex items-center justify-center ring-2 ring-[#3fff8b]/20 ring-offset-4 ring-offset-[#0e0e0e]">
                    <span className="text-xl font-bold text-[#3fff8b]">{p.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate">{p.name}</p>
                    <p className="text-sm font-extrabold text-[#3fff8b] font-headline mt-1">{currencySymbol}{p.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PageShell>
    );
  }

  if (view === 'budgets') {
    return (
      <PageShell {...shellProps}>
        <div className="page-inner space-y-8 pb-32">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#3fff8b]">Budgets</h2>
            <button 
              className="bg-gradient-to-br from-[#3fff8b] to-[#13ea79] text-[#005d2c] px-6 py-2 rounded-xl font-bold active:scale-95 transition-transform text-sm"
              onClick={() => { setBudgetForm({ id: null, category_id: '', amount_limit: '', period: 'monthly' }); setShowBudgetModal(true); }}
            >
              Add New
            </button>
          </div>

          {showBudgetModal && (
            <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
              <div className="bg-[#131313] p-8 rounded-[2rem] border border-outline-variant/10 w-full max-w-md slide-up" onClick={e => e.stopPropagation()}>
                <h3 className="font-headline text-2xl font-bold text-white mb-6">Manage Budget</h3>
                <form onSubmit={handleSaveBudget} className="space-y-6">
                  <div>
                    <CustomDropdown 
                      label="Category" 
                      options={[{ value: '', label: '-- Global Budget --', icon: '🌍' }, ...categories.filter(c => !c.parent_id).map(c => ({ value: c.id, label: c.name, icon: getCategoryIcon(c.name) }))]} 
                      value={budgetForm.category_id} 
                      onChange={val => setBudgetForm({ ...budgetForm, category_id: val })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Limit Amount</p>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="w-full bg-[#1a1a1a] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/30 transition-all" 
                      value={budgetForm.amount_limit} 
                      onChange={e => setBudgetForm({ ...budgetForm, amount_limit: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <CustomDropdown 
                      label="Period" 
                      options={[{ value: 'monthly', label: 'Monthly' }, { value: 'weekly', label: 'Weekly' }, { value: 'quarterly', label: 'Quarterly' }]} 
                      value={budgetForm.period} 
                      onChange={val => setBudgetForm({ ...budgetForm, period: val })} 
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 bg-[#3fff8b] text-[#005d2c] py-4 rounded-xl font-bold active:scale-95 transition-transform">Save Budget</button>
                    <button type="button" className="px-6 text-zinc-500 font-bold" onClick={() => setShowBudgetModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgetProgress.map(b => {
              const cat = categories.find(c => c.id === b.category_id);
              const statusColor = b.status === 'over' ? '#ff716c' : b.status === 'warning' ? '#ffe483' : '#3fff8b';
              const icon = cat ? getCategoryIcon(cat.name) : 'public';
              
              return (
                <div key={b.id} className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/5 flex flex-col justify-between group active:scale-[0.98] transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center border border-outline-variant/10 text-[#3fff8b]">
                        <span className="material-symbols-outlined">{icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{cat?.name || 'Global Budget'}</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{b.period}</p>
                      </div>
                    </div>
                    <button 
                      className="p-2 text-zinc-600 hover:text-[#3fff8b] transition-colors"
                      onClick={() => { setBudgetForm({ id: b.id, category_id: b.category_id || '', amount_limit: b.limit_amount.toString(), period: b.period }); setShowBudgetModal(true); }}
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Spent</p>
                        <p className="text-xl font-extrabold font-['Manrope'] text-white">
                          {currencySymbol}{b.spent.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Limit</p>
                        <p className="text-sm font-bold text-zinc-400">
                          {currencySymbol}{b.limit_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000" 
                          style={{ 
                            width: `${Math.max(0, Math.min(100, b.pct))}%`,
                            background: statusColor 
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${b.status === 'over' ? 'text-[#ff716c]' : 'text-zinc-500'}`}>
                        {b.status === 'over' ? 'Limit Exceeded' : 'On Track'}
                      </span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                        {b.status === 'over' ? `-${currencySymbol}${Math.abs(b.remaining).toLocaleString()}` : `${currencySymbol}${b.remaining.toLocaleString()} left`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {budgetProgress.length === 0 && (
              <div className="col-span-full py-20 text-center bg-surface-container-low rounded-[2rem] border-2 border-dashed border-outline-variant/10">
                <span className="material-symbols-outlined text-zinc-700 text-5xl mb-4">account_balance_wallet</span>
                <p className="text-zinc-500 font-bold">No budgets set yet.</p>
                <button 
                  className="mt-4 text-[#3fff8b] text-sm font-bold uppercase tracking-widest"
                  onClick={() => setShowBudgetModal(true)}
                >
                  Create your first budget
                </button>
              </div>
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <PageShell {...shellProps}>
      <div className="page-inner space-y-10 pb-32 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Stack */}
          <div className="lg:col-span-8 space-y-10">
            {/* Portfolio Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#3fff8b] to-[#005d2c] p-8 md:p-12 rounded-[2.5rem] shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.3em] text-[#001d4e]/60 uppercase mb-3">Total Net Worth</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-headline text-[#001d4e]">{currencySymbol}</span>
                    <h1 className="text-6xl md:text-8xl font-extrabold font-headline text-[#001d4e] tracking-tighter leading-none">
                      {Math.floor(balance).toLocaleString()}
                    </h1>
                    <span className="text-2xl font-bold text-[#001d4e]/40 font-headline">
                      .{(balance % 1).toFixed(2).split('.')[1]}
                    </span>
                  </div>
                  {portfolioChange !== null && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#001d4e]/10 rounded-full mt-8 backdrop-blur-md border border-[#001d4e]/10">
                      <span className="material-symbols-outlined text-[#001d4e] text-sm">
                        {portfolioChange >= 0 ? 'trending_up' : 'trending_down'}
                      </span>
                      <span className="text-[10px] font-black text-[#001d4e] uppercase tracking-wider">{Math.abs(portfolioChange)}% vs last period</span>
                    </div>
                  )}
                </div>
                {/* Minimal Sparkline Preview */}
                <div className="flex items-end gap-1.5 h-16 opacity-40">
                  {sparklineData.slice(-12).map((v, i) => {
                    const max = Math.max(...sparklineData, 1);
                    const h = Math.max(10, (v / max) * 100);
                    return <div key={i} className="w-1.5 bg-[#001d4e] rounded-full" style={{ height: `${h}%` }}></div>;
                  })}
                </div>
              </div>
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-[80px]"></div>
              <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-[#001d4e]/10 rounded-full blur-[60px]"></div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-low p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-xl transition-transform active:scale-[0.99]">
                <div className="flex justify-between items-start mb-6">
                  <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase">Total Income</p>
                  <div className="w-10 h-10 rounded-full bg-[#3fff8b]/10 flex items-center justify-center border border-[#3fff8b]/10">
                    <span className="material-symbols-outlined text-[#3fff8b] text-sm">arrow_upward</span>
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold font-headline text-white tracking-tight">
                  {currencySymbol}{totalIncome.toLocaleString()}
                </h2>
              </div>
              <div className="bg-surface-low p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-xl transition-transform active:scale-[0.99]">
                <div className="flex justify-between items-start mb-6">
                  <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase">Total Expenses</p>
                  <div className="w-10 h-10 rounded-full bg-[#ff716c]/10 flex items-center justify-center border border-[#ff716c]/10">
                    <span className="material-symbols-outlined text-[#ff716c] text-sm">arrow_downward</span>
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold font-headline text-white tracking-tight">
                  {currencySymbol}{totalExpense.toLocaleString()}
                </h2>
              </div>
            </div>

            {/* Recent Activity */}
            <section className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="font-headline text-2xl font-bold tracking-tight text-white">Recent Activity</h3>
                <button className="text-[10px] font-bold text-[#3fff8b] uppercase tracking-[0.2em]" onClick={navToLedger}>View All</button>
              </div>
              <div className="space-y-3">
                {dashTransactions.filter(t => !t.transfer_id).slice(0, 5).map(t => (
                  <TransactionItem 
                    key={t.id} 
                    t={t} 
                    onClick={openEditTransaction} 
                    accounts={accounts} 
                    categories={categories} 
                    currencySymbol={currencySymbol} 
                  />
                ))}
                {dashTransactions.filter(t => !t.transfer_id).length === 0 && (
                  <div className="bg-surface-low/50 rounded-[2.5rem] py-12 text-center border border-dashed border-outline-variant/10">
                    <p className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest">No entries found</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Content Stack */}
          <div className="lg:col-span-4 space-y-10">
            {/* AI Insights Card */}
            <section className="bg-surface-low p-8 rounded-[2.5rem] border-l-4 border-[#3fff8b] shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-[#3fff8b]/10 flex items-center justify-center border border-[#3fff8b]/10">
                  <span className="material-symbols-outlined text-[#3fff8b] text-sm">auto_awesome</span>
                </div>
                <h3 className="font-headline font-bold text-sm text-white uppercase tracking-widest">AI Insights</h3>
              </div>
              <div className="space-y-6">
                {smartInsights.map((ins, i) => (
                  <div key={i} className="group cursor-default">
                    <p className="text-xs text-zinc-400 leading-relaxed transition-colors group-hover:text-zinc-200">
                      <strong className="text-[#3fff8b] font-bold tracking-tight">{ins.title}:</strong> {ins.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Account Distribution */}
            <section className="bg-surface-low p-8 rounded-[2.5rem] border border-outline-variant/5 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-headline font-bold text-sm text-white uppercase tracking-widest">Accounts</h3>
                <button className="text-[10px] font-bold text-[#3fff8b] uppercase tracking-widest" onClick={() => setView('account_management')}>Manage</button>
              </div>
              <div className="space-y-4">
                {(() => {
                  const maxBal = Math.max(...accounts.map(a => Math.abs(accountBalances[a.id] || 0)), 1);
                  return accounts.map(a => {
                    const bal = accountBalances[a.id] || 0;
                    const pct = Math.min(Math.abs(bal) / maxBal * 100, 100);
                    return (
                      <div key={a.id} className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10 group hover:border-[#3fff8b]/20 transition-all">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-white tracking-tight">{a.name}</span>
                          <span className={`font-headline text-xs font-black ${bal < 0 ? 'text-[#ff716c]' : 'text-[#3fff8b]'}`}>
                            {currencySymbol}{bal.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1 bg-surface-lowest rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${bal < 0 ? 'bg-[#ff716c]' : 'bg-[#3fff8b]'}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </section>

            {/* Spending Breakdown */}
            <section className="bg-surface-low p-8 rounded-[2.5rem] border border-outline-variant/5 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-headline font-bold text-sm text-white uppercase tracking-widest">Spending</h3>
                <button className="text-[10px] font-bold text-[#3fff8b] uppercase tracking-widest" onClick={navToAnalytics}>Details</button>
              </div>
              <div className="space-y-6">
                {topCategories.length > 0 ? topCategories.slice(0, 4).map(({ name, amount }, i) => {
                  const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                  return (
                    <div key={name} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-zinc-400">{name}</span>
                        <span className="text-white">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-lowest rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-700 rounded-full group-hover:bg-[#3fff8b] transition-all" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                }) : <p className="text-[10px] text-zinc-600 font-bold uppercase text-center py-4">No data</p>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
