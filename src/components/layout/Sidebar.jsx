import React from 'react';
import Logo from './Logo';

// Sidebar — desktop left-rail navigation
const Sidebar = ({ view, onDashboard, onLedger, onAnalytics, onBudgets, onNewTx, onSettings, onLogout, collapsed, setCollapsed }) => {
  const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', onClick: onDashboard, icon: 'dashboard' },
    { key: 'ledger', label: 'Transactions', onClick: onLedger, icon: 'receipt_long' },
    { key: 'analytics', label: 'Analytics', onClick: onAnalytics, icon: 'insights' },
    { key: 'budgets', label: 'Budgets', onClick: onBudgets, icon: 'account_balance_wallet' },
  ];
  return (
    <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-screen transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] bg-surface-container z-[60] ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand area */}
      <div className="pt-10 pb-10 px-6 flex items-center gap-3">
        <Logo className={`transition-all duration-500 text-on-surface ${collapsed ? 'w-8 h-8' : 'w-10 h-10'}`} />
        {!collapsed && (
          <span className="text-on-surface font-headline text-2xl font-black tracking-[-0.05em] fade-in">
            MOMA
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map(item => {
          const isActive = view === item.key;
          return (
            <button
              key={item.key}
              className={`group flex items-center w-full h-11 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary text-on-primary shadow-lg shadow-black/10' : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.05]'}`}
              onClick={item.onClick}
            >
              <div className="w-12 flex items-center justify-center shrink-0">
                <span className={`material-symbols-outlined text-[22px] transition-transform duration-300 ${isActive ? 'scale-105' : 'group-hover:scale-110'}`} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
              </div>
              {!collapsed && (
                <span className="font-['Inter'] text-[13px] font-bold tracking-tight fade-in">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="px-4 pb-8 space-y-2">
        <button 
          className="flex items-center w-full h-11 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.03] transition-all duration-300"
          onClick={onSettings}
        >
          <div className="w-12 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </div>
          {!collapsed && <span className="font-['Inter'] text-[13px] font-bold tracking-tight fade-in">Settings</span>}
        </button>
        
        <button 
          className="flex items-center w-full h-11 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/[0.05] transition-all duration-300"
          onClick={onLogout}
        >
          <div className="w-12 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">logout</span>
          </div>
          {!collapsed && <span className="font-['Inter'] text-[13px] font-bold tracking-tight fade-in">Logout</span>}
        </button>

        {/* Floating New Transaction FAB - More integrated like the image */}
        <div className="pt-4">
          <button 
            className={`flex items-center justify-center gap-2 bg-on-surface text-surface rounded-xl shadow-xl active:scale-95 transition-all duration-300 overflow-hidden ${collapsed ? 'w-11 h-11 mx-auto' : 'w-full h-11'}`}
            onClick={onNewTx}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">add</span>
            {!collapsed && <span className="font-bold text-[12px] uppercase tracking-wider whitespace-nowrap fade-in">New Entry</span>}
          </button>
        </div>
      </div>
      
      {/* Collapse Toggle - Subtly on the divider line if we had one, but keeping it simple */}
      <button 
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-container border border-outline-variant rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all shadow-md z-10"
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
