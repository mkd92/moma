import React from 'react';
import Logo from '../components/layout/Logo';

const Landing = ({ session, setView }) => (
  <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 overflow-hidden relative">
    {/* Decorative background elements */}
    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
    
    <div className="relative z-10 max-w-xl text-center space-y-12 fade-in">
      <div className="space-y-4 flex flex-col items-center">
        <div className="w-20 h-20 mb-4 text-on-surface">
          <Logo className="w-full h-full" />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-low border border-outline-variant mb-4">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">MOMA</span>
        </div>
        <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-on-surface tracking-tighter leading-[1.1]">
          Architectural Clarity for <span className="text-on-surface-variant italic font-light opacity-50">Wealth.</span>
        </h1>
        <p className="text-on-surface-variant font-medium text-lg md:text-xl max-w-md mx-auto leading-relaxed">
          A premium financial ecosystem designed for the modern era of asset management.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <button 
          className="w-full md:w-auto px-12 py-5 bg-on-surface text-surface rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all hover:brightness-110"
          onClick={() => session ? setView('dashboard') : setView('auth')}
        >
          Enter Vault
        </button>
        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">End-to-End Encrypted · Open Source</p>
      </div>
    </div>
  </div>
);

export default Landing;
