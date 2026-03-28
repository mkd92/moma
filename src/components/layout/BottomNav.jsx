import React from 'react';

// Bottom navigation bar — mobile only
const BottomNav = ({ view, onDashboard, onLedger, onAnalytics, onSettings, onNewTx }) => {
  const settingsViews = ['settings', 'account_management', 'category_management', 'party_management', 'tag_management'];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface/80 backdrop-blur-xl shadow-2xl">
      <button className={`flex flex-col items-center justify-center transition-all duration-300 ${view === 'dashboard' ? 'text-primary' : 'text-on-surface-variant'}`} onClick={onDashboard}>
        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: view === 'dashboard' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
        <span className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.05em] mt-1">Home</span>
      </button>
      <button className={`flex flex-col items-center justify-center transition-all duration-300 ${view === 'ledger' ? 'text-primary' : 'text-on-surface-variant'}`} onClick={onLedger}>
        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: view === 'ledger' ? "'FILL' 1" : "'FILL' 0" }}>list_alt</span>
        <span className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.05em] mt-1">History</span>
      </button>
      <button className="flex flex-col items-center justify-center bg-on-surface text-surface w-16 h-16 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] active:scale-90 transition-all -translate-y-6 border-4 border-surface group" onClick={onNewTx}>
        <span className="material-symbols-outlined transition-transform duration-300 group-hover:rotate-90" style={{ fontSize: '32px', fontVariationSettings: "'wght' 700" }}>add</span>
      </button>
      <button className={`flex flex-col items-center justify-center transition-all duration-300 ${view === 'analytics' ? 'text-primary' : 'text-on-surface-variant'}`} onClick={onAnalytics}>
        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: view === 'analytics' ? "'FILL' 1" : "'FILL' 0" }}>pie_chart</span>
        <span className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.05em] mt-1">Charts</span>
      </button>
      <button className={`flex flex-col items-center justify-center transition-all duration-300 ${settingsViews.includes(view) ? 'text-primary' : 'text-on-surface-variant'}`} onClick={onSettings}>
        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: settingsViews.includes(view) ? "'FILL' 1" : "'FILL' 0" }}>manage_accounts</span>
        <span className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.05em] mt-1">Settings</span>
      </button>
    </nav>
  );
};

export default BottomNav;
