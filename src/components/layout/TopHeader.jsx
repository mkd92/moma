import React from 'react';

const TopHeader = ({ session, theme, onToggleTheme, collapsed }) => (
  <nav className={`fixed top-0 right-0 left-0 z-50 flex justify-between items-center px-6 h-16 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300 ${collapsed ? 'md:left-20' : 'md:left-64'}`}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 shrink-0">
        <img src="/logo.svg" alt="MOMA" className="w-full h-full object-contain" />
      </div>
      <span className="font-['Manrope'] font-bold text-2xl tracking-tighter text-[#3fff8b]">MOMA</span>
    </div>
    <div className="flex items-center gap-2">
      <button className="p-2 text-zinc-400 hover:text-[#3fff8b] active:scale-95 transition-all" onClick={onToggleTheme}>
        <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
      </button>
      <button className="p-2 text-zinc-400 hover:text-[#3fff8b] active:scale-95 transition-all">
        <span className="material-symbols-outlined">search</span>
      </button>
    </div>
  </nav>
);

export default TopHeader;
