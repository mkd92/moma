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
    label: code + ' (' + sym + ')',
    icon: 'payments'
  }));

  return (
    <PageShell {...shellProps}>
      <div className="page-inner max-w-2xl mx-auto space-y-12 pb-32 pt-4 md:pt-0">
        <div className="flex justify-between items-center px-4">
          <h2 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase">Vault Core</h2>
        </div>

        <div className="space-y-12">
          {/* Preferences Section */}
          <section className="space-y-6">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">System Config</p>
            <div className="bg-surface-low rounded-[2.5rem] border border-outline-variant/10 overflow-hidden divide-y divide-outline-variant/5 shadow-2xl">
              <div className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-on-surface/[0.02] transition-colors group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[22px]">currency_exchange</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Base Currency</p>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">Primary display unit</p>
                  </div>
                </div>
                <div className="w-full sm:w-56">
                  <CustomDropdown options={currencyOptions} value={currencyCode} onChange={setCurrencyCode} showSearch={true} />
                </div>
              </div>

              <div className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-on-surface/[0.02] transition-colors group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[22px]">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Atmosphere</p>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">Visual rendering mode</p>
                  </div>
                </div>
                <div className="flex bg-on-surface/[0.03] p-1 rounded-2xl gap-1 border border-outline-variant/5 w-full sm:w-auto">
                  <button 
                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-on-surface text-surface shadow-xl scale-[1.02]' : 'text-on-surface-variant hover:text-on-surface'}`}
                    onClick={() => theme !== 'light' && toggleTheme()}
                  >
                    <span className="material-symbols-outlined text-[16px]">light_mode</span>
                    Light
                  </button>
                  <button 
                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-on-surface text-surface shadow-xl scale-[1.02]' : 'text-on-surface-variant hover:text-on-surface'}`}
                    onClick={() => theme !== 'dark' && toggleTheme()}
                  >
                    <span className="material-symbols-outlined text-[16px]">dark_mode</span>
                    Dark
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Management Section */}
          <section className="space-y-6">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">Hierarchy Engine</p>
            <div className="bg-surface-low rounded-[2.5rem] border border-outline-variant/10 overflow-hidden divide-y divide-outline-variant/5 shadow-2xl">
              {[
                { key: 'account_management', label: 'Vault Entities', icon: 'account_balance', desc: 'Accounts, banks, and assets' },
                { key: 'category_management', label: 'Taxonomy', icon: 'category', desc: 'Transaction classifications' },
                { key: 'party_management', label: 'Nodes', icon: 'storefront', desc: 'Frequent payees and sources' },
                { key: 'tag_management', label: 'Metadata', icon: 'label', desc: 'Granular analytical labels' }
              ].map(item => (
                <button 
                  key={item.key}
                  className="w-full p-8 flex items-center justify-between group hover:bg-on-surface/[0.02] transition-all text-left"
                  onClick={() => setView(item.key)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors border border-outline-variant/5">
                      <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{item.label}</p>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">{item.desc}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-all group-hover:translate-x-1 opacity-40">chevron_right</span>
                </button>
              ))}
            </div>
          </section>

          {/* User Section */}
          <section className="space-y-6">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">Access Control</p>
            <div className="bg-surface-low p-10 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl space-y-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-on-surface text-surface flex items-center justify-center font-black text-2xl shadow-xl">
                  {session?.user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-black text-on-surface tracking-tight leading-none">{session?.user?.email}</p>
                  <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mt-2">Vault Protocol Active</p>
                </div>
              </div>
              <button 
                className="w-full bg-on-surface/[0.03] text-on-surface hover:bg-error hover:text-on-primary py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 border border-outline-variant/10 transition-all active:scale-[0.98] group"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">power_settings_new</span>
                De-Authorize Vault
              </button>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
};

export default Settings;
