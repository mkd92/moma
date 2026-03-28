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
    <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-screen transition-all duration-300 border-r border-zinc-800/15 bg-[#131313] z-[60] ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-8 flex items-center gap-3">
        <div className="w-8 h-8 shrink-0">
          <img src="/logo.svg" alt="MOMA" className="w-full h-full object-contain" />
        </div>
        {!collapsed && <span className="text-[#3fff8b] font-bold font-headline text-3xl tracking-tighter">MOMA</span>}
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

export default Sidebar;
