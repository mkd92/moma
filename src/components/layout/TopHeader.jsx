import React from 'react';

const TopHeader = ({ session, theme, onToggleTheme, collapsed }) => (
  <nav className={`fixed top-0 right-0 left-0 z-50 flex justify-between items-center px-6 h-16 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300 ${collapsed ? 'md:left-20' : 'md:left-64'}`}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1a1a1a] border border-white/5 flex items-center justify-center">
        {session?.user?.email ? (
          <div className="w-full h-full bg-[#3fff8b] text-[#005d2c] flex items-center justify-center font-bold text-xs">
            {session.user.email.charAt(0).toUpperCase()}
          </div>
        ) : (
          <span className="material-symbols-outlined text-zinc-500" style={{ fontSize: '20px' }}>person</span>
        )}
      </div>
      <span className="font-['Manrope'] font-bold text-xl tracking-tight text-[#3fff8b]">Editorial Finance</span>
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
