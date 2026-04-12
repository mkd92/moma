import React from 'react';
import { PageShell } from '../components/layout';
import CustomDropdown from '../components/CustomDropdown';
import { CURRENCY_SYMBOLS } from '../constants';

import { useAppDataContext } from '../hooks';

const Settings = () => {
  const { 
    currencyCode, 
    session,
    isLoading,
    setCurrencyCode, 
    setView, 
    shellProps,
    refreshData
  } = useAppDataContext();

  const handleLogout = shellProps.onLogout;

  const currencyOptions = Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => ({ 
    value: code, 
    label: code + ' (' + sym + ')',
    icon: 'payments'
  }));

  return (
    <PageShell view="settings" onRefresh={refreshData} isLoading={isLoading}>
      <div className="page-inner max-w-2xl mx-auto space-y-12 pb-32 pt-4 md:pt-0 px-6">
        <div className="flex justify-between items-center px-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Settings</h2>
        </div>

        <div className="space-y-12">
          {/* Preferences Section */}
          <section className="space-y-6">
            <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase px-1">Preferences</p>
            <div className="bg-surface-lowest rounded-[2rem] p-8 md:p-10 shadow-[0_8px_24px_rgba(77,97,75,0.08)] space-y-10">
              <CustomDropdown 
                label="Primary Currency" 
                options={currencyOptions} 
                value={currencyCode} 
                onChange={setCurrencyCode} 
              />
            </div>
          </section>

          {/* Management Section */}
          <section className="space-y-6">
            <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase px-1">Manage</p>
            <div className="bg-surface-lowest rounded-[2rem] overflow-hidden shadow-[0_8px_24px_rgba(77,97,75,0.08)]">
              {[
                { key: 'account_management', label: 'Accounts', icon: 'account_balance', desc: 'Banks, wallets, and assets' },
                { key: 'category_management', label: 'Categories', icon: 'category', desc: 'Spending and income classification' },
                { key: 'party_management', label: 'Payees', icon: 'storefront', desc: 'Merchants and sources' },
                { key: 'tag_management', label: 'Tags', icon: 'label', desc: 'Custom metadata labels' }
              ].map(item => (
                <button 
                  key={item.key}
                  className="w-full p-7 flex items-center justify-between group hover:bg-surface-low transition-all text-left border-b border-outline-variant/20 last:border-0"
                  onClick={() => setView(item.key)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-11 h-11 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                      <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">{item.label}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium mt-1 opacity-60">{item.desc}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface transition-all group-hover:translate-x-1 opacity-20">chevron_right</span>
                </button>
              ))}
            </div>
          </section>

          {/* Account/Security Section */}
          <section className="space-y-6">
            <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase px-1">Account</p>
            <div className="bg-surface-lowest rounded-[2rem] p-8 shadow-[0_8px_24px_rgba(77,97,75,0.08)] space-y-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20">
                  {session?.user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold text-on-surface leading-none">{session?.user?.email}</p>
                  <p className="text-xs text-primary font-medium mt-1">Active Session</p>
                </div>
              </div>
              <button
                className="w-full bg-surface-low text-on-surface hover:bg-error hover:text-on-primary py-4 rounded-full font-semibold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
};

export default Settings;
