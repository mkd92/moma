import React, { useState, useRef, useEffect } from 'react';
import { useAppDataContext } from '../../hooks';

const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener, { passive: true });
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const AccountSelector = ({ align = 'left' }) => {
  const { accounts, defaultAccountId, setDefaultAccountId, handleSetDefaultAccount } = useAppDataContext();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const selected = accounts?.find(a => a.id === defaultAccountId) || accounts?.[0];
  if (!accounts?.length) return null;

  const handleSelect = (id) => {
    setDefaultAccountId(id);          // optimistic UI update
    handleSetDefaultAccount(id);      // persist to Supabase
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all ${open ? 'bg-primary text-on-primary' : 'bg-surface-low text-on-surface hover:bg-surface-high'}`}
      >
        <span className="material-symbols-outlined text-[16px]">account_balance</span>
        <span className="max-w-[120px] truncate">{selected?.name || 'Account'}</span>
        <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {open && (
        <div className={`absolute top-full mt-2 min-w-[180px] bg-surface-lowest rounded-2xl shadow-[0_8px_24px_rgba(77,97,75,0.14)] overflow-hidden z-50 fade-in ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {accounts.map(a => {
            const isActive = a.id === defaultAccountId;
            return (
              <button
                key={a.id}
                onPointerDown={(e) => { e.stopPropagation(); handleSelect(a.id); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${isActive ? 'bg-primary-fixed text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>account_balance</span>
                <span className="truncate">{a.name}</span>
                {isActive && <span className="material-symbols-outlined text-[14px] ml-auto text-primary">check</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AvatarMenu = ({ session, onLogout, onSettings }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const email = session?.user?.email || '';
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shadow-sm transition-all duration-200 ring-2 ${open ? 'ring-primary' : 'ring-transparent hover:ring-primary/30'}`}
        style={{ background: open ? 'var(--primary)' : 'var(--primary-fixed)' }}
      >
        {email ? (
          <span className="font-bold text-sm" style={{ color: open ? 'var(--on-primary)' : 'var(--primary)' }}>
            {initial}
          </span>
        ) : (
          <span className="material-symbols-outlined text-base text-primary">person</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-56 bg-surface-lowest rounded-2xl shadow-[0_8px_32px_rgba(77,97,75,0.16)] overflow-hidden z-50 fade-in">
          {/* User info */}
          <div className="px-4 py-3.5 border-b border-outline-variant/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-0.5">Signed in as</p>
            <p className="text-sm font-semibold text-on-surface truncate">{email}</p>
          </div>

          {/* Settings — mobile only */}
          <button
            className="md:hidden w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors text-left"
            onClick={() => { onSettings(); setOpen(false); }}
          >
            <span className="material-symbols-outlined text-[16px]">settings</span>
            Settings
          </button>

          {/* Sign out */}
          <button
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/[0.06] transition-colors text-left"
            onClick={() => { onLogout(); setOpen(false); }}
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

const TopHeader = ({ session, theme, onToggleTheme }) => {
  const { shellProps } = useAppDataContext();

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 flex justify-between items-center px-6 md:px-8 h-16 bg-surface/80 glass-nav">

      {/* Mobile branding */}
      <div className="flex md:hidden items-center gap-3">
        <img src="/favicon.svg" alt="MOMA" className="w-8 h-8 rounded-lg" />
      </div>

      {/* Desktop left: branding + account selector */}
      <div className="hidden md:flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black text-primary tracking-tighter text-base">MOMA</span>
            <span className="text-[9px] font-semibold text-on-surface-variant/50 uppercase tracking-[0.18em]">Financial Sanctuary</span>
          </div>
        </div>
        <div className="w-px h-5 bg-outline-variant/30" />
        <AccountSelector />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Account selector — mobile */}
        <div className="md:hidden">
          <AccountSelector align="right" />
        </div>

        {/* Theme toggle */}
        <div className="flex bg-surface-container rounded-full p-1">
          <button
            onClick={() => theme !== 'light' && onToggleTheme()}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${theme === 'light' ? 'bg-surface-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            title="Light mode"
          >
            <span className="material-symbols-outlined text-[16px]">light_mode</span>
          </button>
          <button
            onClick={() => theme !== 'dark' && onToggleTheme()}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${theme === 'dark' ? 'bg-surface-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            title="Dark mode"
          >
            <span className="material-symbols-outlined text-[16px]">dark_mode</span>
          </button>
        </div>

        {/* Avatar with dropdown */}
        <AvatarMenu
          session={session}
          onLogout={shellProps?.onLogout}
          onSettings={shellProps?.onSettings}
        />
      </div>
    </nav>
  );
};

export default TopHeader;
