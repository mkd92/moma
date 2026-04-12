import React from 'react';

const Sidebar = ({ view, onDashboard, onLedger, onAnalytics, onBudgets, onNewTx, onSettings, onLogout, collapsed, setCollapsed }) => {
  const NAV_ITEMS = [
    { key: 'dashboard', label: 'Overview', onClick: onDashboard, icon: 'space_dashboard' },
    { key: 'ledger', label: 'Cash Flow', onClick: onLedger, icon: 'swap_vert' },
    { key: 'analytics', label: 'Analytics', onClick: onAnalytics, icon: 'monitoring' },
    { key: 'budgets', label: 'Budgeting', onClick: onBudgets, icon: 'account_balance_wallet' },
  ];

  return (
    <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-screen transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] bg-surface-low z-[60] ${collapsed ? 'w-20' : 'w-64'}`}>

      {/* Brand */}
      <div className={`pt-8 pb-8 flex items-center gap-3 ${collapsed ? 'px-5 justify-center' : 'px-6'}`}>
        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-on-primary-container text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
        </div>
        {!collapsed && (
          <div className="fade-in overflow-hidden">
            <h1 className="text-xl font-black text-primary tracking-tighter leading-none">MOMA</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60 mt-0.5">Financial Sanctuary</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 flex flex-col gap-1 ${collapsed ? 'px-3' : 'px-4'}`}>
        {NAV_ITEMS.map(item => {
          const isActive = view === item.key;
          return (
            <button
              key={item.key}
              className={`group flex items-center w-full h-12 rounded-xl transition-all duration-300 ${isActive ? 'bg-surface-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary hover:translate-x-0.5'}`}
              onClick={item.onClick}
            >
              <div className={`flex items-center justify-center shrink-0 ${collapsed ? 'w-full' : 'w-12'}`}>
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
              </div>
              {!collapsed && (
                <span className="text-sm font-semibold tracking-wide fade-in">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`pb-8 space-y-3 ${collapsed ? 'px-3' : 'px-4'}`}>
        {!collapsed && (
          <button
            className="w-full bg-secondary-container text-on-secondary-container py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-95 transition-all active:scale-[0.98] shadow-sm"
            onClick={onNewTx}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Entry
          </button>
        )}
        {collapsed && (
          <button
            className="w-full h-12 flex items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container hover:brightness-95 transition-all"
            onClick={onNewTx}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        )}

        <div className="space-y-1 pt-2">
          <button
            className={`flex items-center w-full h-11 rounded-xl text-on-surface-variant hover:text-primary transition-all duration-200 ${collapsed ? 'justify-center' : 'px-3 gap-4'}`}
            onClick={onSettings}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            {!collapsed && <span className="text-sm font-medium fade-in">Settings</span>}
          </button>

          <button
            className={`flex items-center w-full h-11 rounded-xl text-on-surface-variant hover:text-error transition-all duration-200 ${collapsed ? 'justify-center' : 'px-3 gap-4'}`}
            onClick={onLogout}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {!collapsed && <span className="text-sm font-medium fade-in">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-lowest rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-all shadow-md border border-outline-variant z-10"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
          {collapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>
    </aside>
  );
};

export default Sidebar;
