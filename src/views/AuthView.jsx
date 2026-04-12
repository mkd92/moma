import React from 'react';

const AuthView = ({
  authMode, setAuthMode, email, setEmail, password, setPassword,
  authLoading, authError, setAuthError, handleAuth, handleGoogleSignIn, setView
}) => (
  <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-fixed rounded-full blur-[160px] opacity-60"></div>

    <div className="w-full max-w-md space-y-8 relative z-10 fade-in">
      <div className="flex flex-col items-center gap-5">
        <button
          className="self-start flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium text-sm"
          onClick={() => setView('landing')}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>

        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
          <span className="material-symbols-outlined text-on-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-primary tracking-tight">Access MOMA</h2>
          <p className="text-on-surface-variant text-sm mt-1">Your financial sanctuary awaits</p>
        </div>
      </div>

      <div className="bg-surface-lowest rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(77,97,75,0.1)] space-y-7">
        {/* Mode toggle */}
        <div className="flex bg-surface-low p-1 rounded-2xl gap-1">
          <button
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-surface-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => { setAuthMode('login'); setAuthError(''); }}
          >
            Log In
          </button>
          <button
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${authMode === 'signup' ? 'bg-surface-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => { setAuthMode('signup'); setAuthError(''); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface-variant pl-1">Email</label>
            <input
              type="email"
              placeholder="user@example.com"
              className="w-full bg-surface-low border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-lowest transition-all text-sm outline-none placeholder:text-on-surface-variant/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface-variant pl-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-surface-low border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-lowest transition-all text-sm outline-none placeholder:text-on-surface-variant/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {authError && (
            <div className="p-4 bg-error/10 rounded-2xl flex items-center gap-3">
              <span className="material-symbols-outlined text-error text-sm">error</span>
              <p className="text-xs font-semibold text-error leading-relaxed">{authError}</p>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-4 rounded-full font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            disabled={authLoading}
          >
            {authLoading ? 'Verifying...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="relative flex items-center gap-4">
          <div className="flex-1 h-px bg-outline-variant"></div>
          <span className="text-xs text-on-surface-variant font-medium">or</span>
          <div className="flex-1 h-px bg-outline-variant"></div>
        </div>

        <button
          type="button"
          className="w-full bg-surface-low text-on-surface py-4 rounded-full font-semibold text-sm flex items-center justify-center gap-3 hover:bg-surface-high transition-all active:scale-[0.98]"
          onClick={handleGoogleSignIn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  </div>
);

export default AuthView;
