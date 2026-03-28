import React from 'react';

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

export default BottomNav;
