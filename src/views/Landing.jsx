import React from 'react';

const Landing = ({ session, setView }) => (
  <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 overflow-hidden relative">
    {/* Decorative */}
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-fixed rounded-full blur-[140px] -translate-y-1/3 translate-x-1/3 opacity-60"></div>
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-container rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 opacity-30"></div>

    <div className="relative z-10 max-w-xl text-center space-y-12 fade-in">
      <div className="space-y-6 flex flex-col items-center">
        {/* Logo mark */}
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
          <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant font-semibold">Your Financial Sanctuary</p>
          <h1 className="text-5xl md:text-7xl font-extrabold text-primary tracking-tight leading-[1.05]">
            MOMA
          </h1>
        </div>

        <p className="text-on-surface-variant text-lg md:text-xl max-w-sm mx-auto leading-relaxed font-light">
          Breathe through your finances. An editorial ledger designed for intentional living.
        </p>
      </div>

      <div className="flex flex-col items-center gap-5">
        <button
          className="w-full md:w-auto px-14 py-5 bg-primary text-on-primary rounded-full font-bold text-base shadow-xl shadow-primary/25 active:scale-[0.98] transition-all hover:brightness-110"
          onClick={() => session ? setView('dashboard') : setView('auth')}
        >
          Enter Sanctuary
        </button>
        <p className="text-xs text-on-surface-variant font-medium">End-to-End Encrypted · Open Source</p>
      </div>
    </div>
  </div>
);

export default Landing;
