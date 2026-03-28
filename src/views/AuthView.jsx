import React from 'react';

const AuthView = ({ 
  setView, 
  authMode, 
  setAuthMode, 
  setAuthError, 
  handleAuth, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  authError, 
  authLoading, 
  handleGoogleSignIn 
}) => {
  return (
    <div className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#3fff8b]/5 rounded-full blur-[150px]"></div>
      
      <div className="w-full max-w-md space-y-8 relative z-10 fade-in">
        <div className="flex flex-col items-center gap-4">
          <button 
            className="self-start flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest" 
            onClick={() => setView('landing')}
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>
          <div className="w-16 h-16 rounded-[1.5rem] bg-[#1a1a1a] flex items-center justify-center border border-white/5 shadow-2xl">
            <span className="material-symbols-outlined text-[#3fff8b] text-3xl">token</span>
          </div>
          <h2 className="font-headline text-3xl font-extrabold text-white tracking-tight">Access Digital Ledger</h2>
        </div>

        <div className="bg-[#131313] p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl space-y-8">
          <div className="flex bg-[#0e0e0e] p-1.5 rounded-xl gap-1">
            <button 
              className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-[#3fff8b] text-[#005d2c] shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`} 
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
            >
              Log In
            </button>
            <button 
              className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${authMode === 'signup' ? 'bg-[#3fff8b] text-[#005d2c] shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`} 
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Email</p>
              <input 
                type="email" 
                placeholder="email@vault.com" 
                className="w-full bg-[#1a1a1a] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/30 transition-all text-sm font-medium"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Password</p>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-[#1a1a1a] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/30 transition-all text-sm font-medium"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            {authError && (
              <div className="p-4 bg-[#ff716c]/10 rounded-xl border border-[#ff716c]/20 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ff716c] text-sm">error</span>
                <p className="text-[10px] font-bold text-[#ff716c] uppercase tracking-wider leading-relaxed">{authError}</p>
              </div>
            )}
            <button 
              type="submit" 
              className="w-full bg-[#3fff8b] text-[#005d2c] py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 mt-4" 
              disabled={authLoading}
            >
              {authLoading ? 'Verifying...' : authMode === 'login' ? 'Enter Vault' : 'Initialize Account'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#131313] px-4 text-zinc-600 font-bold tracking-widest">Or Secure Link</span></div>
          </div>

          <button 
            type="button" 
            className="w-full bg-[#1a1a1a] text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-white/5 hover:bg-[#262626] transition-all active:scale-[0.98]" 
            onClick={handleGoogleSignIn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
