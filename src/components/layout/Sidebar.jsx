import React from 'react';

// Sidebar — desktop left-rail navigation
const Sidebar = ({ view, onDashboard, onLedger, onAnalytics, onBudgets, onNewTx, onSettings, onLogout, collapsed, setCollapsed }) => {
  const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', onClick: onDashboard, icon: 'dashboard' },
    { key: 'ledger', label: 'Transactions', onClick: onLedger, icon: 'receipt_long' },
    { key: 'analytics', label: 'Analytics', onClick: onAnalytics, icon: 'insights' },
    { key: 'budgets', label: 'Budgets', onClick: onBudgets, icon: 'account_balance_wallet' },
  ];
  return (
    <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-screen transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] bg-surface border-r border-outline-variant/10 z-[60] ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand area */}
      <div className="pt-10 pb-12 px-6 flex items-center gap-4">
        <div className={`transition-all duration-500 ${collapsed ? 'w-8 h-8' : 'w-10 h-10'}`}>
          <img src="/logo.svg" alt="MOMA" className="w-full h-full object-contain filter brightness-110" />
        </div>
        {!collapsed && (
          <span className="text-on-surface font-headline text-2xl font-black tracking-[-0.05em] fade-in">
            MOMA
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = view === item.key;
          return (
            <button
              key={item.key}
              className={`group flex items-center relative w-full h-12 rounded-xl transition-all duration-300 ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.03]'}`}
              onClick={item.onClick}
            >
              <div className="w-14 flex items-center justify-center shrink-0">
                <span className={`material-symbols-outlined transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
              </div>
              {!collapsed && (
                <span className="font-['Inter'] text-[13px] font-semibold tracking-wide uppercase fade-in">
                  {item.label}
                </span>
              )}
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_12px_rgba(63,255,139,0.4)]"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="px-3 pb-8 space-y-1">
        <button 
          className="flex items-center w-full h-12 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.03] transition-all duration-300"
          onClick={onSettings}
        >
          <div className="w-14 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined">settings</span>
          </div>
          {!collapsed && <span className="font-['Inter'] text-[13px] font-semibold tracking-wide uppercase fade-in">Settings</span>}
        </button>
        
        <button 
          className="flex items-center w-full h-12 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/[0.05] transition-all duration-300"
          onClick={onLogout}
        >
          <div className="w-14 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined">logout</span>
          </div>
          {!collapsed && <span className="font-['Inter'] text-[13px] font-semibold tracking-wide uppercase fade-in">Logout</span>}
        </button>

        {/* Floating New Transaction FAB - Minimal version */}
        <div className="pt-6 px-2">
          <button 
            className={`flex items-center justify-center gap-3 bg-primary text-on-primary rounded-2xl shadow-lg shadow-primary/10 active:scale-95 transition-all duration-300 overflow-hidden ${collapsed ? 'w-10 h-10 mx-auto' : 'w-full h-12'}`}
            onClick={onNewTx}
          >
            <span className="material-symbols-outlined shrink-0">add</span>
            {!collapsed && <span className="font-bold text-xs uppercase tracking-widest whitespace-nowrap fade-in">New Entry</span>}
          </button>
        </div>
      </div>
      
      {/* Collapse Toggle - Now more subtle */}
      <button 
        className="absolute -right-3 top-12 w-6 h-6 bg-surface border border-outline-variant rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all shadow-xl"
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
