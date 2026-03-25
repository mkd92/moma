import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Line } from 'recharts';
import { supabase } from './supabaseClient';
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
    <nav className="bottom-nav">
      <button className={`bnav-item${view === 'dashboard' ? ' active' : ''}`} onClick={onDashboard}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>Home</span>
      </button>
      <button className={`bnav-item${view === 'ledger' ? ' active' : ''}`} onClick={onLedger}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
        </svg>
        <span>Txns</span>
      </button>
      <button className="bnav-fab" onClick={onNewTx}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <button className={`bnav-item${view === 'analytics' ? ' active' : ''}`} onClick={onAnalytics}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"/>
        </svg>
        <span>Analytics</span>
      </button>
      <button className={`bnav-item${settingsViews.includes(view) ? ' active' : ''}`} onClick={onSettings}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span>Settings</span>
      </button>
    </nav>
  );
};

// Sub-views that support swipe-back gesture
const SUB_VIEWS = new Set(['new_transaction', 'account_management', 'category_management', 'party_management', 'tag_management']);

// Sidebar — desktop left-rail navigation
const Sidebar = ({ view, onDashboard, onLedger, onAnalytics, onBudgets, onNewTx, onSettings, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const NAV_ITEMS = [
    { key: 'dashboard', label: 'Portfolio', onClick: onDashboard, icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
    { key: 'ledger', label: 'Transactions', onClick: onLedger, icon: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/> },
    { key: 'budgets', label: 'Budgets', onClick: onBudgets, icon: <path d="M12 20v-6M6 20V10M18 20V4"/> },
    { key: 'analytics', label: 'Analytics', onClick: onAnalytics, icon: <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"/> },
    { key: 'vault', label: 'Vault', onClick: null, icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></> },
  ];
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-brand-wrapper">
        {!collapsed && (
          <div>
            <div className="sidebar-brand">MOMA</div>
            <div className="sidebar-subtitle">THE DIGITAL LEDGER</div>
          </div>
        )}
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button key={item.key} className={`sidebar-item${view === item.key ? ' active' : ''}`} onClick={item.onClick || undefined} title={collapsed ? item.label : ''}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-new-tx-btn" onClick={onNewTx} title={collapsed ? 'Add Transaction' : ''}>
          {collapsed
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            : 'Add Transaction'}
        </button>
        <div className="sidebar-footer-item" onClick={onSettings} title={collapsed ? 'Settings' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          {!collapsed && <span>Settings</span>}
        </div>
        <div className="sidebar-footer-item" onClick={onLogout} title={collapsed ? 'Logout' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          {!collapsed && <span>Logout</span>}
        </div>
      </div>
    </aside>
  );
};

const TopHeader = ({ session }) => (
  <header className="top-header">
    <div className="search-container">
      <svg className="search-icon-top" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" placeholder="Search accounts, tags, or dates..." className="search-input-top" />
    </div>
    <div className="top-actions">
      <div className="user-profile-sm">
        <div style={{ background: 'var(--primary)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
          {session?.user?.email?.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  </header>
);

const PageShell = ({ children, view, onDashboard, onLedger, onAnalytics, onBudgets, onNewTx, onSettings, onLogout, session, onRefresh }) => {
  const navigate = useNavigate();
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
      <Sidebar view={view} onDashboard={onDashboard} onLedger={onLedger} onAnalytics={onAnalytics} onBudgets={onBudgets} onNewTx={onNewTx} onSettings={onSettings} onLogout={onLogout} />
      <div className="page-content" ref={containerRef}>
        {(pullY > 0 || refreshing) && (
          <div className="ptr-indicator" style={{ height: refreshing ? 48 : pullY }}>
            <div
              className={`ptr-spinner${refreshing ? '' : ' ptr-spinner-static'}`}
              style={!refreshing ? { transform: `rotate(${(pullY / 72) * 360}deg)` } : {}}
            />
          </div>
        )}
        <TopHeader session={session} />
        {children}
      </div>
      <BottomNav view={view} onDashboard={onDashboard} onLedger={onLedger} onAnalytics={onAnalytics} onSettings={onSettings} onNewTx={onNewTx} />
    </div>
  );
};

const AcctGroup = ({ title, accts, accountBalances, currencySymbol, onDelete, onEdit }) => accts.length === 0 ? null : (
  <div style={{ marginBottom: '1.5rem' }}>
    <p className="label-sm" style={{ marginBottom: '0.75rem' }}>{title}</p>
    <div className="category-manager">
      {accts.map(acc => {
        const meta = ACCT_META[acc.type || 'asset'];
        const bal = accountBalances[acc.id] || 0;
        return (
          <div key={acc.id} className="editorial-item">
            <div className="editorial-icon">{meta.icon}</div>
            <div className="editorial-info">
              <div className="editorial-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {acc.name}
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-low)', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{meta.label}</span>
                {acc.exclude_from_total && <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>excl.</span>}
              </div>
              <div className="editorial-meta">{currencySymbol}{bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
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

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  }, []);

  const fetchParties = useCallback(async () => {
    const { data } = await supabase.from('parties').select('*').order('name');
    if (data) setParties(data);
  }, []);

  const fetchTags = useCallback(async () => {
    const { data } = await supabase.from('tags').select('*').order('name');
    if (data) setTags(data);
  }, []);

  const fetchAccounts = useCallback(async () => {
    const { data } = await supabase.from('accounts').select('*').order('name');
    if (data) setAccounts(data);
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
    setTransactions(data || []);
  }, []);

  const fetchInitialData = useCallback(async (activeSession) => {
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
      const key = t.categories.name;
      totals[key] = (totals[key] || 0) + parseFloat(t.amount);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
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
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
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
      const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      return transactions.filter(t => t.transaction_date === key && t.type === 'expense' && !t.transfer_id && t.account_id && activeAccountIds.has(t.account_id)).reduce((s, t) => s + parseFloat(t.amount), 0);
    });
  }, [transactions, activeAccountIds]);

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

  const handleLogout = useCallback(async () => supabase.auth.signOut(), []);
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
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
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

  const prevAnalyticsTransactions = useMemo(() => {
    const { start, end } = analyticsFilters.dateRange;
    if (!start || !end) return [];
    const duration = new Date(end) - new Date(start);
    const prevEnd = new Date(new Date(start).getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - duration);
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const ps = fmt(prevStart), pe = fmt(prevEnd);
    return transactions.filter(t => t.transaction_date >= ps && t.transaction_date <= pe);
  }, [transactions, analyticsFilters.dateRange]);

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
        const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
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
        const window = arr.slice(Math.max(0, i-6), i+1);
        const sum = window.reduce((s, x) => s + x.expense, 0);
        return { ...d, expenseMA: sum / window.length };
      });
    }
  }, [analyticsTransactions, analyticsFilters.dateRange, drillCategory, categories]);

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
          !(t.note||'').toLowerCase().includes(s) &&
          !(t.parties?.name||'').toLowerCase().includes(s) &&
          !(t.categories?.name||'').toLowerCase().includes(s) &&
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

  const shellProps = { view, onDashboard: navToDashboard, onLedger: navToLedger, onAnalytics: navToAnalytics, onBudgets: navToBudgets, onNewTx: navToNewTx, onSettings: navToSettings, onLogout: handleLogout, session, onRefresh: refreshData };

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
          <div className="auth-social-btns"><button type="button" className="auth-social-btn" onClick={handleGoogleSignIn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Continue with Google</button></div>
        </div>
      </div>
    </div>
  );

  if (view === 'settings' || view === 'account_management' || view === 'category_management' || view === 'party_management' || view === 'tag_management') {
    let settingsContent;
    if (view === 'settings') settingsContent = (
      <div className="page-inner fade-in">
        <div className="section-header-row"><h2 className="section-title-editorial">Settings</h2></div>
        <div className="settings-panel"><div className="settings-section"><p className="label-sm">Preferences</p><div className="settings-group"><div className="settings-card"><span className="sc-text">Currency</span><div style={{ width: '180px' }}><CustomDropdown options={Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => ({ value: code, label: `${code} (${sym})` }))} value={currencyCode} onChange={setCurrencyCode} showSearch={false} /></div></div></div></div><div className="settings-section"><p className="label-sm">Manage</p><div className="settings-group"><button className="settings-nav-btn" onClick={() => setView('account_management')}>Accounts <span className="arrow">›</span></button><button className="settings-nav-btn" onClick={() => setView('category_management')}>Categories <span className="arrow">›</span></button><button className="settings-nav-btn" onClick={() => setView('party_management')}>Parties <span className="arrow">›</span></button><button className="settings-nav-btn" onClick={() => setView('tag_management')}>Tags <span className="arrow">›</span></button></div></div></div>
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
      settingsContent = (
        <div className="page-inner slide-up">
          <div className="page-header"><button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button><h2 className="section-title-editorial">Accounts</h2></div>
          {editingAccount && (
            <div className="modal-overlay" onClick={() => setEditingAccount(null)}>
              <div className="modal-content fluid-input-area" onClick={e => e.stopPropagation()}>
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
            </div>
          )}
          <div className="settings-controls fade-in">
            <AcctGroup title="Assets" accts={assetAccts} accountBalances={accountBalances} currencySymbol={currencySymbol} onDelete={handleDeleteAccount} onEdit={openEditAccount} />
            <AcctGroup title="Liabilities" accts={liabilityAccts} accountBalances={accountBalances} currencySymbol={currencySymbol} onDelete={handleDeleteAccount} onEdit={openEditAccount} />
            <AcctGroup title="Temporary" accts={tempAccts} accountBalances={accountBalances} currencySymbol={currencySymbol} onDelete={handleDeleteAccount} onEdit={openEditAccount} />
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
    return <PageShell {...shellProps}>{settingsContent}</PageShell>;
  }

  if (view === 'new_transaction') {
    const currentParents = categories.filter(c => c.type === txType && !c.parent_id);
    const applicableSubs = categories.filter(sub => currentParents.some(p => p.id === sub.parent_id));
    return (
      <PageShell {...shellProps}>
        <div className="page-inner slide-up" style={{ maxWidth: '640px' }} onKeyDown={(e) => { if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleTransaction(); } }}>
          <div className="section-header-row"><h2 className="section-title-editorial">{txToEdit ? 'Edit Transaction' : 'New Transaction'}</h2><button className="section-action-link" onClick={() => { resetForm(); setView(txToEdit ? 'ledger' : 'dashboard'); }}>Cancel</button></div>
          <div className="fluid-input-area fade-in">
            <div className="type-toggle-bar"><button className={`type-btn ${txType === 'expense' ? 'active-expense' : ''}`} onClick={() => { setTxType('expense'); setSelectedCategory(null); setSelectedSubcategory(null); }}>Expense</button><button className={`type-btn ${txType === 'income' ? 'active-income' : ''}`} onClick={() => { setTxType('income'); setSelectedCategory(null); setSelectedSubcategory(null); }}>Income</button><button className={`type-btn ${txType === 'transfer' ? 'active-transfer' : ''}`} onClick={() => { setTxType('transfer'); setSelectedCategory(null); setSelectedSubcategory(null); }}>Transfer</button></div>
            <div className="amount-input-wrapper"><span className="currency-prefix">{currencySymbol}</span><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="amount-input" autoFocus /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="category-selection-area"><p className="label-sm">Date</p><input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="text-input" /></div>
              <div className="category-selection-area"><p className="label-sm">Note</p><input type="text" placeholder="Description" value={note} onChange={(e) => setNote(e.target.value)} className="text-input" /></div>
            </div>
            {txType !== 'transfer' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <CustomDropdown label="Account" options={accounts.map(a => ({ value: a.id, label: a.name, icon: '🏦' }))} value={selectedAccount} onChange={setSelectedAccount} placeholder="Select Account" />
                  <CustomDropdown label="Category" options={currentParents.flatMap(p => [{ value: p.id, label: p.name, icon: p.icon }, ...applicableSubs.filter(s => s.parent_id === p.id).map(s => ({ value: s.id, label: s.name, icon: s.icon, indent: true }))])} value={selectedCategory} onChange={setSelectedCategory} placeholder="Select Category" />
                </div>
                <CustomDropdown label="Party (Optional)" options={[{ value: '', label: '— None —' }, ...parties.map(p => ({ value: p.id, label: p.name, icon: '🏪' }))]} value={selectedParty || ''} onChange={v => setSelectedParty(v || null)} placeholder="Select Party" showSearch={true} />
                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p className="label-sm">Tags</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {tags.map(t => (
                        <button key={t.id} type="button"
                          onClick={() => setSelectedTags(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                          className="filter-chip"
                          style={{ background: selectedTags.includes(t.id) ? 'var(--primary-light)' : 'var(--surface-container-low)', color: selectedTags.includes(t.id) ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: selectedTags.includes(t.id) ? 700 : 400 }}
                        >#{t.name}</button>
                      ))}
                    </div>
                  </div>
                )}
              </>
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
    const allVisibleIds = filteredLedger.filter(t => !t.transfer_id).map(t => t.id);
    const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedTxIds.has(id));
    const toggleTx = (id) => setSelectedTxIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
    const toggleAll = () => setSelectedTxIds(allSelected ? new Set() : new Set(allVisibleIds));
    const exitBulk = () => { setBulkSelectMode(false); setSelectedTxIds(new Set()); setBulkCategory(null); };
    const allCatOptions = categories.filter(c => !c.is_system || c.type).map(c => ({ value: c.id, label: c.name, icon: c.icon }));
    return (
      <PageShell {...shellProps}>
        {/* Sticky controls — sticks to top of .page-content scroll container */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--surface)', padding: '2rem 2.5rem 1rem', borderBottom: '1px solid var(--ghost-border)' }}>
          <div className="section-header-row" style={{ margin: 0 }}>
            <h2 className="section-title-editorial">Transactions</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                className={`filter-toggle-btn${bulkSelectMode ? ' active' : ''}`}
                onClick={() => bulkSelectMode ? exitBulk() : setBulkSelectMode(true)}
                title="Bulk assign category"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                {bulkSelectMode ? 'Cancel' : 'Select'}
              </button>
              <button className={`filter-toggle-btn ${showAdvancedFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showAdvancedFilters)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                {showAdvancedFilters ? 'Hide Filters' : 'Deep Filter'}{activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
              </button>
              <button className="section-action-link" onClick={navToDashboard}>Dashboard</button>
            </div>
          </div>
          <div className="ledger-search-row" style={{ marginTop: '1.25rem' }}><div className="ledger-search-wrap" style={{ background: 'var(--surface-container-low)', borderRadius: 'var(--radius-full)', padding: '0.25rem' }}><input type="text" placeholder="Search transactions..." className="ledger-search-input" style={{ background: 'transparent', border: 'none', padding: '0.75rem 1rem 0.75rem 3rem' }} value={filterOptions.searchTerm} onChange={(e) => updateFilter('searchTerm', e.target.value)} /><svg className="search-icon" style={{ left: '1.25rem' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
            <div className="filter-pills" style={{ margin: 0, flex: 1 }}>{['all', 'today', 'this_week', 'this_month', 'last_3m'].map(p => (<button key={p} className={`filter-pill ${filterOptions.preset === p ? 'active-pill' : ''}`} onClick={() => applyDatePreset(p)} style={{ textTransform: 'capitalize' }}>{p.replace('_', ' ')}</button>))}</div>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}>
              {[{ key: 'date_desc', label: 'Date ↓' }, { key: 'date_asc', label: 'Date ↑' }, { key: 'amount_desc', label: 'Amt ↓' }, { key: 'amount_asc', label: 'Amt ↑' }].map(s => (
                <button key={s.key} onClick={() => setLedgerSort(s.key)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: ledgerSort === s.key ? 700 : 400, borderRadius: 'var(--radius-sm)', background: ledgerSort === s.key ? 'var(--surface-container-lowest)' : 'transparent', color: ledgerSort === s.key ? 'var(--primary)' : 'var(--on-surface-variant)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>{s.label}</button>
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
        <div style={{ padding: '1.5rem 2.5rem', paddingBottom: bulkSelectMode && selectedTxIds.size > 0 ? '7rem' : '2.5rem' }}>
          <div className="editorial-list">
            {groupedLedger.map(([date, txs]) => (
              <div key={date} className="ledger-date-group">
                {date !== '__flat__' && <div className="ledger-date-header"><span className="ledger-date-text">{formatGroupDate(date)}</span></div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {txs.map(t => {
                    const cat = t.categories || { icon: '•', name: 'Uncategorized' };
                    const isSelected = selectedTxIds.has(t.id);
                    const isTransfer = !!t.transfer_id;
                    return (
                      <div
                        key={t.id}
                        className="editorial-item"
                        style={isSelected ? { background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' } : {}}
                        onClick={() => bulkSelectMode && !isTransfer ? toggleTx(t.id) : (!bulkSelectMode ? openEditTransaction(t) : null)}
                      >
                        {bulkSelectMode && !isTransfer && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTx(t.id)}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
                          />
                        )}
                        <div className="editorial-icon">{cat.icon}</div>
                        <div className="editorial-info">
                          <div className="editorial-title">{t.parties?.name || cat.name}</div>
                          <div className="editorial-meta">{cat.name} · {t.accounts?.name || 'Cash'}{t.transaction_tags?.length > 0 && (<span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>{t.transaction_tags.map(tt => `#${tt.tags?.name}`).filter(Boolean).join(' ')}</span>)}</div>
                        </div>
                        <div className="editorial-amount-wrap">
                          <div className={`editorial-amount ${t.type}`}>{isTransfer ? '⇄' : t.type === 'income' ? '+' : '-'}{currencySymbol}{parseFloat(t.amount).toFixed(2)}</div>
                          <div className="editorial-status">{isTransfer ? 'TRANSFER' : 'CLEARED'}</div>
                        </div>
                        {!bulkSelectMode && (
                          <button
                            onClick={(e) => handleDeleteTransaction(t, e)}
                            style={{ flexShrink: 0, background: 'none', border: 'none', padding: '0.25rem 0.4rem', cursor: 'pointer', color: 'var(--on-surface-variant)', opacity: 0.35, fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', transition: 'opacity 0.15s, color 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--error, #c0392b)'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = 0.35; e.currentTarget.style.color = 'var(--on-surface-variant)'; }}
                            title="Delete transaction"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
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
    const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6'];
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
        <div className="page-inner fade-in">
          <div className="section-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 className="section-title-editorial">Analytics</h2>
              {drillCategory && <button className="an-drill-chip" onClick={() => setDrillCategory(null)}>{drillCategory} ✕</button>}
            </div>
            <button className={`filter-toggle-btn ${showAnalyticsFilters ? 'active' : ''}`} onClick={() => setShowAnalyticsFilters(!showAnalyticsFilters)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>Filters</button>
          </div>
          <div className="filter-pills" style={{ marginTop: '1rem' }}>
            {['today', 'this_week', 'this_month', 'last_3m', 'this_year'].map(p => (
              <button key={p} className={`filter-pill ${analyticsFilters.preset === p ? 'active-pill' : ''}`} onClick={() => applyAnalyticsPreset(p)} style={{ textTransform: 'capitalize' }}>{p.replace(/_/g, ' ')}</button>
            ))}
          </div>
          {showAnalyticsFilters && (
            <div className="advanced-filters slide-up" style={{ marginTop: '1.5rem', background: 'var(--surface-container-low)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                <div className="filter-section"><p className="label-sm">Transaction Type</p><div className="type-toggle-bar" style={{ marginTop: '0.5rem', background: 'var(--surface-container-lowest)' }}>{['all', 'income', 'expense'].map(t => (<button key={t} className={`type-btn ${analyticsFilters.type === t ? (t === 'all' ? 'active-transfer' : `active-${t}`) : ''}`} onClick={() => updateAnalyticsFilter('type', t)} style={{ textTransform: 'capitalize' }}>{t}</button>))}</div></div>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}><button className="section-action-link" onClick={resetAnalyticsFilters}>Reset</button></div>
            </div>
          )}
          {/* KPI Row */}
          <div className="an-kpi-row">
            <div className="an-kpi-card an-kpi-income">
              <span className="an-kpi-label">Income</span>
              <span className="an-kpi-value">{currencySymbol}{analyticsKPIs.totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              {incomePct ? <span className={`an-kpi-trend ${incomePct.up ? 'up' : 'down'}`}>{incomePct.up ? '↑' : '↓'} {incomePct.label} vs prev</span> : <span className="an-kpi-sub">&nbsp;</span>}
            </div>
            <div className="an-kpi-card an-kpi-expense">
              <span className="an-kpi-label">Expenses</span>
              <span className="an-kpi-value">{currencySymbol}{analyticsKPIs.totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              {expensePct ? <span className={`an-kpi-trend ${!expensePct.up ? 'up' : 'down'}`}>{expensePct.up ? '↑' : '↓'} {expensePct.label} vs prev</span> : <span className="an-kpi-sub">&nbsp;</span>}
            </div>
            <div className="an-kpi-card an-kpi-net">
              <span className="an-kpi-label">Net Flow</span>
              <span className={`an-kpi-value${analyticsKPIs.net < 0 ? ' an-neg' : ''}`}>{analyticsKPIs.net >= 0 ? '+' : ''}{currencySymbol}{Math.abs(analyticsKPIs.net).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              {netPct ? <span className={`an-kpi-trend ${netPct.up ? 'up' : 'down'}`}>{netPct.up ? '↑' : '↓'} {netPct.label} vs prev</span> : <span className="an-kpi-sub">&nbsp;</span>}
            </div>
            <div className="an-kpi-card an-kpi-save">
              <span className="an-kpi-label">Savings Rate</span>
              <span className={`an-kpi-value${savRate !== null && savRate < 0 ? ' an-neg' : ''}`}>{savRate !== null ? `${savRate}%` : '—'}</span>
              <span className="an-kpi-sub">&nbsp;</span>
            </div>
            <div className="an-kpi-card an-kpi-burn">
              <span className="an-kpi-label">Daily Burn</span>
              <span className="an-kpi-value">{currencySymbol}{analyticsKPIs.dailyBurn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span className="an-kpi-sub">{analyticsKPIs.txCount} transactions</span>
            </div>
          </div>
          {/* Cash Flow — full width */}
          <div className="an-card" style={{ marginTop: '1.5rem' }}>
            <div className="an-card-header">
              <p className="an-card-title">Cash Flow{drillCategory && <span className="an-drill-tag">· {drillCategory}</span>}</p>
              <div className="an-legend">
                <span className="an-legend-item"><span className="an-legend-dot" style={{ background: '#10b981' }} />Income</span>
                <span className="an-legend-item"><span className="an-legend-dot" style={{ background: '#ef4444' }} />Expense</span>
                <span className="an-legend-item"><span className="an-legend-line" style={{ background: '#6366f1' }} />Net</span>
              </div>
            </div>
            {composedData.length === 0 ? <EmptyChart h={260} /> : (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={composedData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--on-surface-variant)', fontFamily: 'Inter' }} minTickGap={32} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--on-surface-variant)', fontFamily: 'Inter' }} tickFormatter={v => `${currencySymbol}${Math.abs(v) >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} width={52} />
                  <Tooltip content={<AnalyticsTooltip currencySymbol={currencySymbol} />} />
                  <ReferenceLine y={0} stroke="var(--ghost-border)" strokeDasharray="3 3" />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[3,3,0,0]} maxBarSize={18} opacity={0.85} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3,3,0,0]} maxBarSize={18} opacity={0.85} />
                  <Line type="monotone" dataKey="net" name="Net" stroke="#6366f1" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Category Breakdown + Top Payees */}
          <div className="an-two-col" style={{ marginTop: '1.5rem' }}>
            <div className="an-card">
              <div className="an-card-header">
                <p className="an-card-title">Category Breakdown</p>
                <span className="an-card-hint">click to drill</span>
              </div>
              {chartCategorical.length === 0 ? <EmptyChart h={240} msg="No expense data" /> : (
                <div className="an-cat-split">
                  <div style={{ width: '160px', flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={chartCategorical} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value" onClick={d => setDrillCategory(drillCategory === d.name ? null : d.name)} style={{ cursor: 'pointer' }}>
                          {chartCategorical.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={drillCategory === entry.name ? '#fff' : 'none'} strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<AnalyticsTooltip currencySymbol={currencySymbol} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="an-cat-legend-list">
                    {chartCategorical.map((entry, i) => (
                      <button key={entry.name} className={`an-cat-legend-row${drillCategory === entry.name ? ' active' : ''}`} onClick={() => setDrillCategory(drillCategory === entry.name ? null : entry.name)}>
                        <span className="an-cat-legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="an-cat-legend-name">{entry.name}</span>
                        <span className="an-cat-legend-pct">{totalCatVal > 0 ? `${Math.round(entry.value / totalCatVal * 100)}%` : ''}</span>
                        <span className="an-cat-legend-val">{currencySymbol}{entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="an-card">
              <div className="an-card-header">
                <p className="an-card-title">Top Payees</p>
                {topPayees.length > 0 && <span className="an-card-hint">by expense</span>}
              </div>
              {topPayees.length === 0 ? <EmptyChart h={240} msg="No party data" /> : (
                <ResponsiveContainer width="100%" height={Math.max(240, topPayees.length * 34)}>
                  <BarChart data={topPayees} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fontFamily: 'Inter', fill: 'var(--on-surface)' }} width={80} />
                    <Tooltip content={<AnalyticsTooltip currencySymbol={currencySymbol} />} />
                    <Bar dataKey="value" name="Amount" radius={[0, 5, 5, 0]} barSize={16}>
                      {topPayees.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          {/* Tag Density */}
          {chartTags.length > 0 && (
            <div className="an-card" style={{ marginTop: '1.5rem' }}>
              <div className="an-card-header">
                <p className="an-card-title">Tag Density{drillCategory && <span className="an-drill-tag">· {drillCategory}</span>}</p>
              </div>
              <ResponsiveContainer width="100%" height={Math.max(160, chartTags.length * 36)}>
                <BarChart data={chartTags} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fontFamily: 'Inter', fill: 'var(--on-surface)' }} width={80} />
                  <Tooltip cursor={{ fill: 'var(--surface-container-low)' }} content={<AnalyticsTooltip currencySymbol={currencySymbol} />} />
                  <Bar dataKey="value" name="Amount" fill="#8b5cf6" radius={[0, 5, 5, 0]} barSize={20} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  if (view === 'budgets') {
    return (
      <PageShell {...shellProps}>
        <div className="page-inner fade-in">
          <div className="section-header-row"><h2 className="section-title-editorial">Budgets</h2><button className="add-cat-btn" onClick={() => { setBudgetForm({ id: null, category_id: '', amount_limit: '', period: 'monthly' }); setShowBudgetModal(true); }}>Add Budget</button></div>
          {showBudgetModal && (
            <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
              <div className="modal-content fluid-input-area" onClick={e => e.stopPropagation()}>
                <h3 className="headline-md">Manage Budget</h3>
                <form onSubmit={handleSaveBudget} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                  <CustomDropdown label="Category (Optional)" options={[{ value: '', label: '-- Global Budget --' }, ...categories.filter(c => !c.parent_id).map(c => ({ value: c.id, label: c.name, icon: c.icon }))]} value={budgetForm.category_id} onChange={val => setBudgetForm({ ...budgetForm, category_id: val })} />
                  <div className="category-selection-area"><p className="label-sm">Limit Amount</p><input type="number" step="0.01" className="text-input" value={budgetForm.amount_limit} onChange={e => setBudgetForm({ ...budgetForm, amount_limit: e.target.value })} required /></div>
                  <CustomDropdown label="Period" options={[{ value: 'monthly', label: 'Monthly' }, { value: 'weekly', label: 'Weekly' }, { value: 'quarterly', label: 'Quarterly' }]} value={budgetForm.period} onChange={val => setBudgetForm({ ...budgetForm, period: val })} />
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="add-cat-btn" style={{ flex: 1 }}>Save Budget</button>
                    <button type="button" className="icon-btn-text" onClick={() => setShowBudgetModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="budget-list" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {budgetProgress.map(b => {
              const cat = categories.find(c => c.id === b.category_id);
              return (
                <div key={b.id} className="analytics-card-sm">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="editorial-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>{cat?.icon || '🌍'}</div>
                      <div className="editorial-title">{cat?.name || 'Global Budget'}</div>
                    </div>
                    <button className="icon-btn-text" onClick={() => { setBudgetForm({ id: b.id, category_id: b.category_id || '', amount_limit: b.limit_amount.toString(), period: b.period }); setShowBudgetModal(true); }}>✎</button>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="body-md">Spent: <strong>{currencySymbol}{b.spent.toLocaleString()}</strong></span>
                      <span className="body-md" style={{ opacity: 0.6 }}>Limit: {currencySymbol}{b.limit_amount.toLocaleString()}</span>
                    </div>
                    <div className="cat-bar-track"><div className="cat-bar-fill" style={{ width: `${b.pct}%`, background: b.status === 'over' ? 'var(--tertiary-fixed-variant)' : b.status === 'warning' ? '#f59e0b' : 'var(--secondary)' }} /></div>
                    <p className="label-sm" style={{ marginTop: '0.75rem', color: b.status === 'over' ? 'var(--tertiary-fixed-variant)' : 'inherit' }}>
                      {b.status === 'over' ? `Over by ${currencySymbol}${(b.spent - b.limit_amount).toLocaleString()}` : `${currencySymbol}${b.remaining.toLocaleString()} remaining`}
                    </p>
                  </div>
                </div>
              );
            })}
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
                {sparklineData.map((val, i) => {
                  const max = Math.max(...sparklineData, 1);
                  return (
                    <div key={i} className={`chart-bar${i === sparklineData.length - 1 ? ' active' : ''}`} style={{ height: `${Math.max(8, Math.round((val / max) * 100))}%` }} />
                  );
                })}
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
              {(() => {
                const maxBal = Math.max(...accounts.map(a => Math.abs(accountBalances[a.id] || 0)), 1);
                const renderRow = (a, excluded) => {
                  const bal = accountBalances[a.id] || 0;
                  const meta = ACCT_META[a.type || 'asset'];
                  const pct = Math.min(Math.abs(bal) / maxBal * 100, 100);
                  return (
                    <div key={a.id} className={`acct-bal-item${excluded ? ' acct-bal-excluded' : ''}`}>
                      <div className="acct-bal-icon" style={{ background: `${meta.color}18`, color: meta.color }}>{meta.icon}</div>
                      <div className="acct-bal-info">
                        <div className="acct-bal-name">{a.name}</div>
                        <div className="acct-bal-meta">
                          <span className="acct-bal-type" style={{ color: meta.color }}>{meta.label}</span>
                          {excluded && <span className="acct-bal-excl">excl.</span>}
                        </div>
                        <div className="acct-bal-bar-track">
                          <div className="acct-bal-bar-fill" style={{ width: `${pct}%`, background: bal < 0 ? 'var(--tertiary-fixed-variant)' : meta.color }} />
                        </div>
                      </div>
                      <span className={`acct-bal-val${bal < 0 ? ' neg' : ''}`}>{currencySymbol}{bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  );
                };
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {accounts.filter(a => !a.exclude_from_total).map(a => renderRow(a, false))}
                    {accounts.filter(a => a.exclude_from_total).map(a => renderRow(a, true))}
                    {accounts.length === 0 && <p className="body-md" style={{ opacity: 0.6 }}>No accounts yet.</p>}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
