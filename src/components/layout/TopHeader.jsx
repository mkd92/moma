import React from 'react';
import Logo from './Logo';

const TopHeader = ({ session, theme, onToggleTheme, collapsed }) => (
  <nav className={`fixed top-0 right-0 left-0 z-50 flex justify-between items-center px-6 h-16 bg-surface/80 backdrop-blur-xl border-b border-outline-variant transition-all duration-300 ${collapsed ? 'md:left-20' : 'md:left-64'}`}>
    <div className="flex items-center gap-3">
      <Logo className="w-8 h-8 text-on-surface" />
      <span className="font-headline font-black text-xl tracking-tight text-on-surface">MOMA</span>
    </div>
    
    <div className="flex items-center gap-4">
      {/* Refined Theme Switcher based on the vertical pill in image */}
      <div className="flex bg-surface-low rounded-full p-1 border border-outline-variant shadow-inner">
        <button 
          onClick={() => theme !== 'light' && onToggleTheme()}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${theme === 'light' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined text-[18px]">light_mode</span>
        </button>
        <button 
          onClick={() => theme !== 'dark' && onToggleTheme()}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${theme === 'dark' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined text-[18px]">dark_mode</span>
        </button>
      </div>

      <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-low border border-outline-variant flex items-center justify-center">
        {session?.user?.email ? (
          <div className="w-full h-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
            {session.user.email.charAt(0).toUpperCase()}
          </div>
        ) : (
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>person</span>
        )}
      </div>
    </div>
  </nav>
);

export default TopHeader;
