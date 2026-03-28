import React from 'react';
import { PageShell } from '../components/layout';
import CustomDropdown from '../components/CustomDropdown';
import { CURRENCY_SYMBOLS } from '../constants';

const Settings = ({ 
  shellProps, 
  currencyCode, 
  setCurrencyCode, 
  theme, 
  toggleTheme, 
  setView, 
  session, 
  handleLogout 
}) => {
  const currencyOptions = Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => ({ 
    value: code, 
    label: code + ' (' + sym + ')' 
  }));

  return (
    <PageShell {...shellProps}>
      <div className="page-inner max-w-2xl mx-auto space-y-10 pb-32">
        <div className="flex justify-between items-center px-2">
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#3fff8b]">Settings</h2>
        </div>

        <div className="space-y-8">
          {/* Preferences Section */}
          <section className="space-y-4">
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase px-2">Preferences</p>
            <div className="bg-surface-low rounded-[2.5rem] border border-outline-variant/10 overflow-hidden divide-y divide-white/5 shadow-2xl">
              <div className="p-6 flex items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-[#3fff8b]">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Default Currency</p>
                    <p className="text-xs text-zinc-500">System-wide display currency</p>
                  </div>
                </div>
                <div className="w-48">
                  <CustomDropdown options={currencyOptions} value={currencyCode} onChange={setCurrencyCode} showSearch={false} />
                </div>
              </div>

              <div className="p-6 flex items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-[#3fff8b]">
                    <span className="material-symbols-outlined">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Appearance</p>
                    <p className="text-xs text-zinc-500">Dark and Light mode</p>
                  </div>
                </div>
                <div className="flex bg-[#0e0e0e] p-1 rounded-xl gap-1 border border-white/5">
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-[#3fff8b] text-[#005d2c] shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => theme !== 'light' && toggleTheme()}
                  >
                    <span className="material-symbols-outlined text-sm">light_mode</span>
                    Light
                  </button>
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-[#3fff8b] text-[#005d2c] shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => theme !== 'dark' && toggleTheme()}
                  >
                    <span className="material-symbols-outlined text-sm">dark_mode</span>
                    Dark
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Management Section */}
          <section className="space-y-4">
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase px-2">Data Management</p>
            <div className="bg-surface-low rounded-[2.5rem] border border-outline-variant/10 overflow-hidden divide-y divide-white/5 shadow-2xl">
              {[
                { key: 'account_management', label: 'Accounts', icon: 'account_balance', desc: 'Bank, cash, and credit cards' },
                { key: 'category_management', label: 'Categories', icon: 'category', desc: 'Custom expense and income types' },
                { key: 'party_management', label: 'Parties', icon: 'storefront', desc: 'Frequent payees and sources' },
                { key: 'tag_management', label: 'Tags', icon: 'label', desc: 'Granular labels for analysis' }
              ].map(item => (
                <button 
                  key={item.key}
                  className="w-full p-6 flex items-center justify-between group hover:bg-white/5 transition-all text-left"
                  onClick={() => setView(item.key)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-zinc-400 group-hover:text-[#3fff8b] transition-colors">
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-[#3fff8b] transition-colors">{item.label}</p>
                      <p className="text-xs text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-zinc-700 group-hover:text-[#3fff8b] transition-all">chevron_right</span>
                </button>
              ))}
            </div>
          </section>

          {/* User Section */}
          <section className="space-y-4">
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase px-2">Account</p>
            <div className="bg-surface-low rounded-[2.5rem] border border-outline-variant/10 p-8 shadow-2xl space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#3fff8b] text-[#005d2c] flex items-center justify-center font-black text-xl">
                  {session?.user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{session?.user?.email}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Premium User</p>
                </div>
              </div>
              <button 
                className="w-full bg-[#1a1a1a] text-[#ff716c] py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-white/5 hover:bg-[#ff716c]/5 transition-all active:scale-[0.98]"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Sign Out from Vault
              </button>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
};

export default Settings;
