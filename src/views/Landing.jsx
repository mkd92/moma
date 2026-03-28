import React from 'react';

const Landing = ({ session, setView }) => {
  return (
    <div className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center p-8 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#3fff8b]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#6e9bff]/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative z-10 max-w-xl text-center space-y-12 fade-in">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a] border border-white/5 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#3fff8b] animate-pulse"></span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">The Digital Ledger</span>
          </div>
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-[1.1]">
            Architectural Clarity for <span className="text-[#3fff8b]">Wealth.</span>
          </h1>
          <p className="text-zinc-500 font-medium text-lg md:text-xl max-w-md mx-auto leading-relaxed">
            A premium financial ecosystem designed for the modern era of asset management.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button 
            className="w-full md:w-auto px-12 py-5 bg-gradient-to-br from-[#3fff8b] to-[#13ea79] text-[#005d2c] rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(63,255,139,0.2)] active:scale-95 transition-all hover:brightness-110"
            onClick={() => session ? setView('dashboard') : setView('auth')}
          >
            Enter Vault
          </button>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">End-to-End Encrypted · Open Source</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
