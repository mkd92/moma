import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { cacheClear } from '../cache';

export function useAuth() {
  const [session, setSession] = useState(null);
  const userIdRef = useRef(null);

  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) userIdRef.current = initialSession.user.id;
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        userIdRef.current = currentSession.user.id;
      } else {
        userIdRef.current = null;
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const { error } = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    
    if (error) {
      setAuthError(error.message);
    } else if (authMode === 'signup') {
      setAuthError('Check your email to verify your account.');
    }
    setAuthLoading(false);
  };

  const handleGoogleSignIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo: window.location.origin } 
    });
  }, []);

  const handleLogout = useCallback(async () => {
    if (userIdRef.current) {
      cacheClear(userIdRef.current);
      userIdRef.current = null;
    }
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    setSession,
    userIdRef,
    authMode,
    setAuthMode,
    email,
    setEmail,
    password,
    setPassword,
    authLoading,
    authError,
    setAuthError,
    handleAuth,
    handleGoogleSignIn,
    handleLogout
  };
}
